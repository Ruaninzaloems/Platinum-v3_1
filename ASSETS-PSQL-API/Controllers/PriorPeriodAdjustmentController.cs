using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data.Common;
using AssetManagement.Data;
using AssetManagement.Services;
using AssetManagement.Models;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/prior-period-adjustments")]
public class PriorPeriodAdjustmentController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;
    private readonly LookupService _lookupService;
    private readonly InternalApiClient _internalApi;
    private readonly EmailService _emailService;
    private static readonly string[] AdjustmentTypes = new[]
    {
        "DEP_ADJ", "COST_ADJ", "IMP_ADJ", "IMPREV_ADJ", "REVAL_ADJ"
    };

    public PriorPeriodAdjustmentController(DbConnectionFactory db, TransactionService txnService, LookupService lookupService, InternalApiClient internalApi, EmailService emailService)
    {
        _db = db;
        _txnService = txnService;
        _lookupService = lookupService;
        _internalApi = internalApi;
        _emailService = emailService;
    }

    [HttpGet("types")]
    public IActionResult GetTypes()
    {
        var types = new[]
        {
            new { code = "DEP_ADJ",    label = "Depreciation Adjustment",           description = "Correct depreciation amount in a prior period of the current financial year" },
            new { code = "COST_ADJ",   label = "Cost Adjustment",                   description = "Correct the cost/valuation amount in a prior period of the current financial year" },
            new { code = "IMP_ADJ",    label = "Impairment Adjustment",             description = "Correct or add an impairment loss in a prior period of the current financial year" },
            new { code = "IMPREV_ADJ", label = "Impairment Reversal Adjustment",    description = "Correct or add an impairment reversal in a prior period of the current financial year" },
            new { code = "REVAL_ADJ",  label = "Revaluation Adjustment",            description = "Correct a revaluation amount in a prior period of the current financial year" }
        };
        return Ok(types);
    }

    [HttpGet("eligible-periods")]
    public async Task<IActionResult> GetEligiblePeriods([FromQuery] string? finYear)
    {
        var (curYear, curPeriod) = _txnService.GetCurrentFinancialPeriod();
        var targetYear = string.IsNullOrEmpty(finYear) ? curYear : finYear;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var closedPeriods = await conn.QueryAsync<dynamic>(@"
            SELECT ""Financial_Period"" AS ""Period"", ""Financial_Year"" AS ""FinYear""
            FROM ""Asset_MonthlyApproval""
            WHERE ""Financial_Year"" = @targetYear
              AND ""IsApproved"" = TRUE
              AND ""Financial_Period"" < @curPeriod
            ORDER BY ""Financial_Period""",
            new { targetYear, curPeriod });

        var periods = new List<object>();
        foreach (var cp in closedPeriods)
        {
            periods.Add(new { finYear = (string)cp.FinYear, period = (int)cp.Period, label = $"Period {cp.Period}", closed = true });
        }

        return Ok(new { currentFinYear = curYear, currentPeriod = curPeriod, periods });
    }

    [HttpGet("periods")]
    public async Task<IActionResult> GetAvailablePeriods()
    {
        var (curYear, curPeriod) = _txnService.GetCurrentFinancialPeriod();

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var closedPeriodNums = await conn.QueryAsync<int>(@"
            SELECT ""Financial_Period""
            FROM ""Asset_MonthlyApproval""
            WHERE ""Financial_Year"" = @curYear
              AND ""IsApproved"" = TRUE
              AND ""Financial_Period"" < @curPeriod",
            new { curYear, curPeriod });

        var closedSet = new HashSet<int>(closedPeriodNums);

        var periods = new List<object>();
        for (int p = 1; p < curPeriod; p++)
        {
            bool isClosed = closedSet.Contains(p);
            periods.Add(new { finYear = curYear, period = p, label = $"Period {p}", closed = isClosed });
        }
        return Ok(new { currentFinYear = curYear, currentPeriod = curPeriod, periods });
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchAssets(
        [FromQuery] int? assetRegisterItemId,
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
                   COALESCE(a.""RevaluationReserveClosingBalance"", 0) AS ""RevaluationReserveClosingBalance"",
                   at.""AssetTypeDesc"",
                   cat.""AssetCategoryDesc"",
                   sub.""Asset_SubCategoryDescription"",
                   mt.""Name"" AS ""MeasurementTypeDesc""
            FROM ""Asset_Register_Items"" a
            LEFT JOIN ""Const_AssetType_Sys"" at ON a.""AssetType_ID"" = at.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON a.""AssetCategory_ID"" = cat.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sub ON a.""Asset_SubCategory_ID"" = sub.""Asset_SubCategory_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON a.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
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

        sql += @" ORDER BY a.""AssetRegisterItem_ID"" LIMIT 100";

        var items = await conn.QueryAsync<dynamic>(sql, prms);
        return Ok(items);
    }

    [HttpGet("downstream-impact")]
    public async Task<IActionResult> GetDownstreamImpact(
        [FromQuery] int? assetRegisterItemId,
        [FromQuery] int? assetId,
        [FromQuery] string finYear,
        [FromQuery] int targetPeriod)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        int resolvedAssetId = assetId ?? assetRegisterItemId ?? 0;
        if (resolvedAssetId == 0)
            return BadRequest(new { error = "assetId or assetRegisterItemId is required" });

        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT tt.""Name"" AS ""TransactionType"", t.""FinancialPeriod"" AS ""FinPeriod"", COUNT(*) AS ""Count""
            FROM ""Asset_Register_Transactions"" t
            LEFT JOIN ""AssetConfig_TransactionType"" tt ON t.""TransactionTypeID"" = tt.""AssetConfig_TransactionType_ID""
            WHERE t.""AssetRegisterItem_ID"" = @assetId
              AND t.""FinancialYear"" = @finYear
              AND t.""FinancialPeriod"" > @targetPeriod
            GROUP BY tt.""Name"", t.""FinancialPeriod""
            ORDER BY t.""FinancialPeriod""",
            new { assetId = resolvedAssetId, finYear, targetPeriod });

        var closedPeriods = await conn.QueryAsync<int>(@"
            SELECT DISTINCT ""Financial_Period""
            FROM ""Asset_MonthlyApproval""
            WHERE ""Financial_Year"" = @finYear
              AND ""IsApproved"" = TRUE
              AND ""Financial_Period"" > @targetPeriod",
            new { finYear, targetPeriod });

        var closedSet = new HashSet<int>(closedPeriods);

        int totalCount = 0;
        int closedPeriodTxnCount = 0;
        var typeNames = new List<string>();
        var closedPeriodTypeNames = new List<string>();
        var affectedPeriods = new HashSet<int>();
        var affectedClosedPeriods = new HashSet<int>();
        foreach (var r in rows)
        {
            int cnt = (int)(long)(r.Count);
            int period = (int)r.FinPeriod;
            totalCount += cnt;
            affectedPeriods.Add(period);
            string typeName = (string)(r.TransactionType ?? "Unknown");
            if (!typeNames.Contains(typeName)) typeNames.Add(typeName);
            if (closedSet.Contains(period))
            {
                affectedClosedPeriods.Add(period);
                closedPeriodTxnCount += cnt;
                if (!closedPeriodTypeNames.Contains(typeName)) closedPeriodTypeNames.Add(typeName);
            }
        }

        var warningParts = new List<string>();
        if (affectedClosedPeriods.Count > 0)
        {
            warningParts.Add($"This asset has {closedPeriodTxnCount} transaction(s) across {affectedClosedPeriods.Count} subsequent closed period(s) after period {targetPeriod} (types: {string.Join(", ", closedPeriodTypeNames)}).");
            warningParts.Add("Approving this adjustment will trigger a recalculation cascade through all affected closed periods.");
        }
        if (totalCount > closedPeriodTxnCount)
        {
            int openTxns = totalCount - closedPeriodTxnCount;
            int openPeriods = affectedPeriods.Count - affectedClosedPeriods.Count;
            warningParts.Add($"Additionally, {openTxns} transaction(s) exist in {openPeriods} open subsequent period(s).");
        }
        if (totalCount > 0)
        {
            warningParts.Add("Note: existing transactions in subsequent periods remain unchanged and may require additional prior period adjustments if materially affected.");
        }

        return Ok(new {
            count = closedPeriodTxnCount,
            closedPeriodCount = affectedClosedPeriods.Count,
            transactionTypes = closedPeriodTypeNames,
            allTransactionTypes = typeNames,
            totalTransactionCount = totalCount,
            affectedClosedPeriods = affectedClosedPeriods.OrderBy(p => p).ToList(),
            affectedPeriods = affectedPeriods.OrderBy(p => p).ToList(),
            warning = warningParts.Count > 0 ? string.Join(" ", warningParts) : (string?)null
        });
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var items = await conn.QueryAsync<dynamic>(@"
            SELECT p.*, a.""Description"" AS ""AssetDescription""
            FROM ""Asset_PriorPeriodAdjustment"" p
            LEFT JOIN ""Asset_Register_Items"" a ON p.""AssetRegisterItem_ID"" = a.""AssetRegisterItem_ID""
            WHERE p.""Status"" = 'Pending'
            ORDER BY p.""PriorPeriodAdjustment_ID"" DESC");

        return Ok(items);
    }

    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] PriorPeriodSubmitRequest req)
    {
        if (req.AssetRegisterItemId <= 0)
            return BadRequest(new { error = "AssetRegisterItemId is required" });
        if (string.IsNullOrEmpty(req.AdjustmentTypeCode) || !AdjustmentTypes.Contains(req.AdjustmentTypeCode))
            return BadRequest(new { error = $"Invalid AdjustmentTypeCode. Must be one of: {string.Join(", ", AdjustmentTypes)}" });
        if (string.IsNullOrEmpty(req.TargetFinYear))
            return BadRequest(new { error = "TargetFinYear is required" });
        if (req.TargetFinPeriod <= 0)
            return BadRequest(new { error = "TargetFinPeriod is required" });

        var (curYear, curPeriod) = _txnService.GetCurrentFinancialPeriod();
        if (req.TargetFinYear != curYear)
            return BadRequest(new { error = "Prior period adjustments are only allowed within the current financial year" });
        if (req.TargetFinPeriod >= curPeriod)
            return BadRequest(new { error = "Target period must be earlier than the current period" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var isClosed = await conn.QueryFirstOrDefaultAsync<int?>(@"
            SELECT ""MonthlyApproval_ID""
            FROM ""Asset_MonthlyApproval""
            WHERE ""Financial_Year"" = @finYear
              AND ""Financial_Period"" = @finPeriod
              AND ""IsApproved"" = TRUE",
            new { finYear = req.TargetFinYear, finPeriod = req.TargetFinPeriod });

        if (isClosed == null)
            return BadRequest(new { error = $"Target period {req.TargetFinPeriod} of {req.TargetFinYear} is not a closed period. Prior period adjustments can only be submitted for closed periods." });

        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""AssetRegisterItem_ID"",
                   COALESCE(""PurchaseAmount"", 0) AS ""PurchaseAmount"",
                   COALESCE(""AccumulatedDepreciationClosingBalance"", 0) AS ""AccumulatedDepreciationClosingBalance"",
                   COALESCE(""AccumulatedImpairmentClosingBalance"", 0) AS ""AccumulatedImpairmentClosingBalance"",
                   COALESCE(""CarryingAmountClosingBalance"", 0) AS ""CarryingAmountClosingBalance"",
                   COALESCE(""ResidualValue"", 0) AS ""ResidualValue"",
                   COALESCE(""RemainingUsefulLife"", 0) AS ""RemainingUsefulLife"",
                   COALESCE(""RevaluationReserveClosingBalance"", 0) AS ""RevaluationReserveClosingBalance""
            FROM ""Asset_Register_Items""
            WHERE ""AssetRegisterItem_ID"" = @id", new { id = req.AssetRegisterItemId });

        if (asset == null)
            return NotFound(new { error = "Asset not found" });

        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_PriorPeriodAdjustment"" (
                ""AssetRegisterItem_ID"", ""AdjustmentTypeCode"", ""Status"",
                ""TargetFinYear"", ""TargetFinPeriod"",
                ""TransactionDate"", ""DebitAmount"", ""CreditAmount"", ""Narration"",
                ""AdjustmentAmount"", ""NewDepreciationAmount"", ""NewCostAmount"",
                ""NewImpairmentAmount"", ""NewImpairmentReversalAmount"", ""NewRevaluationAmount"",
                ""SnapshotCost"", ""SnapshotAccDep"", ""SnapshotAccImp"",
                ""SnapshotCarryingAmount"", ""SnapshotResidualValue"", ""SnapshotRUL"", ""SnapshotRR"",
                ""DownstreamImpactCount"", ""DownstreamImpactTypes"",
                ""DrPlanProjectItemID"", ""CrPlanProjectItemID"",
                ""Comments"", ""DateCaptured"", ""CapturerID""
            ) VALUES (
                @AssetRegisterItemId, @AdjustmentTypeCode, 'Pending',
                @TargetFinYear, @TargetFinPeriod,
                @TransactionDate, @DebitAmount, @CreditAmount, @Narration,
                @AdjustmentAmount, @NewDepreciationAmount, @NewCostAmount,
                @NewImpairmentAmount, @NewImpairmentReversalAmount, @NewRevaluationAmount,
                @SnapshotCost, @SnapshotAccDep, @SnapshotAccImp,
                @SnapshotCA, @SnapshotResidual, @SnapshotRUL, @SnapshotRR,
                @DownstreamImpactCount, @DownstreamImpactTypes,
                @DrPPI, @CrPPI,
                @Comments, NOW(), 1
            ) RETURNING ""PriorPeriodAdjustment_ID""",
            new
            {
                req.AssetRegisterItemId, req.AdjustmentTypeCode,
                req.TargetFinYear, req.TargetFinPeriod,
                TransactionDate = req.TransactionDate ?? DateTime.Today,
                req.DebitAmount, req.CreditAmount, req.Narration,
                req.AdjustmentAmount, req.NewDepreciationAmount, req.NewCostAmount,
                req.NewImpairmentAmount, req.NewImpairmentReversalAmount, req.NewRevaluationAmount,
                SnapshotCost = (decimal)asset.PurchaseAmount,
                SnapshotAccDep = (decimal)asset.AccumulatedDepreciationClosingBalance,
                SnapshotAccImp = (decimal)asset.AccumulatedImpairmentClosingBalance,
                SnapshotCA = (decimal)asset.CarryingAmountClosingBalance,
                SnapshotResidual = (decimal)asset.ResidualValue,
                SnapshotRUL = (decimal)asset.RemainingUsefulLife,
                SnapshotRR = (decimal)asset.RevaluationReserveClosingBalance,
                req.DownstreamImpactCount, req.DownstreamImpactTypes,
                DrPPI = req.DrPlanProjectItemID, CrPPI = req.CrPlanProjectItemID,
                req.Comments
            });

        return Ok(new { id, success = true });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? adjustmentTypeCode, [FromQuery] string? status)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var sql = @"
            SELECT p.*, a.""Description"" AS ""AssetDescription""
            FROM ""Asset_PriorPeriodAdjustment"" p
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

        sql += @" ORDER BY p.""PriorPeriodAdjustment_ID"" DESC";

        var items = await conn.QueryAsync<dynamic>(sql, prms);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var record = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT p.*, a.""Description"" AS ""AssetDescription"",
                   at2.""AssetTypeDesc"", cat.""AssetCategoryDesc"",
                   sub.""Asset_SubCategoryDescription"", mt.""Name"" AS ""MeasurementTypeDesc""
            FROM ""Asset_PriorPeriodAdjustment"" p
            LEFT JOIN ""Asset_Register_Items"" a ON p.""AssetRegisterItem_ID"" = a.""AssetRegisterItem_ID""
            LEFT JOIN ""Const_AssetType_Sys"" at2 ON a.""AssetType_ID"" = at2.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON a.""AssetCategory_ID"" = cat.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sub ON a.""Asset_SubCategory_ID"" = sub.""Asset_SubCategory_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON a.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
            WHERE p.""PriorPeriodAdjustment_ID"" = @id", new { id });

        if (record == null) return NotFound(new { error = "Prior period adjustment not found" });

        return Ok(new { record });
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] PriorPeriodApproveRequest? req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            var record = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT * FROM ""Asset_PriorPeriodAdjustment"" WHERE ""PriorPeriodAdjustment_ID"" = @id",
                new { id }, txn);

            if (record == null)
            {
                await txn.RollbackAsync();
                return NotFound(new { error = "Record not found" });
            }
            if ((string)record.Status != "Pending")
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = $"Cannot approve a record with status '{record.Status}'" });
            }

            int assetId = (int)record.AssetRegisterItem_ID;
            string typeCode = (string)record.AdjustmentTypeCode;
            string finYear = (string)record.TargetFinYear;
            int finPeriod = (int)record.TargetFinPeriod;

            var isClosed = await conn.QueryFirstOrDefaultAsync<int?>(@"
                SELECT ""MonthlyApproval_ID""
                FROM ""Asset_MonthlyApproval""
                WHERE ""Financial_Year"" = @finYear
                  AND ""Financial_Period"" = @finPeriod
                  AND ""IsApproved"" = TRUE",
                new { finYear, finPeriod }, txn);

            if (isClosed == null)
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = $"Target period {finPeriod} of {finYear} is not a closed period. Prior period adjustments can only be applied to closed periods." });
            }

            await PostTransactionRecord(conn, txn, record, assetId, typeCode, finYear, finPeriod);

            Guid? ppaGlOutboxId = null;
            if (record.DrPlanProjectItemID != null && record.CrPlanProjectItemID != null)
            {
                ppaGlOutboxId = await PostGlEntries(conn, txn, record, finYear, finPeriod, assetId);
            }

            await _txnService.PopulateTransactionSummarySingle(conn, txn, assetId, finYear, finPeriod);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_PriorPeriodAdjustment""
                SET ""Status"" = 'Approved', ""ApprovedBy"" = 1, ""ApprovedDate"" = NOW(),
                    ""Comments"" = COALESCE(@comments, ""Comments""), ""DateModified"" = NOW()
                WHERE ""PriorPeriodAdjustment_ID"" = @id",
                new { id, comments = req?.Comments }, txn);

            await txn.CommitAsync();

            if (ppaGlOutboxId.HasValue)
                await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(ppaGlOutboxId.Value);

            var ppaTokens = await _emailService.BuildAssetBaseTokensAsync(conn, assetId);
            ppaTokens["AdjustmentType"]   = typeCode;
            ppaTokens["AdjustmentAmount"] = ResolveAmount(record).ToString("N2");
            ppaTokens["TargetFinYear"]    = finYear;
            ppaTokens["TargetFinPeriod"]  = finPeriod.ToString();
            _ = _emailService.SendTransactionEmailsAsync("Prior Period Adjustment", ppaTokens);
            return Ok(new { success = true, message = "Prior period adjustment approved successfully. Transaction summaries have been recalculated for the target period and all subsequent periods." });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] PriorPeriodRejectRequest req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var updated = await conn.ExecuteAsync(@"
            UPDATE ""Asset_PriorPeriodAdjustment""
            SET ""Status"" = 'Rejected', ""RejectionReason"" = @reason, ""RejectedBy"" = 1,
                ""RejectedDate"" = NOW(), ""DateModified"" = NOW()
            WHERE ""PriorPeriodAdjustment_ID"" = @id AND ""Status"" = 'Pending'",
            new { id, reason = req?.RejectionReason });

        if (updated == 0)
            return BadRequest(new { error = "Record not found or not in Pending status" });

        return Ok(new { success = true });
    }

    private async Task PostTransactionRecord(DbConnection conn, DbTransaction txn,
        dynamic record, int assetId, string typeCode, string finYear, int finPeriod)
    {
        int transactionTypeId = 9;
        decimal amount = ResolveAmount(record);

        DateTime transactionDate = record.TransactionDate != null
            ? (DateTime)record.TransactionDate
            : DateTime.Today;

        var transactionId = Guid.NewGuid();
        int? documentTypeId = 1020;

        var summary = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""RemainingUsefulLife""
            FROM ""Asset_Transaction_Summary""
            WHERE ""AssetRegisterItemID"" = @assetId
              AND ""FinancialYear"" = @finYear
              AND ""FinancialPeriod"" = @finPeriod
            LIMIT 1",
            new { assetId, finYear, finPeriod }, txn);

        decimal? remainingUsefulLife = summary?.RemainingUsefulLife != null
            ? (decimal?)summary.RemainingUsefulLife
            : null;

        decimal? depreciationValue = null;
        decimal? impairmentValue = null;
        decimal? impairmentReversalValue = null;
        decimal? revaluationValue = null;
        decimal? purchaseAmount = null;

        if (typeCode == "DEP_ADJ") depreciationValue = amount;
        else if (typeCode == "COST_ADJ") purchaseAmount = amount;
        else if (typeCode == "IMP_ADJ") impairmentValue = amount;
        else if (typeCode == "IMPREV_ADJ") impairmentReversalValue = amount;
        else if (typeCode == "REVAL_ADJ") revaluationValue = amount;

        await _txnService.UpsertAssetRegisterTransaction(conn, txn,
            assetId, transactionTypeId, transactionDate,
            finYear, finPeriod, transactionId, documentTypeId,
            purchaseAmount: purchaseAmount,
            remainingUsefulLife: remainingUsefulLife,
            depreciationValue: depreciationValue,
            impairmentValue: impairmentValue,
            impairmentReversalValue: impairmentReversalValue,
            revaluationValue: revaluationValue);
    }

    private async Task<Guid?> PostGlEntries(DbConnection conn, DbTransaction txn,
        dynamic record, string finYear, int finPeriod, int assetId)
    {
        int journalTransactionTypeId = 37;
        int documentTypeId = await _lookupService.GetDocumentTypeIdAsync(conn, "Prior Period Adjustment", txn);
        if (documentTypeId == 0) documentTypeId = journalTransactionTypeId;
        int ppaId = (int)record.PriorPeriodAdjustment_ID;
        string documentNumber = $"PPA-{finYear}-{ppaId}";
        var transactionId = Guid.NewGuid();
        int processingMonth = await _txnService.GetProcessingMonth(conn, 1, txn);
        DateTime postingDate = record.TransactionDate != null
            ? (DateTime)record.TransactionDate
            : DateTime.Today;

        decimal resolvedAmount = ResolveAmount(record);
        decimal debitAmount = record.DebitAmount != null ? Math.Abs((decimal)record.DebitAmount) : resolvedAmount;
        decimal creditAmount = record.CreditAmount != null ? Math.Abs((decimal)record.CreditAmount) : resolvedAmount;

        decimal glAmount = debitAmount > 0 ? debitAmount : creditAmount;

        var drItem = record.DrPlanProjectItemID != null
            ? await _internalApi.GetPpiVoteDataAsync((int)record.DrPlanProjectItemID, finYear)
            : null;
        var crItem = record.CrPlanProjectItemID != null
            ? await _internalApi.GetPpiVoteDataAsync((int)record.CrPlanProjectItemID, finYear)
            : null;

        string typeCode = (string)record.AdjustmentTypeCode;
        string narration = record.Narration != null
            ? (string)record.Narration
            : $"Prior Period Adjustment — {typeCode}";

        int journalId = await _txnService.InsertJournalAsset(conn, txn,
            finYear, processingMonth, transactionId, journalTransactionTypeId,
            postingDate, (int?)drItem?.VoteId, (int?)crItem?.VoteId, glAmount,
            documentNumber, ppaId, assetId,
            scoaItemId: (int?)drItem?.SCOAItemID,
            itemDescription: narration);

        var ppaOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
            conn, txn, "ASSET_CAPITALISATION", documentNumber);

        if (drItem?.VoteId != null)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                postingDate, processingMonth, (int)drItem.VoteId, finYear,
                documentTypeId, narration, documentNumber,
                debit: debitAmount, credit: null, matchTranGuid: transactionId,
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
                    outboxId: ppaOutboxId);
        }

        if (crItem?.VoteId != null)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                postingDate, processingMonth, (int)crItem.VoteId, finYear,
                documentTypeId, narration, documentNumber,
                debit: null, credit: creditAmount, matchTranGuid: transactionId,
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
                    outboxId: ppaOutboxId);
        }

        return ppaOutboxId;
    }

    private static decimal ResolveAmount(dynamic record)
    {
        if (record.DebitAmount != null && (decimal)record.DebitAmount != 0m)
            return Math.Abs((decimal)record.DebitAmount);
        if (record.CreditAmount != null && (decimal)record.CreditAmount != 0m)
            return Math.Abs((decimal)record.CreditAmount);
        if (record.AdjustmentAmount != null && (decimal)record.AdjustmentAmount != 0m)
            return Math.Abs((decimal)record.AdjustmentAmount);
        if (record.NewDepreciationAmount != null && (decimal)record.NewDepreciationAmount != 0m)
            return Math.Abs((decimal)record.NewDepreciationAmount);
        if (record.NewCostAmount != null && (decimal)record.NewCostAmount != 0m)
            return Math.Abs((decimal)record.NewCostAmount);
        if (record.NewImpairmentAmount != null && (decimal)record.NewImpairmentAmount != 0m)
            return Math.Abs((decimal)record.NewImpairmentAmount);
        if (record.NewImpairmentReversalAmount != null && (decimal)record.NewImpairmentReversalAmount != 0m)
            return Math.Abs((decimal)record.NewImpairmentReversalAmount);
        if (record.NewRevaluationAmount != null && (decimal)record.NewRevaluationAmount != 0m)
            return Math.Abs((decimal)record.NewRevaluationAmount);
        return 0m;
    }
}
