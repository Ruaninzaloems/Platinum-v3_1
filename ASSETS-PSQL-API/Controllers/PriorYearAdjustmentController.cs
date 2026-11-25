using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data.Common;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/prior-year-adjustments")]
public class PriorYearAdjustmentController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly PriorYearCalculationService _calc;
    private readonly TransactionService _txnService;
    private readonly IWebHostEnvironment _env;
    private readonly LookupService _lookupService;
    private readonly InternalApiClient _internalApi;
    private readonly EmailService _emailService;
    private static readonly string[] AdjustmentTypes = new[]
    {
        "COST","VALUATION","DATE","RESIDUAL",
        "IMP_COST","IMP_REVAL","IMPREV_COST","IMPREV_REVAL",
        "DISP_COST","DISP_REVAL","DEEMED_COST"
    };

    public PriorYearAdjustmentController(
        DbConnectionFactory db,
        PriorYearCalculationService calc,
        TransactionService txnService,
        IWebHostEnvironment env,
        LookupService lookupService,
        InternalApiClient internalApi,
        EmailService emailService)
    {
        _db = db;
        _calc = calc;
        _txnService = txnService;
        _env = env;
        _lookupService = lookupService;
        _internalApi = internalApi;
        _emailService = emailService;
    }

    // GET /api/prior-year-adjustments/types
    [HttpGet("types")]
    public IActionResult GetTypes()
    {
        var types = new[]
        {
            new { code = "COST",       label = "Cost Adjustment",                     description = "Correct the historical cost of an actual cost asset" },
            new { code = "VALUATION",  label = "Valuation Adjustment",                description = "Restate the valuation of a revalued asset using the restatement method" },
            new { code = "DATE",       label = "Acquisition Date Correction",          description = "Correct the acquisition/in-service date and recalculate accumulated depreciation" },
            new { code = "RESIDUAL",   label = "Residual Value Adjustment",            description = "Change the residual value and recalculate accumulated depreciation" },
            new { code = "IMP_COST",   label = "Impairment (Actual Cost)",             description = "Recognise or adjust an impairment loss on an actual cost asset" },
            new { code = "IMP_REVAL",  label = "Impairment (Revalued Asset)",          description = "Recognise or adjust an impairment loss on a revalued asset (RR debited first)" },
            new { code = "IMPREV_COST",label = "Impairment Reversal (Actual Cost)",    description = "Reverse or adjust an impairment loss on an actual cost asset (GRAP-capped)" },
            new { code = "IMPREV_REVAL",label = "Impairment Reversal (Revalued Asset)", description = "Reverse or adjust an impairment on a revalued asset (GRAP-capped, credited to RR)" },
            new { code = "DISP_COST",  label = "Disposal (Actual Cost)",              description = "Record prior year disposal of an actual cost asset" },
            new { code = "DISP_REVAL", label = "Disposal (Revalued Asset)",           description = "Record prior year disposal of a revalued asset" },
            new { code = "DEEMED_COST",label = "Newly Identified Asset (Deemed Cost)", description = "Recognise a newly identified asset using deemed cost as the opening balance" }
        };
        return Ok(types);
    }

    // GET /api/prior-year-adjustments/search
    [HttpGet("search")]
    public async Task<IActionResult> SearchAssets(
        [FromQuery] int? assetRegisterItemId,
        [FromQuery] int? assetClassId,
        [FromQuery] int? assetTypeId,
        [FromQuery] int? assetCategoryId,
        [FromQuery] int? assetSubCategoryId,
        [FromQuery] string? description)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var sql = @"
            SELECT a.""AssetRegisterItem_ID"", a.""Description"",
                   COALESCE(a.""PurchaseAmount"", 0) AS ""PurchaseAmount"",
                   COALESCE(a.""AccumulatedDepreciationClosingBalance"", 0) AS ""AccumulatedDepreciationClosingBalance"",
                   COALESCE(a.""AccumulatedImpairmentClosingBalance"", 0) AS ""AccumulatedImpairmentClosingBalance"",
                   COALESCE(a.""CarryingAmountClosingBalance"", 0) AS ""CarryingAmountClosingBalance"",
                   COALESCE(a.""ResidualValue"", 0) AS ""ResidualValue"",
                   COALESCE(a.""RemainingUsefulLife"", 0) AS ""RemainingUsefulLife"",
                   COALESCE(a.""UsefulLifeYearComponent"", 0) AS ""UsefullLife"",
                   COALESCE(a.""RevaluationReserveClosingBalance"", 0) AS ""RevaluationReserveClosingBalance"",
                   COALESCE(a.""CurrentReplacementCostCRC"", 0) AS ""CurrentReplacementCostCRC"",
                   a.""InserviceDate"", a.""AcquisitionDate"",
                   a.""AssetType_ID"", a.""AssetCategory_ID"", a.""Asset_SubCategory_ID"", a.""MeasurementType_ID"",
                   at.""AssetTypeDesc"",
                   cat.""AssetCategoryDesc"",
                   sub.""Asset_SubCategoryDescription"",
                   mt.""Name"" AS ""MeasurementTypeDesc"",
                   fst.""FinancialStatusDesc""
            FROM ""Asset_Register_Items"" a
            LEFT JOIN ""Const_AssetType_Sys"" at ON a.""AssetType_ID"" = at.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON a.""AssetCategory_ID"" = cat.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sub ON a.""Asset_SubCategory_ID"" = sub.""Asset_SubCategory_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON a.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
            LEFT JOIN ""AssetConfig_FinancialStatus"" fst ON a.""Financial_Status_ID"" = fst.""FinStatusID""
            WHERE 1=1";

        var prms = new DynamicParameters();

        if (assetRegisterItemId.HasValue)
        {
            sql += @" AND a.""AssetRegisterItem_ID"" = @assetRegisterItemId";
            prms.Add("assetRegisterItemId", assetRegisterItemId.Value);
        }
        if (!string.IsNullOrEmpty(description))
        {
            sql += @" AND LOWER(a.""Description"") LIKE LOWER(@desc)";
            prms.Add("desc", $"%{description}%");
        }
        if (assetTypeId.HasValue)
        {
            sql += @" AND a.""AssetType_ID"" = @assetTypeId";
            prms.Add("assetTypeId", assetTypeId.Value);
        }
        if (assetCategoryId.HasValue)
        {
            sql += @" AND a.""AssetCategory_ID"" = @assetCategoryId";
            prms.Add("assetCategoryId", assetCategoryId.Value);
        }
        if (assetSubCategoryId.HasValue)
        {
            sql += @" AND a.""Asset_SubCategory_ID"" = @assetSubCategoryId";
            prms.Add("assetSubCategoryId", assetSubCategoryId.Value);
        }
        if (assetClassId.HasValue)
        {
            sql += @" AND a.""AssetClass_ID"" = @assetClassId";
            prms.Add("assetClassId", assetClassId.Value);
        }

        sql += @" ORDER BY a.""AssetRegisterItem_ID"" LIMIT 100";

        var items = await conn.QueryAsync<AssetDetailsForPriorYear>(sql, prms);
        return Ok(items);
    }

    // POST /api/prior-year-adjustments/calculate
    [HttpPost("calculate")]
    public async Task<IActionResult> Calculate([FromBody] PriorYearCalculateRequest req)
    {
        if (req.AssetRegisterItemId <= 0)
            return BadRequest(new { error = "AssetRegisterItemId is required" });
        if (string.IsNullOrEmpty(req.AdjustmentTypeCode) || !AdjustmentTypes.Contains(req.AdjustmentTypeCode))
            return BadRequest(new { error = $"Invalid AdjustmentTypeCode. Must be one of: {string.Join(", ", AdjustmentTypes)}" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var asset = await LoadAssetDetails(conn, req.AssetRegisterItemId);
        if (asset == null)
            return NotFound(new { error = "Asset not found" });

        var result = _calc.Calculate(req, asset);
        return Ok(result);
    }

    // POST /api/prior-year-adjustments/submit
    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] PriorYearSubmitRequest req)
    {
        if (req.AssetRegisterItemId <= 0)
            return BadRequest(new { error = "AssetRegisterItemId is required" });
        if (string.IsNullOrEmpty(req.AdjustmentTypeCode))
            return BadRequest(new { error = "AdjustmentTypeCode is required" });
        if (!AdjustmentTypes.Contains(req.AdjustmentTypeCode))
            return BadRequest(new { error = $"Invalid AdjustmentTypeCode. Must be one of: {string.Join(", ", AdjustmentTypes)}" });
        if (req.AdjustmentTypeCode == "DATE" && (!req.DrPlanProjectItemID.HasValue || !req.CrPlanProjectItemID.HasValue))
            return BadRequest(new { error = "DATE adjustments require both Dr (debit) and Cr (credit) GL leg project items" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var asset = await LoadAssetDetails(conn, req.AssetRegisterItemId);
        if (asset == null)
            return NotFound(new { error = "Asset not found" });

        // Always recompute server-side — never trust client-supplied calculation deltas
        var calcReq = new PriorYearCalculateRequest
        {
            AdjustmentTypeCode = req.AdjustmentTypeCode,
            AssetRegisterItemId = req.AssetRegisterItemId,
            EffectiveDate = req.EffectiveDate,
            FinYear = req.FinYear,
            NewCostAmount = req.NewCostAmount,
            NewValuationAmount = req.NewValuationAmount,
            NewRUL = req.NewRUL,
            NewAcquisitionDate = req.NewAcquisitionDate,
            NewResidualValue = req.NewResidualValue,
            ResidualValueEffectiveDate = req.ResidualValueEffectiveDate,
            NewImpairmentAmount = req.NewImpairmentAmount,
            ImpairmentEffectiveDate = req.ImpairmentEffectiveDate,
            DisposalDate = req.DisposalDate,
            DisposalReason = req.DisposalReason,
            DisposalProceeds = req.DisposalProceeds
        };
        var calc = _calc.Calculate(calcReq, asset);
        var (finYear, _) = _txnService.GetFinancialPeriodForDate(req.EffectiveDate ?? DateTime.Today);

        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_PriorYearAdjustment"" (
                ""AssetRegisterItem_ID"", ""AdjustmentTypeCode"", ""Status"", ""EffectiveDate"", ""FinYear"",
                ""NewCostAmount"", ""NewValuationAmount"", ""NewRUL"", ""NewAcquisitionDate"",
                ""NewResidualValue"", ""ResidualValueEffectiveDate"",
                ""NewImpairmentAmount"", ""ImpairmentEffectiveDate"",
                ""DisposalDate"", ""DisposalReason"", ""DisposalProceeds"",
                ""SnapshotCost"", ""SnapshotAccDep"", ""SnapshotAccImp"",
                ""SnapshotCarryingAmount"", ""SnapshotResidualValue"", ""SnapshotRUL"", ""SnapshotRR"", ""SnapshotEUL"",
                ""CurrentPeriod_CostDelta"", ""CurrentPeriod_AccDepDelta"", ""CurrentPeriod_AccImpDelta"",
                ""CurrentPeriod_RRDelta"", ""CurrentPeriod_DepChargeDelta"",
                ""ComparativePeriod_CostDelta"", ""ComparativePeriod_AccDepDelta"", ""ComparativePeriod_AccImpDelta"",
                ""ComparativePeriod_RRDelta"", ""ComparativePeriod_DepChargeDelta"",
                ""PriorPeriods_CostDelta"", ""PriorPeriods_AccDepDelta"", ""PriorPeriods_AccImpDelta"",
                ""PriorPeriods_RRDelta"", ""PriorPeriods_DepChargeDelta"",
                ""HasResidualValueWarning"", ""HasImpairmentWarning"",
                ""DrPlanProjectItemID"", ""CrPlanProjectItemID"", ""Comments"",
                ""DateCaptured"", ""CapturerID""
            ) VALUES (
                @AssetRegisterItemId, @AdjustmentTypeCode, 'Pending', @EffectiveDate, @FinYear,
                @NewCostAmount, @NewValuationAmount, @NewRUL, @NewAcquisitionDate,
                @NewResidualValue, @ResidualValueEffectiveDate,
                @NewImpairmentAmount, @ImpairmentEffectiveDate,
                @DisposalDate, @DisposalReason, @DisposalProceeds,
                @SnapshotCost, @SnapshotAccDep, @SnapshotAccImp,
                @SnapshotCA, @SnapshotResidual, @SnapshotRUL, @SnapshotRR, @SnapshotEUL,
                @CP_Cost, @CP_AccDep, @CP_AccImp, @CP_RR, @CP_Dep,
                @Comp_Cost, @Comp_AccDep, @Comp_AccImp, @Comp_RR, @Comp_Dep,
                @PP_Cost, @PP_AccDep, @PP_AccImp, @PP_RR, @PP_Dep,
                @HasResVal, @HasImp,
                @DrPPI, @CrPPI, @Comments,
                NOW(), 1
            ) RETURNING ""PriorYearAdjustment_ID""",
            new
            {
                req.AssetRegisterItemId, req.AdjustmentTypeCode, req.EffectiveDate, FinYear = finYear,
                req.NewCostAmount, req.NewValuationAmount, req.NewRUL, req.NewAcquisitionDate,
                req.NewResidualValue, req.ResidualValueEffectiveDate,
                req.NewImpairmentAmount, req.ImpairmentEffectiveDate,
                req.DisposalDate, req.DisposalReason, req.DisposalProceeds,
                SnapshotCost = asset.PurchaseAmount, SnapshotAccDep = asset.AccumulatedDepreciationClosingBalance,
                SnapshotAccImp = asset.AccumulatedImpairmentClosingBalance, SnapshotCA = asset.CarryingAmountClosingBalance,
                SnapshotResidual = asset.ResidualValue, SnapshotRUL = asset.RemainingUsefulLife,
                SnapshotRR = asset.RevaluationReserveClosingBalance, SnapshotEUL = asset.UsefullLife,
                CP_Cost = calc.CurrentPeriod_CostDelta, CP_AccDep = calc.CurrentPeriod_AccDepDelta,
                CP_AccImp = calc.CurrentPeriod_AccImpDelta, CP_RR = calc.CurrentPeriod_RRDelta, CP_Dep = calc.CurrentPeriod_DepChargeDelta,
                Comp_Cost = calc.ComparativePeriod_CostDelta, Comp_AccDep = calc.ComparativePeriod_AccDepDelta,
                Comp_AccImp = calc.ComparativePeriod_AccImpDelta, Comp_RR = calc.ComparativePeriod_RRDelta, Comp_Dep = calc.ComparativePeriod_DepChargeDelta,
                PP_Cost = calc.PriorPeriods_CostDelta, PP_AccDep = calc.PriorPeriods_AccDepDelta,
                PP_AccImp = calc.PriorPeriods_AccImpDelta, PP_RR = calc.PriorPeriods_RRDelta, PP_Dep = calc.PriorPeriods_DepChargeDelta,
                HasResVal = calc.HasResidualValueWarning, HasImp = calc.HasImpairmentWarning,
                DrPPI = req.DrPlanProjectItemID, CrPPI = req.CrPlanProjectItemID, req.Comments
            });

        return Ok(new { id, success = true });
    }

    // GET /api/prior-year-adjustments/pending
    [HttpGet("pending")]
    public async Task<IActionResult> GetPending([FromQuery] string? adjustmentTypeCode, [FromQuery] string? status)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var sql = @"
            SELECT p.*, a.""Description"" AS ""AssetDescription"",
                   COALESCE(a.""PurchaseAmount"", 0) AS ""AssetCost"",
                   COALESCE(a.""CarryingAmountClosingBalance"", 0) AS ""AssetCarryingAmount""
            FROM ""Asset_PriorYearAdjustment"" p
            LEFT JOIN ""Asset_Register_Items"" a ON p.""AssetRegisterItem_ID"" = a.""AssetRegisterItem_ID""
            WHERE 1=1";

        var prms = new DynamicParameters();
        if (!string.IsNullOrEmpty(adjustmentTypeCode))
        {
            sql += @" AND p.""AdjustmentTypeCode"" = @adjustmentTypeCode";
            prms.Add("adjustmentTypeCode", adjustmentTypeCode);
        }
        if (!string.IsNullOrEmpty(status))
        {
            sql += @" AND p.""Status"" = @status";
            prms.Add("status", status);
        }
        else
        {
            sql += @" AND p.""Status"" = 'Pending'";
        }

        sql += @" ORDER BY p.""PriorYearAdjustment_ID"" DESC";

        var items = await conn.QueryAsync<PriorYearAdjustment>(sql, prms);
        return Ok(items);
    }

    // GET /api/prior-year-adjustments
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? adjustmentTypeCode, [FromQuery] string? status)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var sql = @"
            SELECT p.*, a.""Description"" AS ""AssetDescription""
            FROM ""Asset_PriorYearAdjustment"" p
            LEFT JOIN ""Asset_Register_Items"" a ON p.""AssetRegisterItem_ID"" = a.""AssetRegisterItem_ID""
            WHERE 1=1";

        var prms = new DynamicParameters();
        if (!string.IsNullOrEmpty(adjustmentTypeCode))
        {
            sql += @" AND p.""AdjustmentTypeCode"" = @adjustmentTypeCode";
            prms.Add("adjustmentTypeCode", adjustmentTypeCode);
        }
        if (!string.IsNullOrEmpty(status))
        {
            sql += @" AND p.""Status"" = @status";
            prms.Add("status", status);
        }

        sql += @" ORDER BY p.""PriorYearAdjustment_ID"" DESC";

        var items = await conn.QueryAsync<PriorYearAdjustment>(sql, prms);
        return Ok(items);
    }

    // GET /api/prior-year-adjustments/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var record = await conn.QueryFirstOrDefaultAsync<PriorYearAdjustment>(@"
            SELECT p.*, a.""Description"" AS ""AssetDescription"",
                   COALESCE(a.""PurchaseAmount"", 0) AS ""AssetCost"",
                   COALESCE(a.""AccumulatedDepreciationClosingBalance"", 0) AS ""AssetAccDep"",
                   COALESCE(a.""AccumulatedImpairmentClosingBalance"", 0) AS ""AssetAccImp"",
                   COALESCE(a.""CarryingAmountClosingBalance"", 0) AS ""AssetCarryingAmount"",
                   COALESCE(a.""RevaluationReserveClosingBalance"", 0) AS ""AssetRR"",
                   COALESCE(a.""RemainingUsefulLife"", 0) AS ""AssetRUL"",
                   COALESCE(a.""ResidualValue"", 0) AS ""AssetResidualValue"",
                   at2.""AssetTypeDesc"", cat.""AssetCategoryDesc"",
                   sub.""Asset_SubCategoryDescription"", mt.""Name"" AS ""MeasurementTypeDesc""
            FROM ""Asset_PriorYearAdjustment"" p
            LEFT JOIN ""Asset_Register_Items"" a ON p.""AssetRegisterItem_ID"" = a.""AssetRegisterItem_ID""
            LEFT JOIN ""Const_AssetType_Sys"" at2 ON a.""AssetType_ID"" = at2.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON a.""AssetCategory_ID"" = cat.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sub ON a.""Asset_SubCategory_ID"" = sub.""Asset_SubCategory_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON a.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
            WHERE p.""PriorYearAdjustment_ID"" = @id", new { id });

        if (record == null) return NotFound(new { error = "Prior year adjustment not found" });

        var docs = await conn.QueryAsync<PriorYearAdjustmentDocument>(
            @"SELECT * FROM ""Asset_PriorYearAdjustment_Documents"" WHERE ""PriorYearAdjustment_ID"" = @id ORDER BY ""Document_ID""",
            new { id });

        return Ok(new { record, documents = docs });
    }

    // POST /api/prior-year-adjustments/{id}/approve
    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] PriorYearApproveRequest? req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            var record = await conn.QueryFirstOrDefaultAsync<PriorYearAdjustment>(@"
                SELECT * FROM ""Asset_PriorYearAdjustment"" WHERE ""PriorYearAdjustment_ID"" = @id",
                new { id }, txn);

            if (record == null)
            {
                await txn.RollbackAsync();
                return NotFound(new { error = "Record not found" });
            }
            if (record.Status != "Pending")
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = $"Cannot approve a record with status '{record.Status}'" });
            }

            if (record.AdjustmentTypeCode == "DATE" && (!record.DrPlanProjectItemID.HasValue || !record.CrPlanProjectItemID.HasValue))
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = "DATE adjustments require both Dr and Cr GL leg project items before approval" });
            }

            int assetId = record.AssetRegisterItem_ID ?? 0;
            string typeCode = record.AdjustmentTypeCode ?? "";
            string finYear = record.FinYear ?? _txnService.GetCurrentFinancialPeriod().year;
            var (fy, fyPeriod) = _txnService.GetFinancialPeriodForDate(record.EffectiveDate ?? DateTime.Today);

            await ApplyAssetRegisterUpdate(conn, txn, record, assetId, typeCode);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_PriorYearAdjustment""
                SET ""Status"" = 'Approved', ""ApprovedBy"" = 1, ""ApprovedDate"" = NOW(),
                    ""Comments"" = COALESCE(@comments, ""Comments""), ""DateModified"" = NOW()
                WHERE ""PriorYearAdjustment_ID"" = @id",
                new { id, comments = req?.Comments }, txn);

            Guid? pyaGlOutboxId = null;
            if (record.DrPlanProjectItemID.HasValue && record.CrPlanProjectItemID.HasValue)
            {
                pyaGlOutboxId = await PostGlEntries(conn, txn, record, finYear, fyPeriod, assetId);
            }

            await _txnService.PopulateTransactionSummarySingle(conn, txn, assetId, finYear, fyPeriod);

            await txn.CommitAsync();

            if (pyaGlOutboxId.HasValue)
                await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(pyaGlOutboxId.Value);

            decimal pyaAmount = 0m;
            try
            {
                var pyaSnap = await conn.QueryFirstOrDefaultAsync<dynamic>(
                    @"SELECT COALESCE(""NewCostAmount"", COALESCE(""NewValuationAmount"", COALESCE(""NewImpairmentAmount"", 0))) AS ""Amt""
                      FROM ""Asset_PriorYearAdjustment"" WHERE ""PriorYearAdjustment_ID"" = @id", new { id });
                if (pyaSnap != null) pyaAmount = Math.Abs((decimal)(pyaSnap.Amt ?? 0m));
            }
            catch { }
            var pyaTokens = await _emailService.BuildAssetBaseTokensAsync(conn, assetId);
            pyaTokens["AdjustmentType"]   = typeCode;
            pyaTokens["AdjustmentAmount"] = pyaAmount.ToString("N2");
            pyaTokens["FinancialYear"]    = finYear;
            _ = _emailService.SendTransactionEmailsAsync("Prior Year Adjustment", pyaTokens);
            return Ok(new { success = true, message = "Prior year adjustment approved successfully" });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // POST /api/prior-year-adjustments/{id}/reject
    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] PriorYearRejectRequest req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var updated = await conn.ExecuteAsync(@"
            UPDATE ""Asset_PriorYearAdjustment""
            SET ""Status"" = 'Rejected', ""RejectionReason"" = @reason, ""RejectedBy"" = 1,
                ""RejectedDate"" = NOW(), ""DateModified"" = NOW()
            WHERE ""PriorYearAdjustment_ID"" = @id AND ""Status"" = 'Pending'",
            new { id, reason = req?.RejectionReason });

        if (updated == 0)
            return BadRequest(new { error = "Record not found or not in Pending status" });

        return Ok(new { success = true });
    }

    // POST /api/prior-year-adjustments/{id}/documents
    [HttpPost("{id:int}/documents")]
    public async Task<IActionResult> UploadDocument(int id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var exists = await conn.ExecuteScalarAsync<int>(
            @"SELECT COUNT(*) FROM ""Asset_PriorYearAdjustment"" WHERE ""PriorYearAdjustment_ID"" = @id",
            new { id });
        if (exists == 0)
            return NotFound(new { error = "Adjustment record not found" });

        var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads", "prior-year");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName);
        var storedName = $"pya_{id}_{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, storedName);

        await using (var stream = System.IO.File.Create(filePath))
            await file.CopyToAsync(stream);

        var docId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_PriorYearAdjustment_Documents""
                (""PriorYearAdjustment_ID"", ""FileName"", ""StoredFileName"", ""FileSizeBytes"", ""ContentType"", ""UploadedDate"", ""UploadedBy"")
            VALUES (@id, @fileName, @storedName, @size, @ct, NOW(), 1)
            RETURNING ""Document_ID""",
            new { id, fileName = file.FileName, storedName, size = (int)file.Length, ct = file.ContentType });

        return Ok(new { docId, fileName = file.FileName, success = true });
    }

    // GET /api/prior-year-adjustments/{id}/documents
    [HttpGet("{id:int}/documents")]
    public async Task<IActionResult> GetDocuments(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var docs = await conn.QueryAsync<PriorYearAdjustmentDocument>(
            @"SELECT * FROM ""Asset_PriorYearAdjustment_Documents"" WHERE ""PriorYearAdjustment_ID"" = @id ORDER BY ""Document_ID""",
            new { id });

        return Ok(docs);
    }

    // GET /api/prior-year-adjustments/{id}/documents/{docId}/download
    [HttpGet("{id:int}/documents/{docId:int}/download")]
    public async Task<IActionResult> DownloadDocument(int id, int docId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var doc = await conn.QueryFirstOrDefaultAsync<PriorYearAdjustmentDocument>(
            @"SELECT * FROM ""Asset_PriorYearAdjustment_Documents""
              WHERE ""Document_ID"" = @docId AND ""PriorYearAdjustment_ID"" = @id",
            new { docId, id });

        if (doc == null) return NotFound(new { error = "Document not found" });

        var filePath = Path.Combine(_env.ContentRootPath, "uploads", "prior-year", doc.StoredFileName!);
        if (!System.IO.File.Exists(filePath))
            return NotFound(new { error = "File not found on server" });

        var bytes = await System.IO.File.ReadAllBytesAsync(filePath);
        return File(bytes, doc.ContentType ?? "application/octet-stream", doc.FileName);
    }

    // GET /api/prior-year-adjustments/{id}/transactions/export
    [HttpGet("{id:int}/transactions/export")]
    public async Task<IActionResult> ExportTransactions(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var record = await conn.QueryFirstOrDefaultAsync<PriorYearAdjustment>(
            @"SELECT * FROM ""Asset_PriorYearAdjustment"" WHERE ""PriorYearAdjustment_ID"" = @id",
            new { id });

        if (record == null) return NotFound(new { error = "Record not found" });

        var asset = await LoadAssetDetails(conn, record.AssetRegisterItem_ID ?? 0);
        var req = MapToCalculateRequest(record);
        var result = asset != null ? _calc.Calculate(req, asset) : new PriorYearCalculationResult();

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Journal Lines");

        ws.Cell("A1").Value = "Prior Year Adjustment — Journal Lines";
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 14;

        ws.Cell("A2").Value = $"Adjustment Type: {record.AdjustmentTypeCode}";
        ws.Cell("A3").Value = $"Asset ID: {record.AssetRegisterItem_ID}";
        ws.Cell("A4").Value = $"Effective Date: {record.EffectiveDate:dd MMM yyyy}";
        ws.Cell("A5").Value = $"Financial Year: {record.FinYear}";
        ws.Cell("A6").Value = $"Status: {record.Status}";

        int row = 8;
        string[] headers = { "Period", "Description", "Account", "Debit (R)", "Credit (R)" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(row, i + 1).Value = headers[i];
            ws.Cell(row, i + 1).Style.Font.Bold = true;
            ws.Cell(row, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#1E3A5F");
            ws.Cell(row, i + 1).Style.Font.FontColor = XLColor.White;
        }
        row++;

        foreach (var line in result.JournalLines)
        {
            ws.Cell(row, 1).Value = line.Period;
            ws.Cell(row, 2).Value = line.Description;
            ws.Cell(row, 3).Value = line.Account;
            if (line.Debit.HasValue) ws.Cell(row, 4).Value = line.Debit.Value;
            if (line.Credit.HasValue) ws.Cell(row, 5).Value = line.Credit.Value;
            row++;
        }

        row++;
        ws.Cell(row, 1).Value = "Period Split Summary";
        ws.Cell(row, 1).Style.Font.Bold = true;
        row++;
        string[] sumHeaders = { "Period", "Cost Δ", "Acc Dep Δ", "Acc Imp Δ", "RR Δ", "Dep Charge Δ" };
        for (int i = 0; i < sumHeaders.Length; i++)
        {
            ws.Cell(row, i + 1).Value = sumHeaders[i];
            ws.Cell(row, i + 1).Style.Font.Bold = true;
            ws.Cell(row, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#1E3A5F");
            ws.Cell(row, i + 1).Style.Font.FontColor = XLColor.White;
        }
        row++;
        AddSummaryRow(ws, row++, "Prior Periods", record.PriorPeriods_CostDelta, record.PriorPeriods_AccDepDelta, record.PriorPeriods_AccImpDelta, record.PriorPeriods_RRDelta, record.PriorPeriods_DepChargeDelta);
        AddSummaryRow(ws, row++, "Comparative Period", record.ComparativePeriod_CostDelta, record.ComparativePeriod_AccDepDelta, record.ComparativePeriod_AccImpDelta, record.ComparativePeriod_RRDelta, record.ComparativePeriod_DepChargeDelta);
        AddSummaryRow(ws, row, "Current Period", record.CurrentPeriod_CostDelta, record.CurrentPeriod_AccDepDelta, record.CurrentPeriod_AccImpDelta, record.CurrentPeriod_RRDelta, record.CurrentPeriod_DepChargeDelta);

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        wb.SaveAs(stream);
        stream.Position = 0;

        return File(stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"PYA_{record.AdjustmentTypeCode}_{id}_{DateTime.Today:yyyyMMdd}.xlsx");
    }

    private static void AddSummaryRow(IXLWorksheet ws, int row, string label, decimal? cost, decimal? accDep, decimal? accImp, decimal? rr, decimal? dep)
    {
        ws.Cell(row, 1).Value = label;
        if (cost.HasValue && cost != 0) ws.Cell(row, 2).Value = cost.Value;
        if (accDep.HasValue && accDep != 0) ws.Cell(row, 3).Value = accDep.Value;
        if (accImp.HasValue && accImp != 0) ws.Cell(row, 4).Value = accImp.Value;
        if (rr.HasValue && rr != 0) ws.Cell(row, 5).Value = rr.Value;
        if (dep.HasValue && dep != 0) ws.Cell(row, 6).Value = dep.Value;
    }

    private async Task ApplyAssetRegisterUpdate(DbConnection conn, DbTransaction txn, PriorYearAdjustment record, int assetId, string typeCode)
    {
        switch (typeCode)
        {
            case "COST":
                if (record.NewCostAmount.HasValue)
                {
                    // CurrentPeriod_AccDepDelta is the cumulative acc dep delta across all periods
                    decimal costAccDepDelta = record.CurrentPeriod_AccDepDelta ?? 0m;
                    await conn.ExecuteAsync(@"
                        UPDATE ""Asset_Register_Items""
                        SET ""PurchaseAmount"" = @newCost,
                            ""AccumulatedDepreciationClosingBalance"" = COALESCE(""AccumulatedDepreciationClosingBalance"", 0) - @accDepDelta,
                            ""CarryingAmountClosingBalance"" = @newCost
                                - ABS(COALESCE(""AccumulatedDepreciationClosingBalance"", 0) - @accDepDelta)
                                - ABS(COALESCE(""AccumulatedImpairmentClosingBalance"", 0)),
                            ""DateModified"" = NOW()
                        WHERE ""AssetRegisterItem_ID"" = @assetId",
                        new { newCost = record.NewCostAmount.Value, accDepDelta = costAccDepDelta, assetId }, txn);
                }
                break;

            case "VALUATION":
                if (record.NewValuationAmount.HasValue && record.SnapshotEUL.HasValue && record.NewRUL.HasValue)
                {
                    decimal eul = record.SnapshotEUL.Value > 0 ? record.SnapshotEUL.Value : record.SnapshotRUL ?? 1m;
                    decimal newCost = eul > 0 ? Math.Round(record.NewValuationAmount.Value / record.NewRUL.Value * eul, 2) : record.NewValuationAmount.Value;
                    decimal newAccDep = newCost - record.NewValuationAmount.Value;
                    decimal rrDelta = record.PriorPeriods_RRDelta ?? 0m;
                    decimal newRR = (record.SnapshotRR ?? 0m) + rrDelta;

                    await conn.ExecuteAsync(@"
                        UPDATE ""Asset_Register_Items""
                        SET ""CurrentReplacementCostCRC"" = @newCost,
                            ""AccumulatedDepreciationClosingBalance"" = @newAccDep,
                            ""RemainingUsefulLife"" = @newRUL,
                            ""RevaluationReserveClosingBalance"" = @newRR,
                            ""CarryingAmountClosingBalance"" = @newCV,
                            ""DateModified"" = NOW()
                        WHERE ""AssetRegisterItem_ID"" = @assetId",
                        new { newCost, newAccDep, newRUL = record.NewRUL.Value, newRR, newCV = record.NewValuationAmount.Value, assetId }, txn);
                }
                break;

            case "DATE":
                if (record.NewAcquisitionDate.HasValue)
                {
                    // CurrentPeriod_AccDepDelta is the cumulative acc dep delta from date correction
                    decimal dateAccDepDelta = record.CurrentPeriod_AccDepDelta ?? 0m;
                    await conn.ExecuteAsync(@"
                        UPDATE ""Asset_Register_Items""
                        SET ""InserviceDate"" = @newDate, ""AcquisitionDate"" = @newDate,
                            ""CommisioningDate"" = @newDate,
                            ""AccumulatedDepreciationClosingBalance"" = COALESCE(""AccumulatedDepreciationClosingBalance"", 0) + @accDepDelta,
                            ""CarryingAmountClosingBalance"" = ""PurchaseAmount""
                                - ABS(COALESCE(""AccumulatedDepreciationClosingBalance"", 0) + @accDepDelta)
                                - ABS(COALESCE(""AccumulatedImpairmentClosingBalance"", 0)),
                            ""DateModified"" = NOW()
                        WHERE ""AssetRegisterItem_ID"" = @assetId",
                        new { newDate = record.NewAcquisitionDate.Value, accDepDelta = dateAccDepDelta, assetId }, txn);
                }
                break;

            case "RESIDUAL":
                if (record.NewResidualValue.HasValue)
                {
                    decimal residualAccDepDelta = record.CurrentPeriod_AccDepDelta ?? 0m;
                    await conn.ExecuteAsync(@"
                        UPDATE ""Asset_Register_Items""
                        SET ""ResidualValue"" = @newResidual,
                            ""AccumulatedDepreciationClosingBalance"" = COALESCE(""AccumulatedDepreciationClosingBalance"", 0) + @accDepDelta,
                            ""CarryingAmountClosingBalance"" = ""PurchaseAmount""
                                - ABS(COALESCE(""AccumulatedDepreciationClosingBalance"", 0) + @accDepDelta)
                                - ABS(COALESCE(""AccumulatedImpairmentClosingBalance"", 0)),
                            ""DateModified"" = NOW()
                        WHERE ""AssetRegisterItem_ID"" = @assetId",
                        new { newResidual = record.NewResidualValue.Value, accDepDelta = residualAccDepDelta, assetId }, txn);
                }
                break;

            case "IMP_COST":
            case "IMP_REVAL":
                if (record.NewImpairmentAmount.HasValue)
                {
                    decimal newImp = record.NewImpairmentAmount.Value;
                    await conn.ExecuteAsync(@"
                        UPDATE ""Asset_Register_Items""
                        SET ""AccumulatedImpairmentClosingBalance"" = @newImp,
                            ""ImpairmentAmountCurrentYear"" = @newImp,
                            ""CarryingAmountClosingBalance"" = GREATEST(0, ""CarryingAmountClosingBalance"" - (@newImp - ABS(COALESCE(""AccumulatedImpairmentClosingBalance"", 0)))),
                            ""DateModified"" = NOW()
                        WHERE ""AssetRegisterItem_ID"" = @assetId",
                        new { newImp, assetId }, txn);
                    if (typeCode == "IMP_REVAL" && record.PriorPeriods_RRDelta.HasValue)
                    {
                        await conn.ExecuteAsync(@"
                            UPDATE ""Asset_Register_Items""
                            SET ""RevaluationReserveClosingBalance"" = GREATEST(0, COALESCE(""RevaluationReserveClosingBalance"", 0) + @delta)
                            WHERE ""AssetRegisterItem_ID"" = @assetId",
                            new { delta = record.PriorPeriods_RRDelta.Value, assetId }, txn);
                    }
                }
                break;

            case "IMPREV_COST":
            case "IMPREV_REVAL":
                if (record.PriorPeriods_AccImpDelta.HasValue)
                {
                    decimal impDelta = record.PriorPeriods_AccImpDelta.Value;
                    await conn.ExecuteAsync(@"
                        UPDATE ""Asset_Register_Items""
                        SET ""AccumulatedImpairmentClosingBalance"" = GREATEST(0, ABS(COALESCE(""AccumulatedImpairmentClosingBalance"", 0)) + @impDelta),
                            ""CarryingAmountClosingBalance"" = COALESCE(""CarryingAmountClosingBalance"", 0) - @impDelta,
                            ""DateModified"" = NOW()
                        WHERE ""AssetRegisterItem_ID"" = @assetId",
                        new { impDelta, assetId }, txn);
                    if (typeCode == "IMPREV_REVAL" && record.PriorPeriods_RRDelta.HasValue)
                    {
                        await conn.ExecuteAsync(@"
                            UPDATE ""Asset_Register_Items""
                            SET ""RevaluationReserveClosingBalance"" = COALESCE(""RevaluationReserveClosingBalance"", 0) + @delta
                            WHERE ""AssetRegisterItem_ID"" = @assetId",
                            new { delta = record.PriorPeriods_RRDelta.Value, assetId }, txn);
                    }
                }
                break;

            case "DISP_COST":
            case "DISP_REVAL":
                await conn.ExecuteAsync(@"
                    UPDATE ""Asset_Register_Items""
                    SET ""PurchaseAmount"" = 0,
                        ""CurrentReplacementCostCRC"" = 0,
                        ""AccumulatedDepreciationClosingBalance"" = 0,
                        ""AccumulatedImpairmentClosingBalance"" = 0,
                        ""CarryingAmountClosingBalance"" = 0,
                        ""RevaluationReserveClosingBalance"" = CASE WHEN @isReval THEN 0 ELSE ""RevaluationReserveClosingBalance"" END,
                        ""DateOfDisposal"" = @disposalDate,
                        ""DateModified"" = NOW()
                    WHERE ""AssetRegisterItem_ID"" = @assetId",
                    new { isReval = typeCode == "DISP_REVAL", disposalDate = record.DisposalDate ?? record.EffectiveDate, assetId }, txn);
                break;

            case "DEEMED_COST":
                // Recognise a newly identified asset using deemed cost as its opening balance.
                // Set cost = deemed cost, carrying amount = deemed cost (no prior acc dep),
                // and update in-service / acquisition dates if provided.
                if (record.NewCostAmount.HasValue)
                {
                    await conn.ExecuteAsync(@"
                        UPDATE ""Asset_Register_Items""
                        SET ""PurchaseAmount"" = @deemedCost,
                            ""CarryingAmountClosingBalance"" = @deemedCost,
                            ""AccumulatedDepreciationClosingBalance"" = 0,
                            ""AccumulatedImpairmentClosingBalance"" = 0,
                            ""InserviceDate"" = COALESCE(@effectiveDate, ""InserviceDate""),
                            ""AcquisitionDate"" = COALESCE(@effectiveDate, ""AcquisitionDate""),
                            ""CommisioningDate"" = COALESCE(@effectiveDate, ""CommisioningDate""),
                            ""DateModified"" = NOW()
                        WHERE ""AssetRegisterItem_ID"" = @assetId",
                        new { deemedCost = record.NewCostAmount.Value, effectiveDate = record.EffectiveDate, assetId }, txn);
                }
                break;
        }
    }

    private async Task<Guid?> PostGlEntries(DbConnection conn, DbTransaction txn, PriorYearAdjustment record, string finYear, int finPeriod, int assetId)
    {
        int journalTransactionTypeId = 36;
        string documentNumber = $"PYA-{finYear}-{record.PriorYearAdjustment_ID}";
        int documentTypeId = await _lookupService.GetDocumentTypeIdAsync(conn, "Prior Year Adjustment", txn);
        if (documentTypeId == 0) documentTypeId = journalTransactionTypeId;
        var transactionId = Guid.NewGuid();
        int processingMonth = await _txnService.GetProcessingMonth(conn, 1, txn);
        DateTime postingDate = record.EffectiveDate ?? DateTime.Today;

        // GL posting amount: single authoritative basis per adjustment type (no double-counting)
        decimal totalAmount = GetGlAmount(record);

        // Nothing to post
        if (totalAmount == 0m) return null;

        var drItem = record.DrPlanProjectItemID != null
            ? await _internalApi.GetPpiVoteDataAsync((int)record.DrPlanProjectItemID, finYear)
            : null;
        var crItem = record.CrPlanProjectItemID != null
            ? await _internalApi.GetPpiVoteDataAsync((int)record.CrPlanProjectItemID, finYear)
            : null;

        int intDocNum = record.PriorYearAdjustment_ID;
        int journalId = await _txnService.InsertJournalAsset(conn, txn,
            finYear, processingMonth, transactionId, journalTransactionTypeId,
            postingDate, (int?)drItem?.VoteId, (int?)crItem?.VoteId, Math.Abs(totalAmount),
            documentNumber, intDocNum, assetId,
            scoaItemId: (int?)drItem?.SCOAItemID,
            itemDescription: $"Prior Year Adjustment — {record.AdjustmentTypeCode}");

        var pyaOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
            conn, txn, "ASSET_CAPITALISATION", documentNumber);

        if (drItem?.VoteId != null)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                postingDate, processingMonth, (int)drItem.VoteId, finYear,
                documentTypeId, $"Prior Year Adjustment — {record.AdjustmentTypeCode}", documentNumber,
                debit: Math.Abs(totalAmount), credit: null, matchTranGuid: transactionId,
                journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                scoaFundsId: (int?)drItem.SCOAFundId,
                scoaRegionId: (int?)drItem.SCOARegionId,
                scoaCostingId: (int?)drItem.SCOACostingID,
                scoaProjectId: (int?)drItem.ScoaProjectID,
                scoaFunctionId: (int?)drItem.SCOAFunctionId,
                scoaItemId: (int?)drItem.SCOAItemID ?? 0,
                divisionId: (int?)drItem.DivisionId,
                projectId: (int?)drItem.ProjectID,
                planProjectItemId: (int?)drItem.PlanProjectItem_ID,
                    outboxId: pyaOutboxId);
        }

        if (crItem?.VoteId != null)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                postingDate, processingMonth, (int)crItem.VoteId, finYear,
                documentTypeId, $"Prior Year Adjustment — {record.AdjustmentTypeCode}", documentNumber,
                debit: null, credit: Math.Abs(totalAmount), matchTranGuid: transactionId,
                journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                scoaFundsId: (int?)crItem.SCOAFundId,
                scoaRegionId: (int?)crItem.SCOARegionId,
                scoaCostingId: (int?)crItem.SCOACostingID,
                scoaProjectId: (int?)crItem.ScoaProjectID,
                scoaFunctionId: (int?)crItem.SCOAFunctionId,
                scoaItemId: (int?)crItem.SCOAItemID ?? 0,
                divisionId: (int?)crItem.DivisionId,
                projectId: (int?)crItem.ProjectID,
                planProjectItemId: (int?)crItem.PlanProjectItem_ID,
                    outboxId: pyaOutboxId);
        }

        // Patch SCOA segments on GL entries using pre-fetched PPI data
        foreach (var (item, ppiId) in new[] {
            (drItem, record.DrPlanProjectItemID as object),
            (crItem, record.CrPlanProjectItemID as object) })
        {
            if (item == null || ppiId == null) continue;
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_GeneralLedger""
                SET ""SCOAItemID""     = @scoaItemId,
                    ""DivisionID""     = @divisionId,
                    ""SCOAFunctionID"" = @scoaFunctionId,
                    ""SCOAFundsID""    = @scoaFundId,
                    ""SCOARegionID""   = @scoaRegionId,
                    ""SCOAProjectID""  = @scoaProjectId,
                    ""ProjectID""      = @projectId,
                    ""SCOACostingID""  = @scoaCostingId,
                    ""VoteID""         = @voteId
                WHERE ""MatchTranGuid"" = @matchTranGuid
                  AND ""PlanProjectItemID"" = @planProjectItemId",
                new {
                    scoaItemId    = (int?)item.SCOAItemID,
                    divisionId    = (int?)item.DivisionId,
                    scoaFunctionId= (int?)item.SCOAFunctionId,
                    scoaFundId    = (int?)item.SCOAFundId,
                    scoaRegionId  = (int?)item.SCOARegionId,
                    scoaProjectId = (int?)item.ScoaProjectID,
                    projectId     = (int?)item.ProjectID,
                    scoaCostingId = (int?)item.SCOACostingID,
                    voteId        = (int?)item.VoteId,
                    matchTranGuid = transactionId,
                    planProjectItemId = (int)ppiId
                }, txn);
        }

        return pyaOutboxId;
    }

    private async Task<AssetDetailsForPriorYear?> LoadAssetDetails(DbConnection conn, int assetId)
    {
        return await conn.QueryFirstOrDefaultAsync<AssetDetailsForPriorYear>(@"
            SELECT a.""AssetRegisterItem_ID"", a.""Description"",
                   COALESCE(a.""PurchaseAmount"", 0) AS ""PurchaseAmount"",
                   COALESCE(ABS(a.""AccumulatedDepreciationClosingBalance""), 0) AS ""AccumulatedDepreciationClosingBalance"",
                   COALESCE(ABS(a.""AccumulatedImpairmentClosingBalance""), 0) AS ""AccumulatedImpairmentClosingBalance"",
                   COALESCE(a.""CarryingAmountClosingBalance"", 0) AS ""CarryingAmountClosingBalance"",
                   COALESCE(a.""ResidualValue"", 0) AS ""ResidualValue"",
                   COALESCE(a.""RemainingUsefulLife"", 0) AS ""RemainingUsefulLife"",
                   COALESCE(a.""UsefulLifeYearComponent"", 0) AS ""UsefullLife"",
                   COALESCE(a.""RevaluationReserveClosingBalance"", 0) AS ""RevaluationReserveClosingBalance"",
                   COALESCE(a.""CurrentReplacementCostCRC"", 0) AS ""CurrentReplacementCostCRC"",
                   a.""InserviceDate"", a.""AcquisitionDate"",
                   a.""AssetType_ID"", a.""AssetCategory_ID"", a.""Asset_SubCategory_ID"", a.""MeasurementType_ID"",
                   at2.""AssetTypeDesc"", cat.""AssetCategoryDesc"",
                   sub.""Asset_SubCategoryDescription"", mt.""Name"" AS ""MeasurementTypeDesc""
            FROM ""Asset_Register_Items"" a
            LEFT JOIN ""Const_AssetType_Sys"" at2 ON a.""AssetType_ID"" = at2.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON a.""AssetCategory_ID"" = cat.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sub ON a.""Asset_SubCategory_ID"" = sub.""Asset_SubCategory_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON a.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
            WHERE a.""AssetRegisterItem_ID"" = @assetId",
            new { assetId });
    }

    // Returns a single authoritative GL posting amount per adjustment type.
    // Each type has one primary financial basis that drives the journal entry;
    // using cumulative period deltas would double-count fields like AccDepDelta.
    private static decimal GetGlAmount(PriorYearAdjustment record)
    {
        return record.AdjustmentTypeCode switch
        {
            "COST"        => Math.Abs((record.NewCostAmount ?? 0m) - (record.SnapshotCost ?? 0m)),
            "VALUATION"   => Math.Abs(record.PriorPeriods_CostDelta ?? 0m),
            "DATE"        => Math.Abs(record.CurrentPeriod_AccDepDelta ?? 0m),
            "RESIDUAL"    => Math.Abs(record.CurrentPeriod_AccDepDelta ?? 0m),
            // Impairment GL amount = delta (new amount minus existing snapshot), not absolute new balance
            "IMP_COST"    => Math.Abs((record.NewImpairmentAmount ?? 0m) - (record.SnapshotAccImp ?? 0m)),
            "IMP_REVAL"   => Math.Abs((record.NewImpairmentAmount ?? 0m) - (record.SnapshotAccImp ?? 0m)),
            "IMPREV_COST" => Math.Abs(record.PriorPeriods_AccImpDelta ?? 0m),
            "IMPREV_REVAL"=> Math.Abs(record.PriorPeriods_AccImpDelta ?? 0m),
            "DISP_COST"   => Math.Abs(record.SnapshotCost ?? Math.Abs(record.PriorPeriods_CostDelta ?? 0m)),
            "DISP_REVAL"  => Math.Abs(record.SnapshotCost ?? Math.Abs(record.PriorPeriods_CostDelta ?? 0m)),
            "DEEMED_COST" => Math.Abs(record.NewCostAmount ?? 0m),
            _             => 0m
        };
    }

    private static PriorYearCalculateRequest MapToCalculateRequest(PriorYearAdjustment r)
    {
        return new PriorYearCalculateRequest
        {
            AdjustmentTypeCode = r.AdjustmentTypeCode,
            AssetRegisterItemId = r.AssetRegisterItem_ID ?? 0,
            EffectiveDate = r.EffectiveDate,
            FinYear = r.FinYear,
            NewCostAmount = r.NewCostAmount,
            NewValuationAmount = r.NewValuationAmount,
            NewRUL = r.NewRUL,
            NewAcquisitionDate = r.NewAcquisitionDate,
            NewResidualValue = r.NewResidualValue,
            ResidualValueEffectiveDate = r.ResidualValueEffectiveDate,
            NewImpairmentAmount = r.NewImpairmentAmount,
            ImpairmentEffectiveDate = r.ImpairmentEffectiveDate,
            DisposalDate = r.DisposalDate,
            DisposalReason = r.DisposalReason,
            DisposalProceeds = r.DisposalProceeds
        };
    }
}
