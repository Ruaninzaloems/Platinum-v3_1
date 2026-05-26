using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;
using System.Net.Http.Json;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/bulk-transactions")]
public class BulkTransactionController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly LookupService _lookupService;

    private static readonly string[] RevalHeaders = { "AssetRegisterItem_ID", "RevaluationDate", "MarketValue", "ValuationModule", "DepAdjustment" };
    private static readonly string[] ImpairHeaders = { "AssetRegisterItem_ID", "TransactionDate", "ImpairmentType", "RecoverableAmount", "ValueInUse", "Reason" };
    private static readonly string[] ReversalHeaders = { "AssetRegisterItem_ID", "TransactionDate", "RecoverableAmount", "ValueInUse", "Reason" };
    private static readonly string[] DisposalHeaders = { "AssetRegisterItem_ID", "DisposalDate", "Method", "DisposalProceeds", "Reason" };
    private static readonly string[] RefurbHeaders = { "AssetRegisterItem_ID", "RefurbDate", "Refurb_DT", "Refurb_CT", "Refurb_Depreciation", "Refurb_Revaluation", "Refurb_Impairment", "DebitPlanProjectItemId", "CreditPlanProjectItemId" };

    private static readonly HashSet<string> ValidTypes = new(StringComparer.OrdinalIgnoreCase)
        { "Revaluation", "Impairment", "ImpairmentReversal", "Disposal", "Refurbishment" };

    public BulkTransactionController(DbConnectionFactory db, TransactionService txnService, IHttpClientFactory httpClientFactory, LookupService lookupService)
    {
        _db = db;
        _txnService = txnService;
        _httpClientFactory = httpClientFactory;
        _lookupService = lookupService;
    }

    [HttpGet("template/{type}")]
    public IActionResult DownloadTemplate(string type)
    {
        if (!ValidTypes.Contains(type))
            return BadRequest(new { error = "Invalid transaction type. Valid: Revaluation, Impairment, ImpairmentReversal, Disposal, Refurbishment" });

        string[] headers = type switch
        {
            "Revaluation" => RevalHeaders,
            "Impairment" => ImpairHeaders,
            "ImpairmentReversal" => ReversalHeaders,
            "Disposal" => DisposalHeaders,
            "Refurbishment" => RefurbHeaders,
            _ => RevalHeaders
        };

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add(type + " Template");
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1e3a5f");
            cell.Style.Font.FontColor = XLColor.White;
        }
        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"BulkTransaction_{type}_Template.xlsx");
    }

    [HttpPost("upload")]
    [RequestSizeLimit(50_000_000)]
    public async Task<IActionResult> Upload(IFormFile file, [FromForm] string transactionType)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });
        if (!ValidTypes.Contains(transactionType))
            return BadRequest(new { error = "Invalid transaction type" });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".xlsx" && ext != ".xls")
            return BadRequest(new { error = "Only .xlsx and .xls files are supported" });

        string[] expectedHeaders = transactionType switch
        {
            "Revaluation" => RevalHeaders,
            "Impairment" => ImpairHeaders,
            "ImpairmentReversal" => ReversalHeaders,
            "Disposal" => DisposalHeaders,
            "Refurbishment" => RefurbHeaders,
            _ => RevalHeaders
        };

        List<Dictionary<string, string>> rows;
        try
        {
            using var stream = file.OpenReadStream();
            using var workbook = new XLWorkbook(stream);
            var ws = workbook.Worksheets.First();
            var headerRow = ws.Row(1);
            var colMap = new Dictionary<int, string>();
            for (int c = 1; c <= (ws.LastColumnUsed()?.ColumnNumber() ?? 0); c++)
            {
                var hdr = headerRow.Cell(c).GetString().Trim();
                if (!string.IsNullOrWhiteSpace(hdr)) colMap[c] = hdr;
            }

            rows = new List<Dictionary<string, string>>();
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            for (int r = 2; r <= lastRow; r++)
            {
                var rowData = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                bool hasData = false;
                foreach (var kv in colMap)
                {
                    var cell = ws.Cell(r, kv.Key);
                    string val;
                    if (cell.DataType == XLDataType.Number)
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
            return BadRequest(new { error = "Error reading file: " + ex.Message });
        }

        if (rows.Count == 0)
            return BadRequest(new { error = "File contains no data rows" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var validAssetIds = new HashSet<int>(
            await conn.QueryAsync<int>(@"SELECT ""AssetRegisterItem_ID"" FROM ""Asset_Register_Items"""));

        var validPPIIds = transactionType == "Refurbishment"
            ? await _lookupService.GetPlanProjectItemIdsAsync(conn)
            : new HashSet<int>();

        var errors = new List<object>();
        DateTime? firstMonth = null;

        // Fetch cutoff once before the per-row loop
        var (bulkCutoffDate, _, _) = await _txnService.GetNextRunCutoffDateAsync(conn);

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            int rowNum = i + 2;
            var rowErrors = new List<string>();

            string assetIdStr = row.GetValueOrDefault("AssetRegisterItem_ID", "");
            if (string.IsNullOrWhiteSpace(assetIdStr) || !int.TryParse(assetIdStr, out int assetId))
                rowErrors.Add("AssetRegisterItem_ID is required and must be a number");
            else if (!validAssetIds.Contains(assetId))
                rowErrors.Add($"AssetRegisterItem_ID {assetId} not found in Asset Register");

            string dateCol = transactionType == "Revaluation" ? "RevaluationDate"
                           : transactionType == "Disposal" ? "DisposalDate"
                           : transactionType == "Refurbishment" ? "RefurbDate"
                           : "TransactionDate";
            string dateStr = row.GetValueOrDefault(dateCol, "");
            DateTime txnDate = DateTime.MinValue;
            if (string.IsNullOrWhiteSpace(dateStr))
                rowErrors.Add($"{dateCol} is required");
            else if (!DateTime.TryParse(dateStr, out txnDate))
                rowErrors.Add($"{dateCol} is not a valid date");
            else
            {
                var thisMonth = new DateTime(txnDate.Year, txnDate.Month, 1);
                if (firstMonth == null) firstMonth = thisMonth;
                else if (thisMonth != firstMonth.Value)
                    rowErrors.Add($"All dates must be in the same month. Expected {firstMonth.Value:yyyy-MM}, got {thisMonth:yyyy-MM}");

                // Per-row cutoff validation
                if (txnDate.Date > bulkCutoffDate.Date)
                    rowErrors.Add($"{dateCol} {txnDate:dd MMM yyyy} is beyond the next run cutoff date of {bulkCutoffDate:dd MMM yyyy}. Transactions must be on or before the cutoff for the current open period.");
            }

            switch (transactionType)
            {
                case "Revaluation":
                    if (!TryGetDecimal(row, "MarketValue", out _))
                        rowErrors.Add("MarketValue is required and must be a number");
                    string vmStr = row.GetValueOrDefault("ValuationModule", "");
                    if (string.IsNullOrWhiteSpace(vmStr) || !int.TryParse(vmStr, out int vm) || vm < 1 || vm > 3)
                        rowErrors.Add("ValuationModule is required (1=Cost, 2=Revaluation, 3=Fair Value)");
                    break;
                case "Impairment":
                    if (!TryGetDecimal(row, "RecoverableAmount", out _))
                        rowErrors.Add("RecoverableAmount is required and must be a number");
                    if (!TryGetDecimal(row, "ValueInUse", out _))
                        rowErrors.Add("ValueInUse is required and must be a number");
                    string impType = row.GetValueOrDefault("ImpairmentType", "");
                    if (string.IsNullOrWhiteSpace(impType) || (impType != "cash_generating" && impType != "non_cash_generating"))
                        rowErrors.Add("ImpairmentType must be 'cash_generating' or 'non_cash_generating'");
                    string impReason = row.GetValueOrDefault("Reason", "");
                    if (string.IsNullOrWhiteSpace(impReason))
                        rowErrors.Add("Reason is required");
                    break;
                case "ImpairmentReversal":
                    if (!TryGetDecimal(row, "RecoverableAmount", out _))
                        rowErrors.Add("RecoverableAmount is required and must be a number");
                    if (!TryGetDecimal(row, "ValueInUse", out _))
                        rowErrors.Add("ValueInUse is required and must be a number");
                    string revReason = row.GetValueOrDefault("Reason", "");
                    if (string.IsNullOrWhiteSpace(revReason))
                        rowErrors.Add("Reason is required");
                    break;
                case "Disposal":
                    if (!TryGetDecimal(row, "DisposalProceeds", out _))
                        rowErrors.Add("DisposalProceeds is required and must be a number");
                    string dispMethod = row.GetValueOrDefault("Method", "");
                    if (string.IsNullOrWhiteSpace(dispMethod))
                        rowErrors.Add("Method is required");
                    string dispReason = row.GetValueOrDefault("Reason", "");
                    if (string.IsNullOrWhiteSpace(dispReason))
                        rowErrors.Add("Reason is required");
                    break;
                case "Refurbishment":
                    TryGetDecimal(row, "Refurb_DT", out decimal rDT);
                    TryGetDecimal(row, "Refurb_CT", out decimal rCT);
                    if (rDT <= 0 && rCT <= 0)
                        rowErrors.Add("At least one of Refurb_DT or Refurb_CT must be greater than zero");
                    string debitPPIStr = row.GetValueOrDefault("DebitPlanProjectItemId", "");
                    if (string.IsNullOrWhiteSpace(debitPPIStr) || !int.TryParse(debitPPIStr, out int debitPPIVal))
                        rowErrors.Add("DebitPlanProjectItemId is required and must be a number");
                    else if (!validPPIIds.Contains(debitPPIVal))
                        rowErrors.Add($"DebitPlanProjectItemId {debitPPIVal} not found in project item list");
                    string creditPPIStr = row.GetValueOrDefault("CreditPlanProjectItemId", "");
                    if (string.IsNullOrWhiteSpace(creditPPIStr) || !int.TryParse(creditPPIStr, out int creditPPIVal))
                        rowErrors.Add("CreditPlanProjectItemId is required and must be a number");
                    else if (!validPPIIds.Contains(creditPPIVal))
                        rowErrors.Add($"CreditPlanProjectItemId {creditPPIVal} not found in project item list");
                    break;
            }

            if (rowErrors.Count > 0)
                errors.Add(new { row = rowNum, errors = rowErrors });
        }

        // ── per-asset last-transaction-date check ───────────────────────────────
        var errorRows = new HashSet<int>();
        foreach (var e in errors)
        {
            var rowProp = e.GetType().GetProperty("row");
            if (rowProp != null) errorRows.Add((int)rowProp.GetValue(e)!);
        }

        var uploadedAssetIds = new List<int>();
        for (int i = 0; i < rows.Count; i++)
        {
            if (int.TryParse(rows[i].GetValueOrDefault("AssetRegisterItem_ID", ""), out int aid) && aid > 0 && validAssetIds.Contains(aid))
                uploadedAssetIds.Add(aid);
        }
        uploadedAssetIds = uploadedAssetIds.Distinct().ToList();

        var lastTxnDates = new Dictionary<int, DateTime>();
        if (uploadedAssetIds.Count > 0)
        {
            var lastTxns = await conn.QueryAsync<dynamic>(
                @"SELECT ""AssetRegisterItem_ID"" AS ""AssetId"", MAX(""TransactionDate"") AS ""LastDate""
                  FROM ""Asset_Register_Transactions""
                  WHERE ""AssetRegisterItem_ID"" = ANY(@ids)
                  GROUP BY ""AssetRegisterItem_ID""",
                new { ids = uploadedAssetIds.ToArray() });
            foreach (var lt in lastTxns)
                lastTxnDates[(int)lt.AssetId] = (DateTime)lt.LastDate;
        }

        string dateColName = transactionType == "Revaluation" ? "RevaluationDate"
                           : transactionType == "Disposal" ? "DisposalDate"
                           : "TransactionDate";
        for (int i = 0; i < rows.Count; i++)
        {
            int rowNum = i + 2;
            if (errorRows.Contains(rowNum)) continue;
            var row = rows[i];
            if (!int.TryParse(row.GetValueOrDefault("AssetRegisterItem_ID", ""), out int assetId)) continue;
            if (!DateTime.TryParse(row.GetValueOrDefault(dateColName, ""), out DateTime txnDate)) continue;
            if (lastTxnDates.TryGetValue(assetId, out DateTime lastDate) && txnDate.Date <= lastDate.Date)
                errors.Add(new { row = rowNum, errors = new List<string> {
                    $"Transaction date {txnDate:dd MMM yyyy} must be after the last posted transaction " +
                    $"for asset {assetId} ({lastDate:dd MMM yyyy}). Transactions must be dated after all existing transactions for this asset."
                }});
        }

        // ── month-end lock check (Asset_MonthlyApproval) ─────────────────────────
        if (firstMonth.HasValue)
        {
            var (finYear, period) = _txnService.GetFinancialPeriodForDate(firstMonth.Value);

            var monthLocked = await conn.QuerySingleAsync<int>(
                @"SELECT COUNT(*) FROM ""Asset_MonthlyApproval""
                  WHERE ""Financial_Year"" = @finYear
                    AND ""Financial_Period"" = @period
                    AND ""IsApproved"" = TRUE",
                new { finYear, period });

            if (monthLocked > 0)
                errors.Add(new { row = 0, errors = new List<string> {
                    $"The monthly run for {finYear} Period {period} ({firstMonth.Value:MMMM yyyy}) has already been approved. Transactions cannot be posted to a closed period."
                }});
        }

        if (errors.Count > 0)
            return BadRequest(new { error = "Validation failed", totalRows = rows.Count, errorCount = errors.Count, validationErrors = errors });

        var jobId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_BulkTransactionJobs"" (""Filename"", ""TransactionType"", ""Status"", ""TotalRecords"", ""UploadedBy"", ""UploadedDate"")
            VALUES (@Filename, @TransactionType, 'Pending', @Total, 1, NOW())
            RETURNING ""ID""",
            new { Filename = file.FileName, TransactionType = transactionType, Total = rows.Count });

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            string dateCol = transactionType == "Revaluation" ? "RevaluationDate"
                           : transactionType == "Disposal" ? "DisposalDate"
                           : transactionType == "Refurbishment" ? "RefurbDate"
                           : "TransactionDate";

            int.TryParse(row.GetValueOrDefault("AssetRegisterItem_ID", "0"), out int assetRegId);
            DateTime.TryParse(row.GetValueOrDefault(dateCol, ""), out DateTime txnDate);
            TryGetDecimal(row, "MarketValue", out decimal marketValue);
            int.TryParse(row.GetValueOrDefault("ValuationModule", "0"), out int valModule);
            TryGetDecimal(row, "DepAdjustment", out decimal depAdj);
            TryGetDecimal(row, "RecoverableAmount", out decimal recoverableAmt);
            TryGetDecimal(row, "ValueInUse", out decimal valueInUse);
            TryGetDecimal(row, "DisposalProceeds", out decimal disposalProceeds);
            string impType = row.GetValueOrDefault("ImpairmentType", "");
            string method = row.GetValueOrDefault("Method", "");
            string reason = row.GetValueOrDefault("Reason", "");
            TryGetDecimal(row, "Refurb_DT", out decimal refurbDT);
            TryGetDecimal(row, "Refurb_CT", out decimal refurbCT);
            TryGetDecimal(row, "Refurb_Depreciation", out decimal refurbDep);
            TryGetDecimal(row, "Refurb_Revaluation", out decimal refurbReval);
            TryGetDecimal(row, "Refurb_Impairment", out decimal refurbImp);
            int.TryParse(row.GetValueOrDefault("DebitPlanProjectItemId", "0"), out int debitPPI);
            int.TryParse(row.GetValueOrDefault("CreditPlanProjectItemId", "0"), out int creditPPI);

            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_BulkTransactionItems""
                    (""JobID"", ""RowNumber"", ""AssetRegisterItemID"", ""TransactionType"", ""TransactionDate"",
                     ""MarketValue"", ""ValuationModule"", ""DepAdjustment"",
                     ""ImpairmentType"", ""RecoverableAmount"", ""ValueInUse"", ""Reason"",
                     ""DisposalMethod"", ""DisposalProceeds"",
                     ""Refurb_DT"", ""Refurb_CT"", ""Refurb_Depreciation"", ""Refurb_Revaluation"", ""Refurb_Impairment"",
                     ""DebitPlanProjectItemId"", ""CreditPlanProjectItemId"",
                     ""Status"", ""DateCreated"")
                VALUES
                    (@JobID, @RowNum, @AssetRegID, @TxnType, @TxnDate,
                     @MarketValue, @ValModule, @DepAdj,
                     @ImpType, @RecovAmt, @ValueInUse, @Reason,
                     @Method, @DispProceeds,
                     @RefurbDT, @RefurbCT, @RefurbDep, @RefurbReval, @RefurbImp,
                     @DebitPPI, @CreditPPI,
                     'Pending', NOW())",
                new
                {
                    JobID = jobId, RowNum = i + 2, AssetRegID = assetRegId, TxnType = transactionType, TxnDate = txnDate,
                    MarketValue = marketValue != 0 ? (decimal?)marketValue : null,
                    ValModule = valModule > 0 ? (int?)valModule : null,
                    DepAdj = depAdj != 0 ? (decimal?)depAdj : null,
                    ImpType = string.IsNullOrWhiteSpace(impType) ? null : impType,
                    RecovAmt = recoverableAmt != 0 ? (decimal?)recoverableAmt : null,
                    ValueInUse = valueInUse != 0 ? (decimal?)valueInUse : null,
                    Reason = string.IsNullOrWhiteSpace(reason) ? null : reason,
                    Method = string.IsNullOrWhiteSpace(method) ? null : method,
                    DispProceeds = disposalProceeds != 0 ? (decimal?)disposalProceeds : null,
                    RefurbDT = refurbDT > 0 ? (decimal?)refurbDT : null,
                    RefurbCT = refurbCT > 0 ? (decimal?)refurbCT : null,
                    RefurbDep = refurbDep != 0 ? (decimal?)refurbDep : null,
                    RefurbReval = refurbReval != 0 ? (decimal?)refurbReval : null,
                    RefurbImp = refurbImp != 0 ? (decimal?)refurbImp : null,
                    DebitPPI = debitPPI > 0 ? (int?)debitPPI : null,
                    CreditPPI = creditPPI > 0 ? (int?)creditPPI : null
                });
        }

        return Ok(new { jobId, status = "success", totalRows = rows.Count, transactionType });
    }

    [HttpGet("jobs")]
    public async Task<IActionResult> GetJobs()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var jobs = await conn.QueryAsync<BulkTransactionJob>(
            @"SELECT * FROM ""Asset_BulkTransactionJobs"" ORDER BY ""UploadedDate"" DESC");
        return Ok(jobs);
    }

    [HttpGet("jobs/{id:int}")]
    public async Task<IActionResult> GetJob(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var job = await conn.QueryFirstOrDefaultAsync<BulkTransactionJob>(
            @"SELECT * FROM ""Asset_BulkTransactionJobs"" WHERE ""ID"" = @id", new { id });
        return job is null ? NotFound(new { error = "Job not found" }) : Ok(job);
    }

    [HttpGet("jobs/{id:int}/items")]
    public async Task<IActionResult> GetJobItems(int id, [FromQuery] string? type)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var sql = @"SELECT * FROM ""Asset_BulkTransactionItems"" WHERE ""JobID"" = @id";
        var parms = new DynamicParameters();
        parms.Add("id", id);
        if (!string.IsNullOrWhiteSpace(type))
        {
            sql += @" AND ""TransactionType"" = @type";
            parms.Add("type", type);
        }
        sql += @" ORDER BY ""RowNumber""";

        var items = await conn.QueryAsync<BulkTransactionItem>(sql, parms);

        var totalsSql = @"SELECT
            COALESCE(SUM(""MarketValue""), 0) AS ""TotalMarketValue"",
            COALESCE(SUM(""RecoverableAmount""), 0) AS ""TotalRecoverableAmount"",
            COALESCE(SUM(""ValueInUse""), 0) AS ""TotalValueInUse"",
            COALESCE(SUM(""DisposalProceeds""), 0) AS ""TotalDisposalProceeds"",
            COALESCE(SUM(""DepAdjustment""), 0) AS ""TotalDepAdjustment"",
            COALESCE(SUM(""Refurb_DT""), 0) AS ""TotalRefurbDT"",
            COALESCE(SUM(""Refurb_CT""), 0) AS ""TotalRefurbCT"",
            COALESCE(SUM(""Refurb_Depreciation""), 0) AS ""TotalRefurbDepreciation"",
            COUNT(*) AS ""ItemCount""
            FROM ""Asset_BulkTransactionItems"" WHERE ""JobID"" = @id";
        if (!string.IsNullOrWhiteSpace(type))
            totalsSql += @" AND ""TransactionType"" = @type";

        var totals = await conn.QueryFirstOrDefaultAsync<dynamic>(totalsSql, parms);

        return Ok(new { items, totals });
    }

    [HttpPost("jobs/{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var job = await conn.QueryFirstOrDefaultAsync<BulkTransactionJob>(
            @"SELECT * FROM ""Asset_BulkTransactionJobs"" WHERE ""ID"" = @id", new { id });
        if (job is null) return NotFound(new { error = "Job not found" });
        if (job.Status != "Pending")
            return BadRequest(new { error = $"Job is not in Pending status (current: {job.Status})" });

        var items = (await conn.QueryAsync<BulkTransactionItem>(
            @"SELECT * FROM ""Asset_BulkTransactionItems"" WHERE ""JobID"" = @id AND ""Status"" = 'Pending' ORDER BY ""RowNumber""",
            new { id })).ToList();

        if (items.Count == 0)
            return BadRequest(new { error = "No pending items to process" });

        var client = _httpClientFactory.CreateClient("internal");
        int posted = 0;
        int errored = 0;
        decimal totalCatchUpDep  = 0m;
        int     totalCatchUpDays = 0;
        var itemErrors = new List<object>();

        for (int i = 0; i < items.Count; i++)
        {
            var item = items[i];
            try
            {
                string? errorMsg = null;
                int? postedEntityId = null;

                decimal itemCatchUpDep  = 0m;
                int     itemCatchUpDays = 0;

                switch (item.TransactionType)
                {
                    case "Revaluation":
                        (postedEntityId, errorMsg, itemCatchUpDep, itemCatchUpDays) = await PostRevaluation(conn, client, item);
                        break;
                    case "Impairment":
                        (postedEntityId, errorMsg, itemCatchUpDep, itemCatchUpDays) = await PostImpairment(conn, client, item, false);
                        break;
                    case "ImpairmentReversal":
                        (postedEntityId, errorMsg, itemCatchUpDep, itemCatchUpDays) = await PostImpairment(conn, client, item, true);
                        break;
                    case "Disposal":
                        (postedEntityId, errorMsg, _, _) = await PostDisposal(conn, client, item);
                        break;
                    case "Refurbishment":
                        (postedEntityId, errorMsg, _, _) = await PostRefurbishment(client, item);
                        break;
                    default:
                        errorMsg = "Unknown transaction type: " + item.TransactionType;
                        break;
                }

                if (errorMsg != null)
                {
                    errored++;
                    await conn.ExecuteAsync(@"UPDATE ""Asset_BulkTransactionItems"" SET ""Status"" = 'Error', ""ErrorMessage"" = @err WHERE ""ID"" = @itemId",
                        new { err = errorMsg, itemId = item.ID });
                    itemErrors.Add(new { row = item.RowNumber, assetId = item.AssetRegisterItemID, error = errorMsg });
                }
                else
                {
                    posted++;
                    totalCatchUpDep  += itemCatchUpDep;
                    totalCatchUpDays += itemCatchUpDays;
                    await conn.ExecuteAsync(@"UPDATE ""Asset_BulkTransactionItems""
                        SET ""Status"" = 'Posted', ""PostedEntityID"" = @entityId,
                            ""CatchUpDep"" = @catchUpDep, ""CatchUpDays"" = @catchUpDays
                        WHERE ""ID"" = @itemId",
                        new { entityId = postedEntityId, catchUpDep = itemCatchUpDep > 0 ? (decimal?)itemCatchUpDep : null, catchUpDays = itemCatchUpDays > 0 ? (int?)itemCatchUpDays : null, itemId = item.ID });
                }
            }
            catch (Exception ex)
            {
                errored++;
                await conn.ExecuteAsync(@"UPDATE ""Asset_BulkTransactionItems"" SET ""Status"" = 'Error', ""ErrorMessage"" = @err WHERE ""ID"" = @itemId",
                    new { err = ex.Message, itemId = item.ID });
                itemErrors.Add(new { row = item.RowNumber, assetId = item.AssetRegisterItemID, error = ex.Message });
            }
        }

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_BulkTransactionJobs""
            SET ""Status"" = 'Approved', ""PostedRecords"" = @posted, ""ErrorRecords"" = @errored,
                ""ApprovedBy"" = 1, ""ApprovedDate"" = NOW()
            WHERE ""ID"" = @id",
            new { posted, errored, id });

        return Ok(new { success = true, posted, errored, totalItems = items.Count, totalCatchUpDep, totalCatchUpDays, errors = itemErrors });
    }

    [HttpPost("jobs/{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] BulkTransactionRejectRequest? request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var job = await conn.QueryFirstOrDefaultAsync<BulkTransactionJob>(
            @"SELECT * FROM ""Asset_BulkTransactionJobs"" WHERE ""ID"" = @id", new { id });
        if (job is null) return NotFound(new { error = "Job not found" });
        if (job.Status != "Pending")
            return BadRequest(new { error = $"Job is not in Pending status (current: {job.Status})" });

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_BulkTransactionJobs""
            SET ""Status"" = 'Rejected', ""RejectionReason"" = @reason, ""ApprovedDate"" = NOW()
            WHERE ""ID"" = @id",
            new { reason = request?.Reason ?? "", id });

        return Ok(new { success = true });
    }

    private async Task<(int catchUpDays, decimal catchUpDep)> CalculateCatchUpForAsset(
        System.Data.Common.DbConnection conn, int assetRegId, DateTime txnDate)
    {
        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT COALESCE(""RemainingUsefulLife"", ""UsefulLifeMonthComponent"", 0) AS ""RemainingUsefulLife"",
                   COALESCE(""ResidualValue"", 0) AS ""ResidualValue"",
                   COALESCE(""CurrentAmount"", ""CarryingAmountClosingBalance"", 0) AS ""CarryingValue"",
                   ""InserviceDate""
            FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId",
            new { assetRegId });

        var lastDepDate = await conn.QueryFirstOrDefaultAsync<DateTime?>(
            @"SELECT MAX(latest) FROM (
                SELECT MAX(""DepreciationDate"") AS latest FROM ""Asset_Depreciation""
                  WHERE ""AssetRegisterItem_ID"" = @assetRegId
                UNION ALL
                SELECT MAX(""TransactionDate"") AS latest FROM ""Asset_Register_Transactions""
                  WHERE ""AssetRegisterItem_ID"" = @assetRegId
                    AND ""TransactionTypeID"" IN (
                      SELECT ""ReferenceData_ID"" FROM ""Const_ReferenceData_sys""
                      WHERE ""Description"" IN ('Depreciation', 'Impairment')
                    )
              ) sub", new { assetRegId });

        DateTime depFromDate;
        if (lastDepDate.HasValue)
            depFromDate = lastDepDate.Value;
        else if (asset?.InserviceDate != null)
            depFromDate = (DateTime)asset.InserviceDate;
        else
            depFromDate = DateTime.Parse("2024-07-01");

        decimal remainingUsefulLifeMonths = (decimal)(asset?.RemainingUsefulLife ?? 0m);
        int catchUpDays = (int)(txnDate - depFromDate).TotalDays;
        if (catchUpDays < 0) catchUpDays = 0;
        decimal catchUpDep = 0m;

        if (catchUpDays > 0 && remainingUsefulLifeMonths > 0)
        {
            decimal currentValue = (decimal)(asset?.CarryingValue ?? 0m);
            decimal residual = (decimal)(asset?.ResidualValue ?? 0m);
            decimal depreciableAmount = currentValue - residual;
            if (depreciableAmount < 0) depreciableAmount = 0;
            int maxDepDays = (int)(remainingUsefulLifeMonths * 30.44m);
            if (catchUpDays > maxDepDays) catchUpDays = maxDepDays;
            catchUpDep = Math.Round(depreciableAmount * 12m / remainingUsefulLifeMonths / 365m * catchUpDays, 2);
            if (catchUpDep > depreciableAmount) catchUpDep = depreciableAmount;
        }

        return (catchUpDays, catchUpDep);
    }

    private async Task<(int? entityId, string? error, decimal catchUpDep, int catchUpDays)> PostRevaluation(
        System.Data.Common.DbConnection conn, HttpClient client, BulkTransactionItem item)
    {
        var projected = await _txnService.GetEffectiveAssetValues(conn, item.AssetRegisterItemID, item.TransactionDate.AddSeconds(-1));
        var (catchUpDaysReval, catchUpDepReval) = await CalculateCatchUpForAsset(conn, item.AssetRegisterItemID, item.TransactionDate);
        decimal marketValue = item.MarketValue ?? 0m;
        decimal depAdj = item.DepAdjustment ?? 0m;
        decimal adjustedCarrying = Math.Max(0, projected.CarryingAmount - catchUpDepReval);
        decimal surplusAmount = marketValue - adjustedCarrying;

        var payload = new
        {
            assetRegisterID = item.AssetRegisterItemID,
            revaluation = 0,
            asset = 0,
            profit = 0,
            revalModel = item.ValuationModule ?? 1,
            revalautionAmt = marketValue,
            revalutionDate = item.TransactionDate.ToString("yyyy-MM-dd"),
            userID = 1,
            diffDepAcc = 0,
            diffBook = 0,
            projectDR = 0,
            projectItemDR = 0,
            projectCR = 0,
            projectItemCR = 0,
            surplusAmount,
            depreciationAdjustment = depAdj
        };

        var createResp = await client.PostAsJsonAsync("/api/asset-revaluations", payload);
        if (!createResp.IsSuccessStatusCode)
        {
            var body = await createResp.Content.ReadAsStringAsync();
            return (null, $"Create failed ({createResp.StatusCode}): {body}", 0m, 0);
        }

        var createResult = await createResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        int revalId = 0;
        if (createResult.TryGetProperty("asset_RevaluationsID", out var idEl))
            revalId = idEl.GetInt32();
        else if (createResult.TryGetProperty("Asset_RevaluationsID", out var idEl2))
            revalId = idEl2.GetInt32();

        if (revalId == 0)
            return (null, "Revaluation created but could not get ID", 0m, 0);

        var approveResp = await client.PostAsJsonAsync($"/api/asset-revaluations/{revalId}/approve", new { ApprovedBy = 1 });
        if (!approveResp.IsSuccessStatusCode)
        {
            var body = await approveResp.Content.ReadAsStringAsync();
            return (revalId, $"Created (ID={revalId}) but approval failed ({approveResp.StatusCode}): {body}", 0m, 0);
        }

        return (revalId, null, catchUpDepReval, catchUpDaysReval);
    }

    private async Task<(int? entityId, string? error, decimal catchUpDep, int catchUpDays)> PostImpairment(
        System.Data.Common.DbConnection conn, HttpClient client, BulkTransactionItem item, bool isReversal)
    {
        var projected = await _txnService.GetEffectiveAssetValues(conn, item.AssetRegisterItemID, item.TransactionDate.AddSeconds(-1));
        var (catchUpDaysImp, catchUpDepImp) = await CalculateCatchUpForAsset(conn, item.AssetRegisterItemID, item.TransactionDate);
        decimal recoverableAmount = item.RecoverableAmount ?? 0m;
        decimal valueInUse = item.ValueInUse ?? 0m;
        decimal basis = Math.Max(recoverableAmount, valueInUse);
        decimal carryingAmount = projected.CarryingAmount;
        decimal adjustedCarrying = Math.Max(0, carryingAmount - catchUpDepImp);
        decimal revalReserve = projected.RevaluationReserve;

        decimal totalAmount;
        decimal impairmentLoss;
        decimal amountFromRevalReserve;
        decimal newCarrying;
        string fy = _txnService.GetCurrentFinancialPeriod().year;

        if (isReversal)
        {
            totalAmount = basis - adjustedCarrying;
            if (totalAmount <= 0)
                return (null, $"Reversal amount must be positive (basis={basis}, carrying={adjustedCarrying})", 0m, 0);
            impairmentLoss = totalAmount;
            amountFromRevalReserve = 0;
            newCarrying = adjustedCarrying + totalAmount;
        }
        else
        {
            totalAmount = adjustedCarrying - basis;
            if (totalAmount <= 0)
                return (null, $"Impairment amount must be positive (post-catchup carrying={adjustedCarrying}, basis={basis})", 0m, 0);
            amountFromRevalReserve = Math.Min(totalAmount, revalReserve);
            impairmentLoss = Math.Max(0, totalAmount - revalReserve);
            newCarrying = Math.Max(0, adjustedCarrying - totalAmount);
        }

        var impPayload = new
        {
            assetRegisterItem_ID = item.AssetRegisterItemID,
            asset_ItemID = item.AssetRegisterItemID,
            impairmentDate = item.TransactionDate.ToString("yyyy-MM-dd"),
            impairmentAmount = totalAmount,
            previousCarryingAmount = carryingAmount,
            newCarryingAmount = newCarrying,
            remainingUsefulLife = 0,
            reason = item.Reason ?? (isReversal ? "Bulk impairment reversal" : "Bulk impairment"),
            status = "Pending",
            finYear = fy,
            catchUpDepreciation = catchUpDepImp,
            catchUpDays = catchUpDaysImp,
            isReversal = isReversal ? (short)1 : (short)0,
            capturerID = 1
        };

        var createResp = await client.PostAsJsonAsync("/api/asset-impairments", impPayload);
        if (!createResp.IsSuccessStatusCode)
        {
            var body = await createResp.Content.ReadAsStringAsync();
            return (null, $"Create failed ({createResp.StatusCode}): {body}", 0m, 0);
        }

        var createResult = await createResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        int impId = 0;
        if (createResult.TryGetProperty("assetImpairment_ID", out var idEl))
            impId = idEl.GetInt32();
        else if (createResult.TryGetProperty("AssetImpairment_ID", out var idEl2))
            impId = idEl2.GetInt32();

        if (impId == 0)
            return (null, "Impairment created but could not get ID", 0m, 0);

        var postingPayload = new
        {
            assetImpairment_ID = impId,
            impairment_ID = impId,
            impairmentLostAmt = impairmentLoss,
            fairValueAmt = basis,
            amountFromRevaluationReserve = amountFromRevalReserve,
            isReversal = isReversal ? (short)1 : (short)0
        };

        var postingResp = await client.PostAsJsonAsync("/api/asset-impairment-postings", postingPayload);
        if (!postingResp.IsSuccessStatusCode)
        {
            var body = await postingResp.Content.ReadAsStringAsync();
            return (impId, $"Created (ID={impId}) but posting failed ({postingResp.StatusCode}): {body}", 0m, 0);
        }

        string approveUrl = isReversal
            ? $"/api/asset-impairments/{impId}/approve-reversal"
            : $"/api/asset-impairments/{impId}/approve";

        var approveResp = await client.PostAsJsonAsync(approveUrl, new { ApprovedBy = 1 });
        if (!approveResp.IsSuccessStatusCode)
        {
            var body = await approveResp.Content.ReadAsStringAsync();
            return (impId, $"Created (ID={impId}) but approval failed ({approveResp.StatusCode}): {body}", 0m, 0);
        }

        return (impId, null, catchUpDepImp, catchUpDaysImp);
    }

    private async Task<(int? entityId, string? error, decimal catchUpDep, int catchUpDays)> PostDisposal(
        System.Data.Common.DbConnection conn, HttpClient client, BulkTransactionItem item)
    {
        string fy = _txnService.GetCurrentFinancialPeriod().year;

        var dispPayload = new
        {
            assetRegisterItem_ID = item.AssetRegisterItemID,
            disposalDate = item.TransactionDate.ToString("yyyy-MM-dd"),
            disposalMethod_ID = (int?)null,
            salePrice = item.DisposalProceeds ?? 0m,
            reason = item.Reason ?? item.DisposalMethod ?? "Bulk disposal",
            finYear = fy
        };

        var createResp = await client.PostAsJsonAsync("/api/disposals", dispPayload);
        if (!createResp.IsSuccessStatusCode)
        {
            var body = await createResp.Content.ReadAsStringAsync();
            return (null, $"Create failed ({createResp.StatusCode}): {body}", 0m, 0);
        }

        var createResult = await createResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        int dispId = 0;
        if (createResult.TryGetProperty("assetDisposal_ID", out var idEl))
            dispId = idEl.GetInt32();
        else if (createResult.TryGetProperty("AssetDisposal_ID", out var idEl2))
            dispId = idEl2.GetInt32();

        if (dispId == 0)
            return (null, "Disposal created but could not get ID", 0m, 0);

        var submitResp = await client.PostAsJsonAsync($"/api/disposals/{dispId}/submit-for-approval", new { });
        if (!submitResp.IsSuccessStatusCode)
        {
            var body = await submitResp.Content.ReadAsStringAsync();
            return (dispId, $"Created (ID={dispId}) but submit-for-approval failed ({submitResp.StatusCode}): {body}", 0m, 0);
        }

        var approveResp = await client.PostAsJsonAsync($"/api/disposals/{dispId}/approve", new { ApprovedBy = 1, Comments = "Bulk transaction approval" });
        if (!approveResp.IsSuccessStatusCode)
        {
            var body = await approveResp.Content.ReadAsStringAsync();
            return (dispId, $"Created (ID={dispId}) but approval failed ({approveResp.StatusCode}): {body}", 0m, 0);
        }

        return (dispId, null, 0m, 0);
    }

    private async Task<(int? entityId, string? error, decimal catchUpDep, int catchUpDays)> PostRefurbishment(HttpClient client, BulkTransactionItem item)
    {
        var createPayload = new
        {
            AssetRegisterID = item.AssetRegisterItemID,
            RefurbDate = item.TransactionDate.ToString("yyyy-MM-dd"),
            Refurb_DT = item.Refurb_DT ?? 0m,
            Refurb_CT = item.Refurb_CT ?? 0m,
            Refurb_Depreciation = item.Refurb_Depreciation,
            Refurb_Revaluation = item.Refurb_Revaluation,
            Refurb_Impairment = item.Refurb_Impairment,
            DebitPlanProjectItemId = item.DebitPlanProjectItemId,
            CreditPlanProjectItemId = item.CreditPlanProjectItemId
        };

        var createResp = await client.PostAsJsonAsync("/api/refurbishments", createPayload);
        if (!createResp.IsSuccessStatusCode)
        {
            var body = await createResp.Content.ReadAsStringAsync();
            return (null, $"Create failed ({(int)createResp.StatusCode}): {body}", 0m, 0);
        }

        var created = await createResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        int refurbId = created.GetProperty("asset_RefurbID").GetInt32();

        var approveResp = await client.PostAsJsonAsync($"/api/refurbishments/{refurbId}/approve", new { journalTypeId = 0 });
        if (!approveResp.IsSuccessStatusCode)
        {
            var body = await approveResp.Content.ReadAsStringAsync();
            return (refurbId, $"Approve failed ({(int)approveResp.StatusCode}): {body}", 0m, 0);
        }

        return (refurbId, null, 0m, 0);
    }

    private static bool TryGetDecimal(Dictionary<string, string> row, string key, out decimal value)
    {
        value = 0;
        if (!row.TryGetValue(key, out var str) || string.IsNullOrWhiteSpace(str)) return false;
        return decimal.TryParse(str, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out value);
    }
}
