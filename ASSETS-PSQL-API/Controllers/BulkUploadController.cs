using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;
using System.Collections.Concurrent;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/bulk-upload")]
public class BulkUploadController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly BulkUploadValidationService _validator;
    private readonly IWebHostEnvironment _env;
    private readonly TransactionService _txnService;
    private readonly LookupService _lookupService;
    private readonly InternalApiClient _internalApi;
    private readonly EmailService _emailService;

    private static readonly ConcurrentDictionary<string, ProgressInfo> _progressTracker = new();

    public BulkUploadController(DbConnectionFactory db, BulkUploadValidationService validator, IWebHostEnvironment env, TransactionService txnService, LookupService lookupService, InternalApiClient internalApi, EmailService emailService)
    {
        _db = db;
        _validator = validator;
        _env = env;
        _txnService = txnService;
        _lookupService = lookupService;
        _internalApi = internalApi;
        _emailService = emailService;
    }

    [HttpGet("progress/{key}")]
    public IActionResult GetProgress(string key)
    {
        if (_progressTracker.TryGetValue(key, out var info))
            return Ok(info);
        return Ok(new ProgressInfo { Phase = "unknown", Percent = 0, Message = "No active process" });
    }

    [HttpPost("upload")]
    [RequestSizeLimit(100_000_000)]
    public async Task<IActionResult> Upload(IFormFile file, [FromForm] int? isDonated, [FromForm] string? progressKey, [FromForm] int? uploadType)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".xlsx" && ext != ".xls")
            return BadRequest(new { error = "Only .xlsx and .xls files are supported" });

        await using var connCheck = _db.CreateConnection();
        await connCheck.OpenAsync();
        var existingSuccessful = await connCheck.QueryFirstOrDefaultAsync<int?>(@"
            SELECT ""ID"" FROM ""Asset_BulkUploadJobs""
            WHERE ""Filename"" = @Filename
              AND ""Job_Status"" IN ('Completed Successfully!', 'Approved')
            OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", new { Filename = file.FileName });
        if (existingSuccessful != null)
            return BadRequest(new { error = "A file named '" + file.FileName + "' has already been uploaded successfully. Please rename your file or use a different filename." });

        var uploadsDir = Path.Combine(_env.ContentRootPath, "Uploads");
        Directory.CreateDirectory(uploadsDir);
        var savedFileName = Guid.NewGuid().ToString("N") + ext;
        var savedPath = Path.Combine(uploadsDir, savedFileName);
        using (var fs = new FileStream(savedPath, FileMode.Create))
        {
            await file.CopyToAsync(fs);
        }

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var jobId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_BulkUploadJobs"" (""Filename"", ""UserId"", ""IsDonated"", ""Activate_Validation"", ""Processed"", ""Date_Created"", ""Job_Status"", ""ValidationError_Path"", ""UploadType"")
            VALUES (@Filename, 1, @IsDonated, 1, 0, NOW(), 'New', @SavedPath, @UploadType)
            RETURNING ""ID""", new { Filename = file.FileName, IsDonated = isDonated, SavedPath = savedPath, UploadType = uploadType ?? 1 });

        var rows = new List<Dictionary<string, string>>();
        try
        {
            using var stream = new FileStream(savedPath, FileMode.Open, FileAccess.Read);
            using var workbook = new XLWorkbook(stream);
            var ws = workbook.Worksheets.First();
            var headerRow = ws.Row(1);
            var headers = new Dictionary<int, string>();
            for (int c = 1; c <= ws.LastColumnUsed()?.ColumnNumber(); c++)
            {
                var hdr = headerRow.Cell(c).GetString().Trim();
                if (!string.IsNullOrWhiteSpace(hdr)) headers[c] = hdr;
            }

            var headerAliases = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Current Replacemant Cost CRC", "Current Replacement Cost CRC" }
            };

            var headerToDbCol = new Dictionary<int, string>();
            for (int i = 0; i < BulkUploadValidationService.ExcelHeaders.Length; i++)
            {
                var excelHdr = BulkUploadValidationService.ExcelHeaders[i];
                var dbCol = BulkUploadValidationService.DbColumns[i];
                foreach (var kv in headers)
                {
                    var normalizedHdr = kv.Value;
                    if (headerAliases.ContainsKey(normalizedHdr))
                        normalizedHdr = headerAliases[normalizedHdr];
                    if (string.Equals(normalizedHdr, excelHdr, StringComparison.OrdinalIgnoreCase))
                    {
                        headerToDbCol[kv.Key] = dbCol;
                        break;
                    }
                }
            }
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            for (int r = 2; r <= lastRow; r++)
            {
                var rowData = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                var hasData = false;
                foreach (var kv in headerToDbCol)
                {
                    var cell = ws.Cell(r, kv.Key);
                    string val;
                    if (cell.DataType == ClosedXML.Excel.XLDataType.Number)
                        val = cell.GetDouble().ToString(System.Globalization.CultureInfo.InvariantCulture);
                    else
                        val = cell.GetString().Trim();
                    rowData[kv.Value] = val;
                    if (!string.IsNullOrWhiteSpace(val)) hasData = true;
                }
                if (hasData) rows.Add(rowData);
            }
        }
        catch (Exception ex)
        {
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_BulkUploadJobs"" SET ""Job_Status"" = @Status, ""Date_Ran"" = NOW(), ""Processed"" = 1
                WHERE ""ID"" = @jobId", new { Status = "Error reading file: " + ex.Message, jobId });
            return BadRequest(new { error = "Error reading file: " + ex.Message, jobId });
        }

        if (string.IsNullOrWhiteSpace(progressKey)) progressKey = "upload_" + jobId;
        _progressTracker[progressKey] = new ProgressInfo { Phase = "loading", Percent = 5, Message = "Loading validation lookups..." };

        try
        {
            await _validator.LoadLookups();
        }
        catch (Exception ex)
        {
            _progressTracker.TryRemove(progressKey, out _);
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_BulkUploadJobs"" SET ""Job_Status"" = @Status, ""Date_Ran"" = NOW(), ""Processed"" = 1
                WHERE ""ID"" = @jobId", new { Status = "Error loading validation lookups: " + ex.Message, jobId });
            return StatusCode(500, new { error = "Error loading validation lookups", detail = ex.Message, jobId });
        }

        _progressTracker[progressKey] = new ProgressInfo { Phase = "validating", Percent = 10, Message = "Validating " + rows.Count + " rows..." };

        var totalErrors = 0;
        var batchBarcodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var validationResults = new List<(int rowNum, Dictionary<string, string?> errors, Dictionary<string, string> resolved, Dictionary<string, string> raw)>();

        int uploadTypeVal = uploadType ?? 1;
        for (int i = 0; i < rows.Count; i++)
        {
            var (errors, resolved) = _validator.ValidateRow(rows[i], i + 2, batchBarcodes, uploadTypeVal);
            validationResults.Add((i + 2, errors, resolved, rows[i]));
            if (errors.Count > 0) totalErrors++;
            if (i % 100 == 0 || i == rows.Count - 1)
            {
                var pct = 10 + (int)(((double)(i + 1) / rows.Count) * 60);
                _progressTracker[progressKey] = new ProgressInfo { Phase = "validating", Percent = pct, Message = "Validating row " + (i + 1) + " of " + rows.Count + "..." };
            }
        }

        if (totalErrors > 0)
        {
            _progressTracker[progressKey] = new ProgressInfo { Phase = "saving_errors", Percent = 75, Message = "Saving " + totalErrors + " validation errors..." };
            for (int i = 0; i < validationResults.Count; i++)
            {
                var vr = validationResults[i];
                if (vr.errors.Count == 0) continue;
                var cols = new List<string> { @"""Upload_JobID""", @"""RowNumber""" };
                var vals = new List<string> { "@Upload_JobID", "@RowNumber" };
                var parms = new DynamicParameters();
                parms.Add("Upload_JobID", jobId);
                parms.Add("RowNumber", vr.rowNum);
                foreach (var err in vr.errors)
                {
                    var colName = BulkUploadValidationService.GetBulkValidationColumnName(err.Key);
                    if (!BulkUploadValidationService.ValidBulkValidationColumns.Contains(colName))
                        continue;
                    cols.Add(@"""" + colName + @"""");
                    vals.Add("@p_" + colName);
                    var errMsg = err.Value ?? "";
                    if (errMsg.Length > 100) errMsg = errMsg.Substring(0, 97) + "...";
                    parms.Add("p_" + colName, errMsg);
                }
                // Always include Component ID as a reference identifier, even when it has no error
                if (!vr.errors.ContainsKey("ComponentID_AssetRegisterID") &&
                    vr.raw.TryGetValue("ComponentID_AssetRegisterID", out var compId) &&
                    !string.IsNullOrWhiteSpace(compId))
                {
                    cols.Add(@"""ComponentID_AssetRegisterID""");
                    vals.Add("@p_ComponentID_AssetRegisterID");
                    parms.Add("p_ComponentID_AssetRegisterID", compId);
                }
                if (cols.Count <= 2) continue;
                var sql = "INSERT INTO \"Asset_BulkValidation\" (" + string.Join(", ", cols) + ") VALUES (" + string.Join(", ", vals) + ")";
                try { await conn.ExecuteAsync(sql, parms); }
                catch (Exception ex) { Console.WriteLine("Error inserting validation row " + vr.rowNum + ": " + ex.Message); }
            }

            _progressTracker[progressKey] = new ProgressInfo { Phase = "complete", Percent = 100, Message = "Completed with " + totalErrors + " validation errors" };

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_BulkUploadJobs""
                SET ""Job_Status"" = 'Completed Unsuccessfully! With Validation Error Log',
                    ""Date_Ran"" = NOW(), ""Processed"" = 1, ""Total_Records"" = @Total,
                    ""No_RecodsNotValidating"" = @Errors
                WHERE ""ID"" = @jobId", new { Total = rows.Count, Errors = totalErrors, jobId });

            _ = Task.Delay(5000).ContinueWith(t => { ProgressInfo? removed; _progressTracker.TryRemove(progressKey, out removed); });
            return Ok(new { jobId, status = "failed", totalRows = rows.Count, errorRows = totalErrors, progressKey });
        }

        var runId = await conn.QuerySingleAsync<int>(@"
            SELECT COALESCE(MAX(""RunID""), 0) + 1 FROM ""Asset_BulkUploadJobs""");

        _progressTracker[progressKey] = new ProgressInfo { Phase = "staging", Percent = 75, Message = "Staging " + validationResults.Count + " records..." };

        var stagingEmpLookup = await _lookupService.GetEmployeeIdsByIdNoAsync(conn);

        await using var insertTxn = await conn.BeginTransactionAsync();
        var insertedCount = 0;
        for (int i = 0; i < validationResults.Count; i++)
        {
            var vr = validationResults[i];
            var insertCols = new List<string> { @"""Run_ID""" };
            var insertVals = new List<string> { "@Run_ID" };
            var insertParms = new DynamicParameters();
            insertParms.Add("Run_ID", runId);

            for (int c = 0; c < BulkUploadValidationService.DbColumns.Length; c++)
            {
                var dbCol = BulkUploadValidationService.DbColumns[c];
                if (BulkUploadValidationService.SkipColumns.Contains(dbCol)) continue;

                string val;
                if (BulkUploadValidationService.FkFields.Contains(dbCol) && vr.resolved.TryGetValue(dbCol, out var resolvedVal))
                    val = resolvedVal;
                else if (vr.raw.TryGetValue(dbCol, out var rawVal))
                    val = rawVal;
                else
                    continue;

                if (string.IsNullOrWhiteSpace(val)) continue;

                object? typedVal = null;
                if (BulkUploadValidationService.IntegerColumns.Contains(dbCol))
                {
                    if (int.TryParse(val, out var intVal)) typedVal = intVal;
                }
                else if (BulkUploadValidationService.DecimalColumns.Contains(dbCol))
                {
                    if (decimal.TryParse(val, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var decVal)) typedVal = decVal;
                }
                else if (BulkUploadValidationService.DateColumns.Contains(dbCol))
                {
                    if (DateTime.TryParse(val, out var dtVal)) typedVal = dtVal;
                }
                else
                {
                    typedVal = val;
                }

                if (typedVal == null) continue;
                insertCols.Add(@"""" + dbCol + @"""");
                insertVals.Add("@p_" + dbCol);
                insertParms.Add("p_" + dbCol, typedVal);
            }

            if (!insertCols.Contains(@"""Custodian_ID""")
                && vr.raw.TryGetValue("CustodianIdNumber", out var stagingIdNum)
                && !string.IsNullOrWhiteSpace(stagingIdNum)
                && stagingEmpLookup.TryGetValue(stagingIdNum.Trim(), out var stagingEmpId))
            {
                insertCols.Add(@"""Custodian_ID""");
                insertVals.Add("@p_Custodian_ID");
                insertParms.Add("p_Custodian_ID", stagingEmpId);
            }

            var insertSql = "INSERT INTO \"Asset_Register_Items_Upload\" (" + string.Join(", ", insertCols) + ") VALUES (" + string.Join(", ", insertVals) + ")";
            try
            {
                await conn.ExecuteAsync(insertSql, insertParms, insertTxn);
                insertedCount++;
                if (insertedCount % 100 == 0 || i == validationResults.Count - 1)
                {
                    var pct = 75 + (int)(((double)(i + 1) / validationResults.Count) * 20);
                    _progressTracker[progressKey] = new ProgressInfo { Phase = "staging", Percent = pct, Message = "Staging record " + (i + 1) + " of " + validationResults.Count + "..." };
                }
            }
            catch (Exception ex)
            {
                _progressTracker.TryRemove(progressKey, out _);
                await insertTxn.RollbackAsync();
                await conn.ExecuteAsync(@"
                    UPDATE ""Asset_BulkUploadJobs"" SET ""Job_Status"" = @Status, ""Date_Ran"" = NOW(), ""Processed"" = 1
                    WHERE ""ID"" = @jobId", new { Status = "Error inserting staging data: " + ex.Message, jobId });
                return StatusCode(500, new { error = "Error inserting staging data", detail = ex.Message, jobId });
            }
        }
        await insertTxn.CommitAsync();

        _progressTracker[progressKey] = new ProgressInfo { Phase = "complete", Percent = 100, Message = "Completed successfully! " + insertedCount + " records staged." };

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_BulkUploadJobs""
            SET ""Job_Status"" = 'Completed Successfully!', ""Date_Ran"" = NOW(), ""Processed"" = 1,
                ""Total_Records"" = @Total, ""No_RecordsInserted"" = @Inserted, ""RunID"" = @RunId
            WHERE ""ID"" = @jobId", new { Total = rows.Count, Inserted = insertedCount, RunId = runId, jobId });

        _ = Task.Delay(5000).ContinueWith(t => { ProgressInfo? removed; _progressTracker.TryRemove(progressKey, out removed); });
        return Ok(new { jobId, status = "success", totalRows = rows.Count, insertedRows = insertedCount, runId, progressKey });
    }

    [HttpGet("upload-types")]
    public async Task<IActionResult> GetUploadTypes()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<(int id, string typeDesc)>(
            @"SELECT ""ID"", COALESCE(""TypeDesc"", ""ID""::VARCHAR) AS ""TypeDesc""
              FROM ""Asset_UploadType""
              WHERE ""Enabled"" = 1 AND ""ID"" IN (1, 3, 4)
              ORDER BY ""ID""");
        var result = rows.Select(r => new { id = r.id, description = r.typeDesc }).ToList();
        return Ok(result);
    }

    [HttpGet("jobs")]
    public async Task<IActionResult> GetJobs([FromQuery] int? uploadType)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        if (uploadType.HasValue)
        {
            var jobs = await conn.QueryAsync<BulkUploadJob>(@"SELECT * FROM ""Asset_BulkUploadJobs"" WHERE COALESCE(""UploadType"", 1) = @ut ORDER BY ""Date_Created"" DESC", new { ut = uploadType.Value });
            return Ok(jobs);
        }
        else
        {
            var jobs = await conn.QueryAsync<BulkUploadJob>(@"SELECT * FROM ""Asset_BulkUploadJobs"" ORDER BY ""Date_Created"" DESC");
            return Ok(jobs);
        }
    }

    [HttpGet("jobs/{id:int}")]
    public async Task<IActionResult> GetJob(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var job = await conn.QueryFirstOrDefaultAsync<BulkUploadJob>(@"SELECT * FROM ""Asset_BulkUploadJobs"" WHERE ""ID"" = @id", new { id });
        return job is null ? NotFound(new { error = "Job not found" }) : Ok(job);
    }

    [HttpGet("jobs/{id:int}/errors")]
    public async Task<IActionResult> GetErrors(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var errors = await conn.QueryAsync(@"SELECT * FROM ""Asset_BulkValidation"" WHERE ""Upload_JobID"" = @id ORDER BY ""RowNumber""", new { id });
        return Ok(errors);
    }

    [HttpGet("jobs/{id:int}/download")]
    public async Task<IActionResult> DownloadFile(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var job = await conn.QueryFirstOrDefaultAsync<BulkUploadJob>(@"SELECT * FROM ""Asset_BulkUploadJobs"" WHERE ""ID"" = @id", new { id });
        if (job == null) return NotFound(new { error = "Job not found" });
        if (string.IsNullOrEmpty(job.ValidationError_Path) || !System.IO.File.Exists(job.ValidationError_Path))
            return NotFound(new { error = "File not found on server" });
        var bytes = await System.IO.File.ReadAllBytesAsync(job.ValidationError_Path);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", job.Filename ?? "download.xlsx");
    }

    [HttpGet("jobs/{id:int}/errors/export")]
    public async Task<IActionResult> ExportErrors(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var job = await conn.QueryFirstOrDefaultAsync<BulkUploadJob>(@"SELECT * FROM ""Asset_BulkUploadJobs"" WHERE ""ID"" = @id", new { id });
        if (job == null) return NotFound(new { error = "Job not found" });

        var errors = (await conn.QueryAsync(@"SELECT * FROM ""Asset_BulkValidation"" WHERE ""Upload_JobID"" = @id ORDER BY ""RowNumber""", new { id })).ToList();
        if (errors.Count == 0) return NotFound(new { error = "No validation errors found" });

        // Build Excel-header → Asset_BulkValidation column-name lookup
        var headerToValCol = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < BulkUploadValidationService.ExcelHeaders.Length; i++)
            headerToValCol[BulkUploadValidationService.ExcelHeaders[i]] =
                BulkUploadValidationService.GetBulkValidationColumnName(BulkUploadValidationService.DbColumns[i]);

        // Determine column order from the original upload file
        var fileColumns = new List<(string excelHeader, string valCol)>();
        if (!string.IsNullOrEmpty(job.ValidationError_Path) && System.IO.File.Exists(job.ValidationError_Path))
        {
            try
            {
                using var uploadWb = new XLWorkbook(job.ValidationError_Path);
                var uploadWs = uploadWb.Worksheets.First();
                var lastCol = uploadWs.Row(1).LastCellUsed()?.Address.ColumnNumber ?? 0;
                for (int c = 1; c <= lastCol; c++)
                {
                    var hdr = uploadWs.Cell(1, c).GetString().Trim();
                    if (!string.IsNullOrWhiteSpace(hdr) && headerToValCol.TryGetValue(hdr, out var vc))
                        fileColumns.Add((hdr, vc));
                }
            }
            catch { /* file unreadable — fall through to fallback */ }
        }

        // Fallback: if upload file is unavailable, use all non-internal columns that have errors
        if (fileColumns.Count == 0)
        {
            var skipCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                { "Asset_BulkValidation_ID", "Upload_JobID", "AssetSetting_ID", "FileName", "Description", "RunID", "RowNumber" };
            var firstRow = (IDictionary<string, object>)errors[0];
            foreach (var key in firstRow.Keys)
            {
                if (skipCols.Contains(key)) continue;
                if (errors.Any(r => { var v = ((IDictionary<string, object>)r)[key]; return v != null && !(v is DBNull); }))
                    fileColumns.Add((key, key));
            }
        }

        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var ws = workbook.Worksheets.Add("Validation Errors");

        // Header row: RowNumber + one column per upload file column
        ws.Cell(1, 1).Value = "Row Number";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#1e3a5f");
        ws.Cell(1, 1).Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
        for (int c = 0; c < fileColumns.Count; c++)
        {
            var cell = ws.Cell(1, c + 2);
            cell.Value = fileColumns[c].excelHeader;
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#1e3a5f");
            cell.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
        }

        // Data rows
        for (int r = 0; r < errors.Count; r++)
        {
            var row = (IDictionary<string, object>)errors[r];
            ws.Cell(r + 2, 1).Value = row.ContainsKey("RowNumber") ? row["RowNumber"]?.ToString() ?? "" : "";
            for (int c = 0; c < fileColumns.Count; c++)
            {
                var vc = fileColumns[c].valCol;
                var val = row.ContainsKey(vc) ? row[vc] : null;
                if (val != null && !(val is DBNull))
                    ws.Cell(r + 2, c + 2).Value = val.ToString();
            }
        }

        if (errors.Count <= 5000)
            ws.Columns().AdjustToContents(1, 50);

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        var baseName = job.Filename ?? "upload";
        if (baseName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase) || baseName.EndsWith(".xls", StringComparison.OrdinalIgnoreCase))
            baseName = System.IO.Path.GetFileNameWithoutExtension(baseName);
        var fileName = "ValidationErrors_" + baseName + ".xlsx";
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpGet("template")]
    public IActionResult DownloadTemplate()
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Asset Upload Template");
        for (int i = 0; i < BulkUploadValidationService.ExcelHeaders.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = BulkUploadValidationService.ExcelHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#1e3a5f");
            cell.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
        }
        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Asset_Upload_Template.xlsx");
    }

    [HttpGet("uploaded-items")]
    public async Task<IActionResult> GetUploadedItems([FromQuery] string? financialYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var whereClause = "";
        var parms = new DynamicParameters();
        var sql = @"
            SELECT
                u.""AssetType_ID"" AS ""assetTypeId"",
                COALESCE(t.""AssetTypeDesc"", CAST(u.""AssetType_ID"" AS TEXT)) AS ""assetType"",
                u.""AssetCategory_ID"" AS ""assetCategoryId"",
                COALESCE(c.""AssetCategoryDesc"", CAST(u.""AssetCategory_ID"" AS TEXT)) AS ""assetCategory"",
                u.""Asset_SubCategory_ID"" AS ""assetSubCategoryId"",
                COALESCE(sc.""Asset_SubCategoryDescription"", CAST(u.""Asset_SubCategory_ID"" AS TEXT)) AS ""assetSubCategory"",
                u.""MeasurementType_ID"" AS ""measurementTypeId"",
                COALESCE(m.""Name"", CAST(u.""MeasurementType_ID"" AS TEXT)) AS ""measurementType"",
                COUNT(*) AS ""numberOfRecords"",
                COALESCE(SUM(u.""PurchaseAmount""), 0) AS ""openingBalanceCost"",
                COALESCE(SUM(u.""AccumulatedDepreciationClosingBalance""), 0) AS ""accumulatedDepreciation"",
                COALESCE(SUM(u.""AccumulatedImpairmentClosingBalance""), 0) AS ""accumulatedImpairment"",
                COALESCE(SUM(u.""CarryingAmountClosingBalance""), 0) AS ""carryingAmount"",
                COALESCE(SUM(u.""RevaluationOpeningBalance""), 0) AS ""revaluationOpeningBalance""
            FROM ""Asset_Register_Items_Upload"" u
            LEFT JOIN ""Const_AssetType_Sys"" t ON t.""AssetType_ID"" = u.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" c ON c.""AssetCategoryID"" = u.""AssetCategory_ID""
            LEFT JOIN ""Const_Asset_SubCategory"" sc ON sc.""Asset_SubCategory_ID"" = u.""Asset_SubCategory_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" m ON m.""AssetConfig_MeasurementType_ID"" = u.""MeasurementType_ID""
            " + whereClause + @"
            GROUP BY u.""AssetType_ID"", t.""AssetTypeDesc"", u.""AssetCategory_ID"", c.""AssetCategoryDesc"",
                     u.""Asset_SubCategory_ID"", sc.""Asset_SubCategoryDescription"", u.""MeasurementType_ID"", m.""Name""
            ORDER BY ""assetType"", ""assetCategory"", ""assetSubCategory"", ""measurementType""";

        var items = await conn.QueryAsync(sql, parms);
        return Ok(items);
    }

    [HttpGet("uploaded-items/{runId:int}")]
    public async Task<IActionResult> GetUploadedItemsByRun(int runId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"
            SELECT
                u.""AssetType_ID"" AS ""assetTypeId"",
                COALESCE(t.""AssetTypeDesc"", CAST(u.""AssetType_ID"" AS TEXT)) AS ""assetType"",
                u.""MeasurementType_ID"" AS ""measurementTypeId"",
                COALESCE(m.""Name"", CAST(u.""MeasurementType_ID"" AS TEXT)) AS ""measurementType"",
                u.""DebitPlanProjectItemID"" AS ""debitPlanProjectItemID"",
                COUNT(*) AS ""numberOfRecords"",
                COALESCE(SUM(u.""PurchaseAmount""), 0) AS ""openingBalanceCost"",
                COALESCE(SUM(u.""AccumulatedDepreciationClosingBalance""), 0) AS ""accumulatedDepreciation"",
                COALESCE(SUM(u.""AccumulatedImpairmentClosingBalance""), 0) AS ""accumulatedImpairment"",
                COALESCE(SUM(u.""CarryingAmountClosingBalance""), 0) AS ""carryingAmount"",
                COALESCE(SUM(u.""RevaluationOpeningBalance""), 0) AS ""revaluationOpeningBalance""
            FROM ""Asset_Register_Items_Upload"" u
            LEFT JOIN ""Const_AssetType_Sys"" t ON t.""AssetType_ID"" = u.""AssetType_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" m ON m.""AssetConfig_MeasurementType_ID"" = u.""MeasurementType_ID""
            WHERE u.""Run_ID"" = @runId
            GROUP BY u.""AssetType_ID"", t.""AssetTypeDesc"", u.""MeasurementType_ID"", m.""Name"", u.""DebitPlanProjectItemID""
            ORDER BY ""assetType"", ""measurementType""";
        var items = await conn.QueryAsync(sql, new { runId });
        return Ok(items);
    }

    [HttpPost("jobs/{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveRequest? request)
    {
        var financialYear = request?.FinancialYear;
        if (string.IsNullOrWhiteSpace(financialYear))
            return BadRequest(new { error = "Financial Year is required for approval" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var job = await conn.QueryFirstOrDefaultAsync<BulkUploadJob>(@"SELECT * FROM ""Asset_BulkUploadJobs"" WHERE ""ID"" = @id", new { id });
        if (job == null) return NotFound(new { error = "Job not found" });
        if (job.Job_Status == "Approved") return BadRequest(new { error = "Job has already been approved" });
        if (job.RunID == null) return BadRequest(new { error = "Job has no staged data (no RunID)" });

        var staged = await conn.QueryAsync(@"SELECT * FROM ""Asset_Register_Items_Upload"" WHERE ""Run_ID"" = @RunId", new { RunId = job.RunID });
        var stagedList = staged.ToList();
        if (stagedList.Count == 0) return BadRequest(new { error = "No staged records found for this job" });

        var approveKey = "approve_" + id;
        _progressTracker[approveKey] = new ProgressInfo { Phase = "approving", Percent = 5, Message = "Starting approval of " + stagedList.Count + " records..." };

        var targetColInfo = await conn.QueryAsync<dynamic>(@"
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_name = 'Asset_Register_Items'");
        var targetColSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var targetColCanonical = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var numericCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var intCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var dateCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var ci in targetColInfo)
        {
            string colName = ci.column_name;
            string dataType = ci.data_type;
            targetColSet.Add(colName);
            targetColCanonical[colName] = colName;
            if (dataType == "numeric" || dataType == "double precision" || dataType == "real")
                numericCols.Add(colName);
            else if (dataType == "integer" || dataType == "bigint" || dataType == "smallint")
                intCols.Add(colName);
            else if (dataType == "date" || dataType == "timestamp without time zone" || dataType == "timestamp with time zone")
                dateCols.Add(colName);
        }

        var approveEmpLookup = await _lookupService.GetEmployeeIdsByIdNoAsync(conn);

        var approveDivisionLookup = await _lookupService.GetDivisionIdsByDescAsync(conn);

        await using var txn = await conn.BeginTransactionAsync();
        var insertCount = 0;
        var newAssetIds = new List<(int assetId, IDictionary<string, object> uploadRow)>();
        for (int idx = 0; idx < stagedList.Count; idx++)
        {
            var row = stagedList[idx];
            var dict = (IDictionary<string, object>)row;

            var custIdAlreadySet = dict.TryGetValue("Custodian_ID", out var existingCustId)
                && existingCustId != null && existingCustId is not DBNull
                && int.TryParse(existingCustId.ToString(), out var existingCustIdInt) && existingCustIdInt != 0;
            if (!custIdAlreadySet
                && dict.TryGetValue("CustodianIdNumber", out var custIdNumObj)
                && custIdNumObj != null && custIdNumObj is not DBNull)
            {
                var custIdNum = custIdNumObj.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(custIdNum) && approveEmpLookup.TryGetValue(custIdNum, out var resolvedEmpId))
                    dict["Custodian_ID"] = resolvedEmpId;
            }

            var divAlreadySet = dict.TryGetValue("DivisionID", out var existingDivId)
                && existingDivId != null && existingDivId is not DBNull
                && int.TryParse(existingDivId.ToString(), out var existingDivIdInt) && existingDivIdInt != 0;
            if (!divAlreadySet
                && dict.TryGetValue("Division", out var divNameObj)
                && divNameObj != null && divNameObj is not DBNull)
            {
                var divName = divNameObj.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(divName))
                {
                    string? deptDescForDiv = null;
                    if (dict.TryGetValue("MunicipalDepartment_ID", out var deptDescObj) && deptDescObj != null && deptDescObj is not DBNull)
                        deptDescForDiv = deptDescObj.ToString()?.Trim();
                    var compositeKey = $"{deptDescForDiv ?? ""}|{divName}";
                    if (approveDivisionLookup.TryGetValue(compositeKey, out var resolvedDivId))
                        dict["DivisionID"] = resolvedDivId;
                }
            }

            var cols = new List<string>();
            var vals = new List<string>();
            var parms = new DynamicParameters();
            foreach (var kv in dict)
            {
                if (kv.Key == "AssetRegisterItemUpload_ID" || kv.Key == "Run_ID") continue;
                if (kv.Key == "PurchaseAmount") continue;
                if (kv.Value == null || (kv.Value is string s && string.IsNullOrWhiteSpace(s))) continue;
                if (!targetColSet.Contains(kv.Key)) continue;
                object val = kv.Value;
                if (val is string strVal && !string.IsNullOrWhiteSpace(strVal))
                {
                    if (numericCols.Contains(kv.Key))
                    {
                        if (decimal.TryParse(strVal, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var dv))
                            val = dv;
                        else
                            continue;
                    }
                    else if (intCols.Contains(kv.Key))
                    {
                        if (int.TryParse(strVal, out var iv))
                            val = iv;
                        else if (decimal.TryParse(strVal, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var dv2))
                            val = (int)dv2;
                        else
                            continue;
                    }
                    else if (dateCols.Contains(kv.Key))
                    {
                        if (DateTime.TryParse(strVal, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var dtv))
                            val = dtv;
                        else if (DateTime.TryParse(strVal, out var dtv2))
                            val = dtv2;
                        else
                            continue;
                    }
                }
                var canonicalKey = targetColCanonical.TryGetValue(kv.Key, out var ck) ? ck : kv.Key;
                cols.Add(@"""" + canonicalKey + @"""");
                vals.Add("@p_" + canonicalKey);
                parms.Add("p_" + canonicalKey, val);
            }
            var crcCostBase = GetDecimal(dict, "CurrentReplacementCostCRC");
            var originalPurchase = GetDecimal(dict, "PurchaseAmount");
            var purchaseCostBase = crcCostBase > 0m ? crcCostBase : originalPurchase;
            if (purchaseCostBase > 0m && targetColSet.Contains("PurchaseAmount"))
            {
                cols.Add(@"""PurchaseAmount""");
                vals.Add("@p_PurchaseAmount");
                parms.Add("p_PurchaseAmount", purchaseCostBase);
            }
            cols.Add(@"""Run_ID""");
            vals.Add("@p_RunId");
            parms.Add("p_RunId", job.RunID);

            cols.Add(@"""DateOfTakeOnBalancesImported""");
            vals.Add("@p_DateOfTakeOnBalancesImported");
            parms.Add("p_DateOfTakeOnBalancesImported", DateTime.UtcNow);

            var sql = "INSERT INTO \"Asset_Register_Items\" (" + string.Join(", ", cols) + ") VALUES (" + string.Join(", ", vals) + ") RETURNING \"AssetRegisterItem_ID\"";
            try
            {
                var newId = await conn.QuerySingleAsync<int>(sql, parms, txn);
                newAssetIds.Add((newId, dict));
                insertCount++;
                if (insertCount % 100 == 0 || idx == stagedList.Count - 1)
                {
                    var pct = 5 + (int)(((double)(idx + 1) / stagedList.Count) * 70);
                    _progressTracker[approveKey] = new ProgressInfo { Phase = "approving", Percent = pct, Message = "Copying record " + (idx + 1) + " of " + stagedList.Count + " to asset register..." };
                }
            }
            catch (Exception ex)
            {
                _progressTracker.TryRemove(approveKey, out _);
                await txn.RollbackAsync();
                await conn.ExecuteAsync(@"
                    UPDATE ""Asset_BulkUploadJobs""
                    SET ""Job_Status"" = @status, ""ProcessDate"" = NOW()
                    WHERE ""ID"" = @id",
                    new { id, status = "Approval Failed: " + ex.Message });
                return StatusCode(500, new { error = "Approval failed on row insert", detail = ex.Message, insertedBeforeFailure = insertCount });
            }
        }

        _progressTracker[approveKey] = new ProgressInfo { Phase = "transactions", Percent = 80, Message = "Creating transaction summary records..." };

        var currentPeriod = await _txnService.GetProcessingMonth(conn, request?.UserId ?? 1, txn);

        for (int idx = 0; idx < newAssetIds.Count; idx++)
        {
            var (assetId, uploadRow) = newAssetIds[idx];
            var revalOB = GetDecimal(uploadRow, "RevaluationOpeningBalance");
            var revalMovement = GetDecimal(uploadRow, "MovementInRevaluationReserve");
            var depOffset = GetDecimal(uploadRow, "DepreciationOffset");
            var revalImpOB = GetDecimal(uploadRow, "RevaluationImpairmentOpeningBalance");
            var revalClosing = revalOB + revalMovement - depOffset - revalImpOB;

            var accDepCB = GetDecimal(uploadRow, "AccumulatedDepreciationClosingBalance");
            var accImpCB = GetDecimal(uploadRow, "AccumulatedImpairmentClosingBalance");

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items""
                SET ""RevaluationReserveClosingBalance"" = @RevalClosing,
                    ""AccumulatedDepreciationOpeningBalance"" = COALESCE(""AccumulatedDepreciationOpeningBalance"", @AccDepOB),
                    ""AccumulatedImpairmentOpeningBalance"" = COALESCE(""AccumulatedImpairmentOpeningBalance"", @AccImpOB)
                WHERE ""AssetRegisterItem_ID"" = @AssetId",
                new { RevalClosing = revalClosing, AccDepOB = accDepCB, AccImpOB = accImpCB, AssetId = assetId }, txn);

            await _txnService.PopulateTransactionSummaryForUpload(conn, txn, assetId, financialYear ?? "2025/2026", 1, currentPeriod);

            if ((idx + 1) % 100 == 0 || idx == newAssetIds.Count - 1)
            {
                var pct = 80 + (int)(((double)(idx + 1) / newAssetIds.Count) * 15);
                _progressTracker[approveKey] = new ProgressInfo { Phase = "transactions", Percent = pct, Message = "Transaction summary " + (idx + 1) + " of " + newAssetIds.Count + "..." };
            }
        }

        await txn.CommitAsync();

        _progressTracker[approveKey] = new ProgressInfo { Phase = "complete", Percent = 100, Message = "Approved! " + insertCount + " records added to asset register." };

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_BulkUploadJobs""
            SET ""Job_Status"" = 'Approved', ""ApprovedByID"" = 1, ""ApprovedDate"" = NOW(), ""ProcessDate"" = NOW()
            WHERE ""ID"" = @id", new { id });

        try
        {
            var approveEmailType = await conn.QueryFirstOrDefaultAsync<string>(
                @"SELECT COALESCE(""TypeDesc"", ""ID""::VARCHAR) FROM ""Asset_UploadType"" WHERE ""ID"" = @id",
                new { id = job.UploadType ?? 1 }) ?? "Bulk Upload";
            _ = _emailService.SendTransactionEmailsAsync(approveEmailType);
        }
        catch (Exception emailEx)
        {
            Console.Error.WriteLine($"[BulkUploadController] Failed to send approval email: {emailEx.Message}");
        }
        _ = Task.Delay(5000).ContinueWith(t => { ProgressInfo? removed; _progressTracker.TryRemove(approveKey, out removed); });
        return Ok(new { success = 1, approvedRecords = insertCount, progressKey = approveKey });
    }

    private static bool HasValue(IDictionary<string, object> row, string key)
    {
        if (!row.ContainsKey(key) || row[key] == null) return false;
        var val = row[key];
        if (val is string s) return !string.IsNullOrWhiteSpace(s);
        return true;
    }

    private static decimal GetDecimal(IDictionary<string, object> row, string key)
    {
        if (!row.ContainsKey(key) || row[key] == null) return 0m;
        var val = row[key];
        if (val is decimal d) return d;
        if (val is double dbl) return (decimal)dbl;
        if (val is float f) return (decimal)f;
        if (val is int i) return i;
        if (val is long l) return l;
        if (decimal.TryParse(val.ToString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsed)) return parsed;
        return 0m;
    }

    [HttpPost("jobs/{id:int}/approve-wip")]
    public async Task<IActionResult> ApproveWip(int id, [FromBody] WipApproveRequest? request)
    {
        if (request == null)
            return BadRequest(new { error = "Request body is required" });
        if (string.IsNullOrWhiteSpace(request.FinancialYear))
            return BadRequest(new { error = "Financial Year is required" });
        if (request.MainAssetId <= 0)
            return BadRequest(new { error = "Main Asset ID is required" });
        if (request.CreditPlanProjectItemId <= 0)
            return BadRequest(new { error = "Credit Plan Project Item ID is required" });
        if (request.TransferDate == default(DateTime) || request.TransferDate.Year < 2000)
            return BadRequest(new { error = "A valid Transfer Date is required" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var mainAssetExists = await conn.QueryFirstOrDefaultAsync<int?>(@"SELECT ""AssetRegisterItem_ID"" FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @id", new { id = request.MainAssetId });
        if (mainAssetExists == null)
            return BadRequest(new { error = "Main Asset ID " + request.MainAssetId + " does not exist in Asset Register" });

        var job = await conn.QueryFirstOrDefaultAsync<BulkUploadJob>(@"SELECT * FROM ""Asset_BulkUploadJobs"" WHERE ""ID"" = @id", new { id });
        if (job == null) return NotFound(new { error = "Job not found" });
        if ((job.UploadType ?? 1) != 2) return BadRequest(new { error = "This job is not a WIP upload (UploadType must be 2)" });
        if (job.Job_Status == "Approved") return BadRequest(new { error = "Job has already been approved" });
        if (job.RunID == null) return BadRequest(new { error = "Job has no staged data (no RunID)" });

        var staged = await conn.QueryAsync(@"SELECT * FROM ""Asset_Register_Items_Upload"" WHERE ""Run_ID"" = @RunId", new { RunId = job.RunID });
        var stagedList = staged.ToList();
        if (stagedList.Count == 0) return BadRequest(new { error = "No staged records found for this job" });

        var approveKey = "approve_wip_" + id;
        _progressTracker[approveKey] = new ProgressInfo { Phase = "approving", Percent = 5, Message = "Starting WIP approval of " + stagedList.Count + " records..." };

        var targetColInfo = await conn.QueryAsync<dynamic>(@"
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_name = 'Asset_Register_Items'");
        var targetColSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var targetColCanonical = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var numericCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var intCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var dateCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var ci in targetColInfo)
        {
            string colName = ci.column_name;
            string dataType = ci.data_type;
            targetColSet.Add(colName);
            targetColCanonical[colName] = colName;
            if (dataType == "numeric" || dataType == "double precision" || dataType == "real")
                numericCols.Add(colName);
            else if (dataType == "integer" || dataType == "bigint" || dataType == "smallint")
                intCols.Add(colName);
            else if (dataType == "date" || dataType == "timestamp without time zone" || dataType == "timestamp with time zone")
                dateCols.Add(colName);
        }

        var wipDivisionLookup = await _lookupService.GetDivisionIdsByDescAsync(conn);

        await using var txn = await conn.BeginTransactionAsync();
        var insertCount = 0;
        var newAssetIds = new List<(int assetId, IDictionary<string, object> uploadRow)>();
        for (int idx = 0; idx < stagedList.Count; idx++)
        {
            var row = stagedList[idx];
            var dict = (IDictionary<string, object>)row;

            var wipDivAlreadySet = dict.TryGetValue("DivisionID", out var wipExistingDivId)
                && wipExistingDivId != null && wipExistingDivId is not DBNull
                && int.TryParse(wipExistingDivId.ToString(), out var wipExistingDivIdInt) && wipExistingDivIdInt != 0;
            if (!wipDivAlreadySet
                && dict.TryGetValue("Division", out var wipDivNameObj)
                && wipDivNameObj != null && wipDivNameObj is not DBNull)
            {
                var wipDivName = wipDivNameObj.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(wipDivName))
                {
                    string? wipDeptDescForDiv = null;
                    if (dict.TryGetValue("MunicipalDepartment_ID", out var wipDeptDescObj) && wipDeptDescObj != null && wipDeptDescObj is not DBNull)
                        wipDeptDescForDiv = wipDeptDescObj.ToString()?.Trim();
                    var wipCompositeKey = $"{wipDeptDescForDiv ?? ""}|{wipDivName}";
                    if (wipDivisionLookup.TryGetValue(wipCompositeKey, out var wipResolvedDivId))
                        dict["DivisionID"] = wipResolvedDivId;
                }
            }

            var cols = new List<string>();
            var vals = new List<string>();
            var parms = new DynamicParameters();
            foreach (var kv in dict)
            {
                if (kv.Key == "AssetRegisterItemUpload_ID" || kv.Key == "Run_ID" || kv.Key == "DebitPlanProjectItemID") continue;
                if (kv.Key == "PurchaseAmount") continue;
                if (kv.Value == null || (kv.Value is string s && string.IsNullOrWhiteSpace(s))) continue;
                if (!targetColSet.Contains(kv.Key)) continue;
                object val = kv.Value;
                if (val is string strVal && !string.IsNullOrWhiteSpace(strVal))
                {
                    if (numericCols.Contains(kv.Key))
                    {
                        if (decimal.TryParse(strVal, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var dv))
                            val = dv;
                        else continue;
                    }
                    else if (intCols.Contains(kv.Key))
                    {
                        if (int.TryParse(strVal, out var iv)) val = iv;
                        else if (decimal.TryParse(strVal, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var dv2))
                            val = (int)dv2;
                        else continue;
                    }
                    else if (dateCols.Contains(kv.Key))
                    {
                        if (DateTime.TryParse(strVal, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var dtv))
                            val = dtv;
                        else if (DateTime.TryParse(strVal, out var dtv2)) val = dtv2;
                        else continue;
                    }
                }
                var canonicalKey = targetColCanonical.TryGetValue(kv.Key, out var ck) ? ck : kv.Key;
                cols.Add(@"""" + canonicalKey + @"""");
                vals.Add("@p_" + canonicalKey);
                parms.Add("p_" + canonicalKey, val);
            }
            var wipCrcCostBase = GetDecimal(dict, "CurrentReplacementCostCRC");
            var wipOriginalPurchase = GetDecimal(dict, "PurchaseAmount");
            var wipPurchaseCostBase = wipCrcCostBase > 0m ? wipCrcCostBase : wipOriginalPurchase;
            if (wipPurchaseCostBase > 0m && targetColSet.Contains("PurchaseAmount"))
            {
                cols.Add(@"""PurchaseAmount""");
                vals.Add("@p_PurchaseAmount");
                parms.Add("p_PurchaseAmount", wipPurchaseCostBase);
            }
            cols.Add(@"""Run_ID""");
            vals.Add("@p_RunId");
            parms.Add("p_RunId", job.RunID);

            cols.Add(@"""DateOfTakeOnBalancesImported""");
            vals.Add("@p_DateOfTakeOnBalancesImported");
            parms.Add("p_DateOfTakeOnBalancesImported", DateTime.UtcNow);

            var sql = "INSERT INTO \"Asset_Register_Items\" (" + string.Join(", ", cols) + ") VALUES (" + string.Join(", ", vals) + ") RETURNING \"AssetRegisterItem_ID\"";
            try
            {
                var newId = await conn.QuerySingleAsync<int>(sql, parms, txn);
                newAssetIds.Add((newId, dict));
                insertCount++;
                if (insertCount % 100 == 0 || idx == stagedList.Count - 1)
                {
                    var pct = 5 + (int)(((double)(idx + 1) / stagedList.Count) * 40);
                    _progressTracker[approveKey] = new ProgressInfo { Phase = "approving", Percent = pct, Message = "Copying record " + (idx + 1) + " of " + stagedList.Count + " to asset register..." };
                }
            }
            catch (Exception ex)
            {
                _progressTracker.TryRemove(approveKey, out _);
                await txn.RollbackAsync();
                await conn.ExecuteAsync(@"
                    UPDATE ""Asset_BulkUploadJobs""
                    SET ""Job_Status"" = @status, ""ProcessDate"" = NOW()
                    WHERE ""ID"" = @id",
                    new { id, status = "Approval Failed: " + ex.Message });
                return StatusCode(500, new { error = "Approval failed on row insert", detail = ex.Message, insertedBeforeFailure = insertCount });
            }
        }

        _progressTracker[approveKey] = new ProgressInfo { Phase = "transactions", Percent = 50, Message = "Creating transaction summary records..." };

        var currentPeriod = await _txnService.GetProcessingMonth(conn, request?.UserId ?? 1, txn);

        for (int idx = 0; idx < newAssetIds.Count; idx++)
        {
            var (assetId, uploadRow) = newAssetIds[idx];
            var revalOB = GetDecimal(uploadRow, "RevaluationOpeningBalance");
            var revalMovement = GetDecimal(uploadRow, "MovementInRevaluationReserve");
            var depOffset = GetDecimal(uploadRow, "DepreciationOffset");
            var revalImpOB = GetDecimal(uploadRow, "RevaluationImpairmentOpeningBalance");
            var revalClosing = revalOB + revalMovement - depOffset - revalImpOB;
            var accDepCB = GetDecimal(uploadRow, "AccumulatedDepreciationClosingBalance");
            var accImpCB = GetDecimal(uploadRow, "AccumulatedImpairmentClosingBalance");

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items""
                SET ""RevaluationReserveClosingBalance"" = @RevalClosing,
                    ""AccumulatedDepreciationOpeningBalance"" = COALESCE(""AccumulatedDepreciationOpeningBalance""::DECIMAL(18,8), @AccDepOB::DECIMAL(18,8)),
                    ""AccumulatedImpairmentOpeningBalance"" = COALESCE(""AccumulatedImpairmentOpeningBalance""::DECIMAL(18,8), @AccImpOB::DECIMAL(18,8))
                WHERE ""AssetRegisterItem_ID"" = @AssetId",
                new { RevalClosing = revalClosing, AccDepOB = accDepCB, AccImpOB = accImpCB, AssetId = assetId }, txn);

            await _txnService.PopulateTransactionSummaryForUpload(conn, txn, assetId, request.FinancialYear ?? "2025/2026", 1, currentPeriod);
        }

        _progressTracker[approveKey] = new ProgressInfo { Phase = "transfers", Percent = 70, Message = "Creating transfer transaction records..." };

        for (int idx = 0; idx < newAssetIds.Count; idx++)
        {
            var (assetId, uploadRow) = newAssetIds[idx];
            var currentValue = GetDecimal(uploadRow, "CarryingAmountClosingBalance");
            if (currentValue == 0m) currentValue = GetDecimal(uploadRow, "PurchaseAmount");

            int componentId = 0;
            if (HasValue(uploadRow, "ComponentID_AssetRegisterID"))
            {
                var compStr = uploadRow["ComponentID_AssetRegisterID"]?.ToString() ?? "";
                int.TryParse(compStr, out componentId);
            }
            int debitPlanProjectItemId = 0;
            if (HasValue(uploadRow, "DebitPlanProjectItemID"))
            {
                var dpStr = uploadRow["DebitPlanProjectItemID"]?.ToString() ?? "";
                int.TryParse(dpStr, out debitPlanProjectItemId);
            }

            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_Transfer_Transactions""
                (""AssetItemID"", ""TransferDate"", ""TransferValue"", ""Run_ID"", ""Component_ID"",
                 ""DebitPlanProjectItemID"", ""CreditPlanProjectItemID"", ""MainAssetID"",
                 ""DateCaptured"", ""CapturerID"", ""IsApproved"")
                VALUES
                (@AssetItemID, @TransferDate, @TransferValue, @RunID, @ComponentID,
                 @DebitPlanProjectItemID, @CreditPlanProjectItemID, @MainAssetID,
                 NOW(), 1, 0)",
                new
                {
                    AssetItemID = assetId,
                    TransferDate = request.TransferDate,
                    TransferValue = currentValue,
                    RunID = job.RunID,
                    ComponentID = componentId > 0 ? (int?)componentId : null,
                    DebitPlanProjectItemID = debitPlanProjectItemId > 0 ? (int?)debitPlanProjectItemId : null,
                    CreditPlanProjectItemID = request.CreditPlanProjectItemId,
                    MainAssetID = request.MainAssetId
                }, txn);

            if ((idx + 1) % 100 == 0 || idx == newAssetIds.Count - 1)
            {
                var pct = 70 + (int)(((double)(idx + 1) / newAssetIds.Count) * 10);
                _progressTracker[approveKey] = new ProgressInfo { Phase = "transfers", Percent = pct, Message = "Transfer record " + (idx + 1) + " of " + newAssetIds.Count + "..." };
            }
        }

        _progressTracker[approveKey] = new ProgressInfo { Phase = "gl_journals", Percent = 82, Message = "Creating GL journal entries..." };

        try
        {
            var transactionGuid = Guid.NewGuid();
            var finYear = request.FinancialYear ?? "2025/2026";
            var processingMonth = currentPeriod;

            var assetJournalTxnTypeId = await conn.QueryFirstOrDefaultAsync<int?>(@"
                SELECT ""AssetJournalTransactionType_ID"" FROM ""Const_AssetJournalTransactionType_Sys""
                WHERE ""AssetJournalTransactionDesc"" = 'Asset Transfer'", transaction: txn) ?? 0;
            var documentTypeId = await _lookupService.GetDocumentTypeIdAsync(conn, "Asset Transfer", txn);
            var transactionTypeId = await conn.QueryFirstOrDefaultAsync<int?>(@"
                SELECT d.""ReferenceData_ID""
                FROM ""Const_ReferenceData_sys"" d
                INNER JOIN ""Const_ReferenceType_sys"" t ON t.""ReferenceType_ID"" = d.""ReferenceTypeID""
                WHERE t.""Name"" = 'AssetTransactionTypes'
                  AND d.""Description"" = 'Asset Transfer'", transaction: txn) ?? 0;

            var prevDocNum = await conn.QueryFirstOrDefaultAsync<int?>(@"
                SELECT CAST(SPLIT_PART(""DocumentNumber"", '/', 2) AS INTEGER)
                FROM ""Led_Journal_Asset""
                WHERE ""AssetJournalTransactionTypeID"" = @ttid
                  AND ""DocumentNumber"" IS NOT NULL AND ""DocumentNumber"" LIKE '%/%'
                ORDER BY ""AssetJournal_ID"" DESC LIMIT 1",
                new { ttid = assetJournalTxnTypeId }, txn);
            var newDocNumber = documentTypeId + "/" + ((prevDocNum ?? 0) + 1);

            var rawTransferRows = (await conn.QueryAsync(@"
                SELECT tt.""AssetTransfer_ID"", tt.""AssetItemID"", tt.""TransferDate"", tt.""TransferValue"",
                       tt.""DebitPlanProjectItemID"", tt.""CreditPlanProjectItemID"", tt.""MainAssetID""
                FROM ""Asset_Transfer_Transactions"" tt
                WHERE tt.""Run_ID"" = @RunId AND COALESCE(tt.""IsApproved"", 0) = 0",
                new { RunId = job.RunID }, txn)).ToList();

            var allDebitPpiIds = rawTransferRows
                .Where(r => r.DebitPlanProjectItemID != null)
                .Select(r => (int)r.DebitPlanProjectItemID).Distinct();
            var allCreditPpiIds = rawTransferRows
                .Where(r => r.CreditPlanProjectItemID != null)
                .Select(r => (int)r.CreditPlanProjectItemID).Distinct();

            var debitPpiData = await _internalApi.GetPpiVoteDataBatchAsync(allDebitPpiIds);
            var creditPpiData = await _internalApi.GetPpiVoteDataBatchAsync(allCreditPpiIds);

            var transferRows = rawTransferRows.Select(tt => {
                var ppi = tt.DebitPlanProjectItemID != null && debitPpiData.ContainsKey((int)tt.DebitPlanProjectItemID)
                    ? debitPpiData[(int)tt.DebitPlanProjectItemID] : null;
                dynamic row = new System.Dynamic.ExpandoObject();
                var d = (IDictionary<string, object?>)row;
                d["AssetTransfer_ID"] = tt.AssetTransfer_ID;
                d["AssetItemID"] = tt.AssetItemID;
                d["TransferDate"] = tt.TransferDate;
                d["TransferValue"] = tt.TransferValue;
                d["DebitPlanProjectItemID"] = tt.DebitPlanProjectItemID;
                d["CreditPlanProjectItemID"] = tt.CreditPlanProjectItemID;
                d["MainAssetID"] = tt.MainAssetID;
                d["SCOAFundId"] = ppi?.SCOAFundId;
                d["SCOARegionId"] = ppi?.SCOARegionId;
                d["SCOACostingID"] = ppi?.SCOACostingID;
                d["SCOAProjectID"] = ppi?.ScoaProjectID;
                d["SCOAFunctionId"] = ppi?.SCOAFunctionId;
                d["SCOAItemID"] = ppi?.SCOAItemID;
                d["DivisionId"] = ppi?.DivisionId;
                d["ProjectID"] = ppi?.ProjectID;
                d["VoteID"] = ppi?.VoteId;
                return row;
            }).Cast<dynamic>().ToList();

            var creditRows = rawTransferRows.Select(tt => {
                var ppi = tt.CreditPlanProjectItemID != null && creditPpiData.ContainsKey((int)tt.CreditPlanProjectItemID)
                    ? creditPpiData[(int)tt.CreditPlanProjectItemID] : null;
                dynamic row = new System.Dynamic.ExpandoObject();
                var d = (IDictionary<string, object?>)row;
                d["AssetTransfer_ID"] = tt.AssetTransfer_ID;
                d["AssetItemID"] = tt.MainAssetID;
                d["TransferDate"] = tt.TransferDate;
                d["TransferValue"] = tt.TransferValue;
                d["CreditPlanProjectItemID"] = tt.CreditPlanProjectItemID;
                d["SCOAFundId"] = ppi?.SCOAFundId;
                d["SCOARegionId"] = ppi?.SCOARegionId;
                d["SCOACostingID"] = ppi?.SCOACostingID;
                d["SCOAProjectID"] = ppi?.ScoaProjectID;
                d["SCOAFunctionId"] = ppi?.SCOAFunctionId;
                d["SCOAItemID"] = ppi?.SCOAItemID;
                d["DivisionId"] = ppi?.DivisionId;
                d["ProjectID"] = ppi?.ProjectID;
                d["VoteID"] = ppi?.VoteId;
                return row;
            }).Cast<dynamic>().ToList();

            int GetAssetTxnMonth(DateTime dt)
            {
                return dt.Month <= 6 ? dt.Month + 6 : dt.Month - 6;
            }
            string GetAssetTxnYear(DateTime dt)
            {
                return dt.Month <= 6
                    ? (dt.Year - 1) + "/" + dt.Year
                    : dt.Year + "/" + (dt.Year + 1);
            }

            foreach (var dr in transferRows)
            {
                var drDict = (IDictionary<string, object>)dr;
                var tDate = drDict.ContainsKey("TransferDate") && drDict["TransferDate"] is DateTime d ? d : request.TransferDate;
                var tValue = drDict.ContainsKey("TransferValue") && drDict["TransferValue"] != null ? Convert.ToDecimal(drDict["TransferValue"]) : 0m;
                var assetItemId = drDict.ContainsKey("AssetItemID") ? Convert.ToInt32(drDict["AssetItemID"]) : 0;
                var debitVoteId = drDict.ContainsKey("VoteID") && drDict["VoteID"] != null ? (int?)Convert.ToInt32(drDict["VoteID"]) : null;
                var scoaFundsId = drDict.ContainsKey("SCOAFundId") && drDict["SCOAFundId"] != null ? (int?)Convert.ToInt32(drDict["SCOAFundId"]) : null;
                var scoaRegionId = drDict.ContainsKey("SCOARegionId") && drDict["SCOARegionId"] != null ? (int?)Convert.ToInt32(drDict["SCOARegionId"]) : null;
                var scoaCostingId = drDict.ContainsKey("SCOACostingID") && drDict["SCOACostingID"] != null ? (int?)Convert.ToInt32(drDict["SCOACostingID"]) : null;
                var scoaProjectId = drDict.ContainsKey("SCOAProjectID") && drDict["SCOAProjectID"] != null ? (int?)Convert.ToInt32(drDict["SCOAProjectID"]) : null;
                var scoaFunctionId = drDict.ContainsKey("SCOAFunctionId") && drDict["SCOAFunctionId"] != null ? (int?)Convert.ToInt32(drDict["SCOAFunctionId"]) : null;
                var scoaItemId = drDict.ContainsKey("SCOAItemID") && drDict["SCOAItemID"] != null ? (int?)Convert.ToInt32(drDict["SCOAItemID"]) : null;

                await conn.ExecuteAsync(@"
                    INSERT INTO ""Led_Journal_Asset""
                    (""FinYear"", ""ProcessingMonth"", ""TransactionID"", ""AssetJournalTransactionTypeID"",
                     ""TransactionDate"", ""DebitVoteID"", ""CreditVoteID"", ""Amount"", ""DocumentNumber"",
                     ""DateCaptured"", ""CapturerID"", ""ItemDescription"", ""Asset_RegisterItem_ID"",
                     ""SCOAFundsID"", ""SCOARegionID"", ""SCOACostingID"", ""SCOAProjectID"", ""SCOAFunctionID"", ""SCOAItemID"")
                    VALUES
                    (@FinYear, @ProcessingMonth, @TransactionID, @AJTTypeId,
                     @TransactionDate, @DebitVoteID, NULL, @Amount, @DocumentNumber,
                     NOW(), 1, 'Asset Transfer', @AssetItemID,
                     @SCOAFundsID, @SCOARegionID, @SCOACostingID, @SCOAProjectID, @SCOAFunctionID, @SCOAItemID)",
                    new
                    {
                        FinYear = finYear,
                        ProcessingMonth = processingMonth,
                        TransactionID = transactionGuid,
                        AJTTypeId = assetJournalTxnTypeId,
                        TransactionDate = tDate,
                        DebitVoteID = debitVoteId,
                        Amount = tValue,
                        DocumentNumber = newDocNumber,
                        AssetItemID = assetItemId,
                        SCOAFundsID = scoaFundsId,
                        SCOARegionID = scoaRegionId,
                        SCOACostingID = scoaCostingId,
                        SCOAProjectID = scoaProjectId,
                        SCOAFunctionID = scoaFunctionId,
                        SCOAItemID = scoaItemId ?? 0
                    }, txn);

                var glMonth = GetAssetTxnMonth(tDate);
                var glYear = GetAssetTxnYear(tDate);
                var debitPlanProjItemId = drDict.ContainsKey("DebitPlanProjectItemID") && drDict["DebitPlanProjectItemID"] != null ? (int?)Convert.ToInt32(drDict["DebitPlanProjectItemID"]) : null;

                await conn.ExecuteAsync(@"
                    INSERT INTO ""Asset_GeneralLedger""
                    (""PostingDate"", ""ProcessingMonth"", ""VoteID"", ""FinYear"", ""TransactionTypeID"",
                     ""TransactionDetails"", ""DocumentNumber"", ""Debit"", ""Credit"",
                     ""DateCaptured"", ""CapturerID"", ""MatchTranGuid"", ""AssetLinkID"",
                     ""SCOAFundsID"", ""SCOARegionID"", ""SCOACostingID"", ""SCOAProjectID"",
                     ""SCOAFunctionID"", ""SCOAItemID"", ""DivisionID"", ""ProjectID"", ""PlanProjectItemID"")
                    VALUES
                    (NOW(), @ProcessingMonth, @VoteID, @FinYear, @TransactionTypeID,
                     'Asset Transfer', @DocumentNumber, @Debit, @Credit,
                     @TransferDate, 1, @MatchTranGuid, @RunID,
                     @SCOAFundsID, @SCOARegionID, @SCOACostingID, @SCOAProjectID,
                     @SCOAFunctionID, @SCOAItemID, @DivisionID, @ProjectID, @PlanProjectItemID)",
                    new
                    {
                        ProcessingMonth = glMonth,
                        VoteID = debitVoteId,
                        FinYear = glYear,
                        TransactionTypeID = assetJournalTxnTypeId,
                        DocumentNumber = newDocNumber,
                        Debit = tValue,
                        Credit = 0m,
                        TransferDate = tDate,
                        MatchTranGuid = transactionGuid,
                        RunID = job.RunID,
                        SCOAFundsID = scoaFundsId,
                        SCOARegionID = scoaRegionId,
                        SCOACostingID = scoaCostingId,
                        SCOAProjectID = scoaProjectId,
                        SCOAFunctionID = scoaFunctionId,
                        SCOAItemID = scoaItemId ?? 0,
                        DivisionID = drDict.ContainsKey("DivisionId") && drDict["DivisionId"] != null ? (int?)Convert.ToInt32(drDict["DivisionId"]) : null,
                        ProjectID = drDict.ContainsKey("ProjectID") && drDict["ProjectID"] != null ? (int?)Convert.ToInt32(drDict["ProjectID"]) : null,
                        PlanProjectItemID = debitPlanProjItemId
                    }, txn);
            }

            foreach (var cr in creditRows)
            {
                var crDict = (IDictionary<string, object>)cr;
                var tDate = crDict.ContainsKey("TransferDate") && crDict["TransferDate"] is DateTime d ? d : request.TransferDate;
                var tValue = crDict.ContainsKey("TransferValue") && crDict["TransferValue"] != null ? Convert.ToDecimal(crDict["TransferValue"]) : 0m;
                var assetItemId = crDict.ContainsKey("AssetItemID") ? Convert.ToInt32(crDict["AssetItemID"]) : request.MainAssetId;
                var creditVoteId = crDict.ContainsKey("VoteID") && crDict["VoteID"] != null ? (int?)Convert.ToInt32(crDict["VoteID"]) : null;
                var scoaFundsId = crDict.ContainsKey("SCOAFundId") && crDict["SCOAFundId"] != null ? (int?)Convert.ToInt32(crDict["SCOAFundId"]) : null;
                var scoaRegionId = crDict.ContainsKey("SCOARegionId") && crDict["SCOARegionId"] != null ? (int?)Convert.ToInt32(crDict["SCOARegionId"]) : null;
                var scoaCostingId = crDict.ContainsKey("SCOACostingID") && crDict["SCOACostingID"] != null ? (int?)Convert.ToInt32(crDict["SCOACostingID"]) : null;
                var scoaProjectId = crDict.ContainsKey("SCOAProjectID") && crDict["SCOAProjectID"] != null ? (int?)Convert.ToInt32(crDict["SCOAProjectID"]) : null;
                var scoaFunctionId = crDict.ContainsKey("SCOAFunctionId") && crDict["SCOAFunctionId"] != null ? (int?)Convert.ToInt32(crDict["SCOAFunctionId"]) : null;
                var scoaItemId = crDict.ContainsKey("SCOAItemID") && crDict["SCOAItemID"] != null ? (int?)Convert.ToInt32(crDict["SCOAItemID"]) : null;

                await conn.ExecuteAsync(@"
                    INSERT INTO ""Led_Journal_Asset""
                    (""FinYear"", ""ProcessingMonth"", ""TransactionID"", ""AssetJournalTransactionTypeID"",
                     ""TransactionDate"", ""DebitVoteID"", ""CreditVoteID"", ""Amount"", ""DocumentNumber"",
                     ""DateCaptured"", ""CapturerID"", ""ItemDescription"", ""Asset_RegisterItem_ID"",
                     ""SCOAFundsID"", ""SCOARegionID"", ""SCOACostingID"", ""SCOAProjectID"", ""SCOAFunctionID"", ""SCOAItemID"")
                    VALUES
                    (@FinYear, @ProcessingMonth, @TransactionID, @AJTTypeId,
                     @TransactionDate, NULL, @CreditVoteID, @Amount, @DocumentNumber,
                     NOW(), 1, 'Asset Transfer', @AssetItemID,
                     @SCOAFundsID, @SCOARegionID, @SCOACostingID, @SCOAProjectID, @SCOAFunctionID, @SCOAItemID)",
                    new
                    {
                        FinYear = finYear,
                        ProcessingMonth = processingMonth,
                        TransactionID = transactionGuid,
                        AJTTypeId = assetJournalTxnTypeId,
                        TransactionDate = tDate,
                        CreditVoteID = creditVoteId,
                        Amount = tValue,
                        DocumentNumber = newDocNumber,
                        AssetItemID = assetItemId,
                        SCOAFundsID = scoaFundsId,
                        SCOARegionID = scoaRegionId,
                        SCOACostingID = scoaCostingId,
                        SCOAProjectID = scoaProjectId,
                        SCOAFunctionID = scoaFunctionId,
                        SCOAItemID = scoaItemId ?? 0
                    }, txn);

                var glMonth = GetAssetTxnMonth(tDate);
                var glYear = GetAssetTxnYear(tDate);

                await conn.ExecuteAsync(@"
                    INSERT INTO ""Asset_GeneralLedger""
                    (""PostingDate"", ""ProcessingMonth"", ""VoteID"", ""FinYear"", ""TransactionTypeID"",
                     ""TransactionDetails"", ""DocumentNumber"", ""Debit"", ""Credit"",
                     ""DateCaptured"", ""CapturerID"", ""MatchTranGuid"", ""AssetLinkID"",
                     ""SCOAFundsID"", ""SCOARegionID"", ""SCOACostingID"", ""SCOAProjectID"",
                     ""SCOAFunctionID"", ""SCOAItemID"", ""DivisionID"", ""ProjectID"", ""PlanProjectItemID"")
                    VALUES
                    (NOW(), @ProcessingMonth, @VoteID, @FinYear, @TransactionTypeID,
                     'Asset Transfer', @DocumentNumber, @Debit, @Credit,
                     @TransferDate, 1, @MatchTranGuid, @RunID,
                     @SCOAFundsID, @SCOARegionID, @SCOACostingID, @SCOAProjectID,
                     @SCOAFunctionID, @SCOAItemID, @DivisionID, @ProjectID, @PlanProjectItemID)",
                    new
                    {
                        ProcessingMonth = glMonth,
                        VoteID = creditVoteId,
                        FinYear = glYear,
                        TransactionTypeID = assetJournalTxnTypeId,
                        DocumentNumber = newDocNumber,
                        Debit = 0m,
                        Credit = tValue,
                        TransferDate = tDate,
                        MatchTranGuid = transactionGuid,
                        RunID = job.RunID,
                        SCOAFundsID = scoaFundsId,
                        SCOARegionID = scoaRegionId,
                        SCOACostingID = scoaCostingId,
                        SCOAProjectID = scoaProjectId,
                        SCOAFunctionID = scoaFunctionId,
                        SCOAItemID = scoaItemId ?? 0,
                        DivisionID = crDict.ContainsKey("DivisionId") && crDict["DivisionId"] != null ? (int?)Convert.ToInt32(crDict["DivisionId"]) : null,
                        ProjectID = crDict.ContainsKey("ProjectID") && crDict["ProjectID"] != null ? (int?)Convert.ToInt32(crDict["ProjectID"]) : null,
                        PlanProjectItemID = (int?)request.CreditPlanProjectItemId
                    }, txn);
            }

            _progressTracker[approveKey] = new ProgressInfo { Phase = "asset_transactions", Percent = 90, Message = "Creating asset register transactions..." };

            for (int idx = 0; idx < newAssetIds.Count; idx++)
            {
                var (assetId, uploadRow) = newAssetIds[idx];
                var currentValue = GetDecimal(uploadRow, "CarryingAmountClosingBalance");
                if (currentValue == 0m) currentValue = GetDecimal(uploadRow, "PurchaseAmount");
                var purchaseAmt = GetDecimal(uploadRow, "PurchaseAmount");
                var residualVal = GetDecimal(uploadRow, "ResidualValue");
                var usefulLife = GetDecimal(uploadRow, "UsefulLifeMonthComponent");
                var remainingLife = GetDecimal(uploadRow, "RemainingUsefulLife");

                var assetTxnMonth = GetAssetTxnMonth(request.TransferDate);
                var assetTxnYear = GetAssetTxnYear(request.TransferDate);

                await conn.ExecuteAsync(@"
                    INSERT INTO ""Asset_Register_Transactions""
                    (""AssetRegisterItem_ID"", ""TransactionTypeID"", ""TransactionDate"",
                     ""PurchaseAmount"", ""ResidualValue"", ""CurrentValue"", ""UsefulLife"", ""RemaingUsefulLife"",
                     ""DepreciationValue"", ""ImpairmentValue"", ""RevaluationValue"", ""FairValue"",
                     ""DisposalValue"", ""DisposalLossValue"", ""DisposalTotalValue"",
                     ""AccumulatedDepreciation"", ""AccumulatedImpairment"", ""AccumulatedFairValue"", ""AccumulatedRevaluation"",
                     ""FinancialPeriod"", ""FinancialYear"", ""DocumentType_ID"", ""GLGUID_ID"", ""TransactionSource_ID"",
                     ""DateModified"", ""Modifier"",
                     ""ImpairmentReversalValue"", ""AccumulatedImpairmentReversal"", ""ImpairmentSurplus"",
                     ""MovementInRevaluationReserve"", ""DepreciationOffset"",
                     ""RevaluationReserveImpairment"", ""RevaluationReserveImpairmentReversal"",
                     ""RevaluationReserveRevaluation"", ""RevaluationReserveDisposal"", ""DepreciationAdjustment"",
                     ""TransferFromValue"", ""TransferToValue"")
                    VALUES
                    (@AssetId, @TxnTypeId, @TxnDate,
                     @PurchaseAmount, @ResidualValue, @CurrentValue, @UsefulLife, @RemainingLife,
                     0, 0, 0, 0,
                     0, 0, 0,
                     0, 0, 0, 0,
                     @FinPeriod, @FinYear, @DocTypeId, @GlGuid, @RunID,
                     NOW(), 1,
                     0, 0, 0,
                     0, 0,
                     0, 0,
                     0, 0, 0,
                     0, @TransferToValue)",
                    new
                    {
                        AssetId = assetId,
                        TxnTypeId = transactionTypeId,
                        TxnDate = request.TransferDate,
                        PurchaseAmount = 0m,
                        ResidualValue = residualVal,
                        CurrentValue = currentValue,
                        UsefulLife = (int)usefulLife,
                        RemainingLife = remainingLife,
                        FinPeriod = assetTxnMonth,
                        FinYear = assetTxnYear,
                        DocTypeId = documentTypeId,
                        GlGuid = transactionGuid.ToString(),
                        RunID = job.RunID,
                        TransferToValue = currentValue
                    }, txn);

                await conn.ExecuteAsync(@"
                    UPDATE ""Asset_Register_Items""
                    SET ""TransferToAmount"" = @TransferToAmt
                    WHERE ""AssetRegisterItem_ID"" = @AssetId",
                    new { TransferToAmt = currentValue, AssetId = assetId }, txn);
            }

            var mainAssetCurrentValue = await conn.QueryFirstOrDefaultAsync<decimal?>(@"
                SELECT COALESCE(""CurrentAmount"", ""CarryingAmountClosingBalance"", 0)
                FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @id",
                new { id = request.MainAssetId }, txn) ?? 0m;
            var totalTransferValue = newAssetIds.Sum(x => {
                var cv = GetDecimal(x.uploadRow, "CarryingAmountClosingBalance");
                if (cv == 0m) cv = GetDecimal(x.uploadRow, "PurchaseAmount");
                return cv;
            });
            var newMainCurrentValue = mainAssetCurrentValue - totalTransferValue;

            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_Register_Transactions""
                (""AssetRegisterItem_ID"", ""TransactionTypeID"", ""TransactionDate"",
                 ""PurchaseAmount"", ""ResidualValue"", ""CurrentValue"", ""UsefulLife"", ""RemaingUsefulLife"",
                 ""DepreciationValue"", ""ImpairmentValue"", ""RevaluationValue"", ""FairValue"",
                 ""DisposalValue"", ""DisposalLossValue"", ""DisposalTotalValue"",
                 ""AccumulatedDepreciation"", ""AccumulatedImpairment"", ""AccumulatedFairValue"", ""AccumulatedRevaluation"",
                 ""FinancialPeriod"", ""FinancialYear"", ""DocumentType_ID"", ""GLGUID_ID"", ""TransactionSource_ID"",
                 ""DateModified"", ""Modifier"",
                 ""ImpairmentReversalValue"", ""AccumulatedImpairmentReversal"", ""ImpairmentSurplus"",
                 ""MovementInRevaluationReserve"", ""DepreciationOffset"",
                 ""RevaluationReserveImpairment"", ""RevaluationReserveImpairmentReversal"",
                 ""RevaluationReserveRevaluation"", ""RevaluationReserveDisposal"", ""DepreciationAdjustment"",
                 ""TransferFromValue"", ""TransferToValue"")
                VALUES
                (@AssetId, @TxnTypeId, @TxnDate,
                 @PurchaseAmount, 0, @CurrentValue, 0, 0,
                 0, 0, 0, 0,
                 0, 0, 0,
                 0, 0, 0, 0,
                 @FinPeriod, @FinYear, @DocTypeId, @GlGuid, @RunID,
                 NOW(), 1,
                 0, 0, 0,
                 0, 0,
                 0, 0,
                 0, 0, 0,
                 @TransferFromValue, 0)",
                new
                {
                    AssetId = request.MainAssetId,
                    TxnTypeId = transactionTypeId,
                    TxnDate = request.TransferDate,
                    PurchaseAmount = 0m,
                    CurrentValue = newMainCurrentValue,
                    FinPeriod = GetAssetTxnMonth(request.TransferDate),
                    FinYear = GetAssetTxnYear(request.TransferDate),
                    DocTypeId = documentTypeId,
                    GlGuid = transactionGuid.ToString(),
                    RunID = job.RunID,
                    TransferFromValue = totalTransferValue
                }, txn);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items""
                SET ""CurrentAmount"" = @NewCurrentAmount
                WHERE ""AssetRegisterItem_ID"" = @AssetId",
                new { NewCurrentAmount = newMainCurrentValue, AssetId = request.MainAssetId }, txn);

            _progressTracker[approveKey] = new ProgressInfo { Phase = "summaries", Percent = 96, Message = "Updating transaction summaries..." };

            var txnFinYear = GetAssetTxnYear(request.TransferDate);
            var txnFinPeriod = GetAssetTxnMonth(request.TransferDate);

            for (int idx = 0; idx < newAssetIds.Count; idx++)
            {
                var (assetId, _) = newAssetIds[idx];
                await _txnService.PopulateTransactionSummarySingle(conn, txn, assetId, txnFinYear, txnFinPeriod);
            }
            await _txnService.PopulateTransactionSummarySingle(conn, txn, request.MainAssetId, txnFinYear, txnFinPeriod);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Transfer_Transactions""
                SET ""DateModified"" = NOW(), ""ModifierID"" = 1, ""IsApproved"" = 1
                WHERE ""Run_ID"" = @RunId",
                new { RunId = job.RunID }, txn);
        }
        catch (Exception ex)
        {
            _progressTracker.TryRemove(approveKey, out _);
            await txn.RollbackAsync();
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_BulkUploadJobs""
                SET ""Job_Status"" = @status, ""ProcessDate"" = NOW()
                WHERE ""ID"" = @id",
                new { id, status = "WIP Approval Failed: " + ex.Message });
            return StatusCode(500, new { error = "WIP approval failed during GL/journal creation", detail = ex.Message });
        }

        await txn.CommitAsync();

        _progressTracker[approveKey] = new ProgressInfo { Phase = "complete", Percent = 100, Message = "WIP Approved! " + insertCount + " records transferred." };

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_BulkUploadJobs""
            SET ""Job_Status"" = 'Approved', ""ApprovedByID"" = 1, ""ApprovedDate"" = NOW(), ""ProcessDate"" = NOW()
            WHERE ""ID"" = @id", new { id });

        try
        {
            var wipEmailType = await conn.QueryFirstOrDefaultAsync<string>(
                @"SELECT COALESCE(""TypeDesc"", ""ID""::VARCHAR) FROM ""Asset_UploadType"" WHERE ""ID"" = @id",
                new { id = job.UploadType ?? 1 }) ?? "Bulk Upload WIP";
            _ = _emailService.SendTransactionEmailsAsync(wipEmailType);
        }
        catch (Exception emailEx)
        {
            Console.Error.WriteLine($"[BulkUploadController] Failed to send WIP approval email: {emailEx.Message}");
        }
        _ = Task.Delay(5000).ContinueWith(t => { ProgressInfo? removed; _progressTracker.TryRemove(approveKey, out removed); });
        return Ok(new { success = 1, approvedRecords = insertCount, progressKey = approveKey });
    }

    [HttpPost("jobs/{id:int}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_BulkUploadJobs""
            SET ""Job_Status"" = 'Not Approved', ""ProcessDate"" = NOW()
            WHERE ""ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Job not found" }) : Ok(new { success = 1 });
    }
}
