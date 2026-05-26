using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data.Common;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-revaluations")]
public class RevaluationController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;
    private readonly LookupService _lookupService;
    private readonly EmailService _emailService;

    public RevaluationController(DbConnectionFactory db, TransactionService txnService, LookupService lookupService, EmailService emailService)
    {
        _db = db;
        _txnService = txnService;
        _lookupService = lookupService;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? assetRegisterItemId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""Asset_Revaluations"" WHERE 1=1";
        if (assetRegisterItemId.HasValue) sql += @" AND ""AssetRegisterID"" = @assetRegisterItemId";
        sql += @" ORDER BY ""Asset_RevaluationsID"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, new { assetRegisterItemId });
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""Asset_Revaluations"" WHERE ""Asset_RevaluationsID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Revaluation record not found" }) : Ok(item);
    }

    [HttpGet("{id:int}/detail")]
    public async Task<IActionResult> GetDetail(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var reval = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""Asset_Revaluations"" WHERE ""Asset_RevaluationsID"" = @id", new { id });
        if (reval == null) return NotFound(new { error = "Revaluation record not found" });

        int assetId = (int)(reval.AssetRegisterID ?? 0);
        DateTime txnDate = reval.RevalutionDate ?? DateTime.Today;

        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT a.""AssetRegisterItem_ID"", a.""Description"", a.""PurchaseAmount"",
                     a.""AccumulatedDepreciationClosingBalance"", a.""CarryingAmountClosingBalance"",
                     a.""RemainingUsefulLife"", a.""ResidualValue"",
                     at.""AssetTypeDesc"" AS ""AssetTypeName"",
                     cat.""AssetCategoryDesc"" AS ""CategoryName"",
                     sub.""Asset_SubCategoryDescription"" AS ""SubCategoryName""
              FROM ""Asset_Register_Items"" a
              LEFT JOIN ""Const_AssetType_Sys"" at ON a.""AssetType_ID"" = at.""AssetType_ID""
              LEFT JOIN ""Const_AssetCategory_sys"" cat ON a.""AssetCategory_ID"" = cat.""AssetCategoryID""
              LEFT JOIN ""Const_Asset_SubCategory"" sub ON a.""Asset_SubCategory_ID"" = sub.""Asset_SubCategory_ID""
              WHERE a.""AssetRegisterItem_ID"" = @assetId",
            new { assetId });

        var projected = await _txnService.GetEffectiveAssetValues(conn, assetId, txnDate.AddSeconds(-1));
        decimal revalAmt = (decimal)(reval.RevalautionAmt ?? 0m);
        decimal surplusAmount = (decimal)(reval.SurplusAmount ?? 0m);
        decimal depAdj = (decimal)(reval.DepreciationAdjustment ?? 0m);
        decimal fairValue = projected.CarryingAmount + revalAmt;

        return Ok(new
        {
            transaction = reval,
            asset,
            projected = new
            {
                carryingBeforeCatchUp = projected.CarryingAmount,
                carryingBeforeReval = projected.CarryingAmount,
                accumulatedDepreciation = projected.AccumulatedDepreciation,
                revalReserve = projected.RevaluationReserve,
                fairValue,
                revalAmt,
                surplusAmount,
                depAdj
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetRevaluation? model)
    {
        if (model == null)
            return BadRequest(new { error = "Model binding failed" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var revalApprovalMethod = await _txnService.GetApprovalMethod(conn);

        if (model.AssetRegisterID > 0 && model.RevalutionDate.HasValue)
        {
            if (revalApprovalMethod == "Automated")
            {
                bool duplicate = await _txnService.HasPendingTransactionInMonth(conn, "revaluation", model.AssetRegisterID, model.RevalutionDate.Value);
                if (duplicate)
                    return BadRequest(new { error = $"A revaluation already exists for this asset in {model.RevalutionDate.Value:MMMM yyyy}. Only one revaluation per asset per month is allowed in Automated mode." });
            }
            else
            {
                var pendingType = await _txnService.GetPendingTransactionTypeForAsset(conn, model.AssetRegisterID, model.RevalutionDate.Value);
                if (pendingType != null)
                    return BadRequest(new { error = $"There is an unapproved {pendingType} for this asset in {model.RevalutionDate.Value:MMMM yyyy}. Please approve or reject it before capturing a new transaction." });
            }

            // Cutoff validation — after duplicate checks, transaction must be on or before the next scheduled run's month-end date
            var (revalCutoffDate, _, _) = await _txnService.GetNextRunCutoffDateAsync(conn);
            if (model.RevalutionDate.Value.Date > revalCutoffDate.Date)
                return BadRequest(new { error = $"Transaction date {model.RevalutionDate.Value:dd MMM yyyy} exceeds the next scheduled run's month-end date of {revalCutoffDate:dd MMM yyyy}. Please capture a date on or before this cutoff." });
        }

        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_Revaluations""
                (""AssetRegisterID"", ""Revaluation"", ""Asset"", ""Profit"", ""RevalModel"",
                 ""RevalautionAmt"", ""RevalutionDate"", ""UserID"", ""DiffDepAcc"", ""DiffBook"",
                 ""ProjectDR"", ""ProjectItemDR"", ""ProjectCR"", ""ProjectItemCR"",
                 ""PostDateTime"", ""SurplusAmount"", ""DepreciationAdjustment"")
            VALUES
                (@AssetRegisterID, @Revaluation, @Asset, @Profit, @RevalModel,
                 @RevalautionAmt, @RevalutionDate, @UserID, @DiffDepAcc, @DiffBook,
                 @ProjectDR, @ProjectItemDR, @ProjectCR, @ProjectItemCR,
                 @PostDateTime, @SurplusAmount, @DepreciationAdjustment)
            RETURNING ""Asset_RevaluationsID""", model);
        model.Asset_RevaluationsID = id;

        if (revalApprovalMethod == "Automated" && model.AssetRegisterID > 0 && model.RevalutionDate.HasValue)
            await _txnService.RecalculatePendingAfterDate(conn, model.AssetRegisterID, model.RevalutionDate.Value);

        var defId = await conn.QueryFirstOrDefaultAsync<int?>(@"
            SELECT ""id"" FROM ""Asset_WorkflowDefinitions"" WHERE ""entity_type"" = 'revaluation' AND ""is_active"" = TRUE OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY");
        if (defId.HasValue)
        {
            var wfData = System.Text.Json.JsonSerializer.Serialize(new { assetId = model.AssetRegisterID, revaluationAmount = model.RevalautionAmt, surplusAmount = model.SurplusAmount, depreciationAdjustment = model.DepreciationAdjustment, revaluationDate = model.RevalutionDate?.ToString("yyyy-MM-dd"), revalModel = model.RevalModel });
            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_WorkflowInstances"" (""definition_id"", ""entity_type"", ""entity_id"", ""current_step"", ""status"", ""initiated_by"", ""data"", ""mssql_reference_id"")
                VALUES (@defId, 'revaluation', @entityId, 1, 'pending', 1, @wfData::jsonb, @refId)",
                new { defId = defId.Value, entityId = id.ToString(), wfData, refId = id.ToString() });
        }

        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] RevaluationApprovalRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            var reval = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ar.*, COALESCE(ari.""RevaluationReserveClosingBalance"", ari.""RevaluationOpeningBalance"", 0) AS ""AccRevalReserve"",
                       COALESCE(ari.""CurrentAmount"", 0) AS ""CurrentAmount""
                FROM ""Asset_Revaluations"" ar
                INNER JOIN ""Asset_Register_Items"" ari ON ar.""AssetRegisterID"" = ari.""AssetRegisterItem_ID""
                WHERE ar.""Asset_RevaluationsID"" = @id", new { id }, txn);

            if (reval is null)
                return NotFound(new { error = "Revaluation record not found" });

            if ((bool)(reval.Approved ?? false) == true)
            {
                await txn.RollbackAsync();
                return Ok(new { success = 1, alreadyApproved = 1, message = "Revaluation already approved" });
            }

            int assetRegId = (int)(reval.AssetRegisterID);
            int revalModel = (int)(reval.RevalModel ?? 0);
            decimal revalautionAmt = (decimal)(reval.RevalautionAmt ?? 0m);
            DateTime revalutionDate = (DateTime)(reval.RevalutionDate ?? DateTime.Now);
            decimal surplusAmount = (decimal)(reval.SurplusAmount ?? 0m);
            decimal depreciationAdjustment = (decimal)(reval.DepreciationAdjustment ?? 0m);
            decimal accRevalReserve = (decimal)(reval.AccRevalReserve ?? 0m);
            int revaluationUser = (int)(reval.UserID ?? 1);

            string finYear = _txnService.GetCurrentFinancialPeriod().year;
            decimal usefulLife = request.UsefulLife ?? 0m;

            var assetForCatchUp = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT COALESCE(""AccumulatedDepreciationClosingBalance"", 0) AS ""AccDepreciation"",
                       COALESCE(""AccumulatedImpairmentClosingBalance"", 0) AS ""AccImpairment"",
                       COALESCE(""RevaluationReserveClosingBalance"", COALESCE(""RevaluationOpeningBalance"", 0)) AS ""RevaluationReserve"",
                       COALESCE(""CurrentAmount"", ""CarryingAmountClosingBalance"", 0) AS ""CarryingValue"",
                       ""RemainingUsefulLife"", ""UsefulLifeMonthComponent"", ""ResidualValue"", ""InserviceDate"",
                       COALESCE(""AssetType_ID"", 0) AS ""AssetType_ID"",
                       COALESCE(""AssetCategory_ID"", 0) AS ""AssetCategory_ID"",
                       COALESCE(""Asset_SubCategory_ID"", 0) AS ""Asset_SubCategory_ID"",
                       COALESCE(""MeasurementType_ID"", 0) AS ""MeasurementType_ID"",
                       COALESCE(""AssetStatus_ID"", 0) AS ""AssetStatus_ID""
                FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { assetRegId }, txn);

            var lastDepDateForCatchUp = await conn.QueryFirstOrDefaultAsync<DateTime?>(
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
                  ) sub", new { assetRegId }, txn);

            DateTime catchUpFromDate;
            if (lastDepDateForCatchUp.HasValue)
                catchUpFromDate = lastDepDateForCatchUp.Value;
            else if (assetForCatchUp?.InserviceDate != null)
                catchUpFromDate = (DateTime)assetForCatchUp.InserviceDate;
            else
                catchUpFromDate = DateTime.Parse("2024-07-01");

            decimal remainingUsefulLifeMonthsForCatchUp = (decimal)(assetForCatchUp?.RemainingUsefulLife
                ?? assetForCatchUp?.UsefulLifeMonthComponent ?? 0m);
            int catchUpDaysForReval = (int)(revalutionDate - catchUpFromDate).TotalDays;
            if (catchUpDaysForReval < 0) catchUpDaysForReval = 0;
            decimal catchUpDepForReval = 0m;

            if (catchUpDaysForReval > 0 && remainingUsefulLifeMonthsForCatchUp > 0)
            {
                decimal catchUpCurrentValue = (decimal)(assetForCatchUp?.CarryingValue ?? 0m);
                decimal catchUpResidual = (decimal)(assetForCatchUp?.ResidualValue ?? 0m);
                decimal catchUpDepreciable = catchUpCurrentValue - catchUpResidual;
                if (catchUpDepreciable < 0) catchUpDepreciable = 0;

                int maxCatchUpDays = (int)(remainingUsefulLifeMonthsForCatchUp * 30.44m);
                if (catchUpDaysForReval > maxCatchUpDays) catchUpDaysForReval = maxCatchUpDays;

                catchUpDepForReval = Math.Round(catchUpDepreciable * 12m / remainingUsefulLifeMonthsForCatchUp / 365m * catchUpDaysForReval, 2);
                if (catchUpDepForReval > catchUpDepreciable) catchUpDepForReval = catchUpDepreciable;
            }

            Guid? catchUpGlOutboxId = null;
            if (catchUpDepForReval > 0 && assetForCatchUp != null)
            {
                catchUpGlOutboxId = await PostCatchUpDepreciationForRevaluation(conn, txn, assetRegId,
                    catchUpDepForReval, revalutionDate, finYear, catchUpDaysForReval, assetForCatchUp);
            }

            string rvLatJoin = _db.IsSqlServer
                ? @"OUTER APPLY (
                    SELECT TOP 1 * FROM ""Asset_Register_Transactions""
                    WHERE ""AssetRegisterItem_ID"" = ari.""AssetRegisterItem_ID""
                    ORDER BY ""ID"" DESC
                ) t"
                : @"LEFT JOIN LATERAL (
                    SELECT * FROM ""Asset_Register_Transactions""
                    WHERE ""AssetRegisterItem_ID"" = ari.""AssetRegisterItem_ID""
                    ORDER BY ""ID"" DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
                ) t ON true";
            var itemFunc = await conn.QueryFirstOrDefaultAsync<dynamic>($@"
                SELECT COALESCE(t.""CurrentValue"", COALESCE(ari.""CurrentAmount"", 0)) AS ""CurrentValue"",
                       COALESCE(t.""AccumulatedRevaluation"", COALESCE(ari.""RevaluationReserveClosingBalance"", 0)) AS ""AccumulatedRevaluation"",
                       COALESCE(t.""PurchaseAmount"", ari.""PurchaseAmount"") AS ""PurchaseAmount""
                FROM ""Asset_Register_Items"" ari
                {rvLatJoin}
                WHERE ari.""AssetRegisterItem_ID"" = @assetRegId", new { assetRegId }, txn);

            decimal carryingValue = (decimal)(itemFunc?.CurrentValue ?? 0m);
            decimal accumulatedRevaluation = (decimal)(itemFunc?.AccumulatedRevaluation ?? 0m);

            var classData = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT COALESCE(cc.""RevaluationByRevalutionModel"", 0) AS ""RevaluationByRevalutionModel""
                FROM ""Asset_Register_Items"" ari
                LEFT JOIN ""Const_AssetClass_sys"" cc ON ari.""AssetClass_ID"" = cc.""AssetClass_ID""
                WHERE ari.""AssetRegisterItem_ID"" = @assetRegId", new { assetRegId }, txn);
            int negativeAllowed = (int)(classData?.RevaluationByRevalutionModel ?? 0);

            decimal accRevalSurplus = accRevalReserve > 0 ? accRevalReserve : 0;
            decimal gainLoss = accRevalSurplus + surplusAmount;

            decimal revaluationGainCt = 0, revaluationGainDt = 0, revaluationLoss = 0;
            if (surplusAmount > 0)
            {
                revaluationGainCt = gainLoss > 0 ? Math.Abs(surplusAmount) : accRevalSurplus;
            }
            if (surplusAmount < 0)
            {
                revaluationGainDt = gainLoss <= 0 ? accRevalSurplus : Math.Abs(surplusAmount);
            }
            revaluationLoss = gainLoss < 0 ? Math.Abs(gainLoss) : 0;

            decimal revaluationDebit, revaluationCredit;
            if (negativeAllowed != 1)
            {
                revaluationDebit = (surplusAmount + depreciationAdjustment) > 0 ? (surplusAmount + depreciationAdjustment) : 0;
                revaluationCredit = (surplusAmount + depreciationAdjustment) < 0 ? Math.Abs(surplusAmount + depreciationAdjustment) : 0;
            }
            else
            {
                revaluationDebit = surplusAmount > 0 ? surplusAmount : 0;
                revaluationCredit = surplusAmount < 0 ? Math.Abs(surplusAmount) : 0;
            }

            decimal movementInRevalReserve;
            if (surplusAmount + accRevalReserve < 0)
                movementInRevalReserve = accRevalReserve * -1;
            else
                movementInRevalReserve = surplusAmount;

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items""
                SET ""RevaluationDoneBy"" = @revaluationUser,
                    ""LastRevaluationDate"" = @revalutionDate,
                    ""RevaluationValue"" = @revalautionAmt,
                    ""RevaluationReserveClosingBalance"" = @newRevalReserve,
                    ""RevaluationDate"" = @revalutionDate,
                    ""RevaluationModel_ID"" = @revalModel,
                    ""MovementInRevaluationReserve"" = CASE WHEN COALESCE(@surplusAmount, 0) + COALESCE(""RevaluationReserveClosingBalance"", 0) < 0
                        THEN COALESCE(""MovementInRevaluationReserve"", 0) + (COALESCE(""RevaluationReserveClosingBalance"", 0) * -1)
                        ELSE COALESCE(""MovementInRevaluationReserve"", 0) + COALESCE(@surplusAmount, 0) END,
                    ""AccumulatedDepreciationClosingBalance"" = COALESCE(""AccumulatedDepreciationClosingBalance"", 0) + @depreciationAdjustment,
                    ""CurrentReplacementCostCRC"" = (""CurrentReplacementCostCRC"" + @surplusAmount + @depreciationAdjustment)
                WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new {
                    revaluationUser, revalutionDate, revalautionAmt,
                    newRevalReserve = accRevalSurplus + surplusAmount,
                    revalModel, depreciationAdjustment,
                    surplusAmount, assetRegId
                }, txn);

            string itemDescription = "Asset Revaluation";
            var mscoaConfig = await _txnService.LookupMscoaConfig(conn, assetRegId, "Revaluation", finYear, txn);
            var configErrors = _txnService.ValidateMscoaConfig(mscoaConfig, "Revaluation", assetRegId);
            if (configErrors.Count > 0)
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = "GL posting configuration incomplete", details = configErrors });
            }

            int journalTransactionTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""AssetJournalTransactionType_ID"", 0) FROM ""Const_AssetJournalTransactionType_Sys""
                WHERE ""AssetJournalTransactionDesc"" = @itemDescription OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", new { itemDescription }, txn);

            int documentTypeId = await _lookupService.GetDocumentTypeIdAsync(conn, itemDescription, txn);

            string documentNumber = await _txnService.GenerateDocumentNumber(conn, documentTypeId, txn);
            int intDocNumber = int.TryParse(documentNumber.Split('/').LastOrDefault(), out var dn) ? dn : 1;

            var transactionId = Guid.NewGuid();
            int processingMonth = await _txnService.GetProcessingMonth(conn, 1, txn);
            var (fyYear, fyPeriod) = _txnService.GetFinancialPeriodForDate(revalutionDate);

            int? debitVoteId = mscoaConfig?.DebitVoteId;
            int? creditVoteId = mscoaConfig?.CreditVoteId;
            int? offsetVoteId = mscoaConfig?.OffsetVoteId;
            int? reserveVoteId = mscoaConfig?.ReserveVoteId;

            int journalId = await _txnService.InsertJournalAsset(conn, txn,
                finYear, processingMonth, transactionId, journalTransactionTypeId,
                revalutionDate, debitVoteId, creditVoteId, surplusAmount,
                documentNumber, intDocNumber, assetRegId,
                scoaFundsId: mscoaConfig?.DebitScoaFundId,
                scoaRegionId: mscoaConfig?.DebitScoaRegionId,
                scoaCostingId: mscoaConfig?.DebitScoaCostingId,
                scoaFunctionId: mscoaConfig?.DebitScoaFunctionId,
                scoaItemId: mscoaConfig?.DebitScoaItemId,
                divisionId: mscoaConfig?.DebitDivisionId,
                itemDescription: itemDescription);

            bool postGain = surplusAmount >= 0;
            bool postLoss = surplusAmount < 0;

            var revalOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
                conn, txn, "ASSET_REVALUATION", documentNumber);

            if (postGain)
            {
                if (debitVoteId.HasValue && revaluationDebit > 0)
                {
                    await _txnService.InsertGeneralLedgerEntry(conn, txn,
                        revalutionDate, processingMonth, debitVoteId, finYear,
                        documentTypeId, itemDescription, documentNumber,
                        debit: revaluationDebit, credit: null, matchTranGuid: transactionId,
                        journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                        scoaFundsId: mscoaConfig?.DebitScoaFundId, scoaRegionId: mscoaConfig?.DebitScoaRegionId,
                        scoaCostingId: mscoaConfig?.DebitScoaCostingId,
                        scoaProjectId: mscoaConfig?.DebitPlanProjectId, scoaFunctionId: mscoaConfig?.DebitScoaFunctionId,
                        scoaItemId: mscoaConfig?.DebitScoaItemId ?? 0,
                        divisionId: mscoaConfig?.DebitDivisionId,
                        projectId: mscoaConfig?.DebitPlanProjectId, planProjectItemId: mscoaConfig?.DebitPlanProjectItemId,
                            outboxId: revalOutboxId);
                }

                if (creditVoteId.HasValue && revaluationGainCt > 0)
                {
                    await _txnService.InsertGeneralLedgerEntry(conn, txn,
                        revalutionDate, processingMonth, creditVoteId, finYear,
                        documentTypeId, itemDescription, documentNumber,
                        debit: null, credit: revaluationGainCt, matchTranGuid: transactionId,
                        journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                        scoaFundsId: mscoaConfig?.CreditScoaFundId, scoaRegionId: mscoaConfig?.CreditScoaRegionId,
                        scoaCostingId: mscoaConfig?.CreditScoaCostingId,
                        scoaProjectId: mscoaConfig?.CreditPlanProjectId, scoaFunctionId: mscoaConfig?.CreditScoaFunctionId,
                        scoaItemId: mscoaConfig?.CreditScoaItemId ?? 0,
                        divisionId: mscoaConfig?.CreditDivisionId,
                        projectId: mscoaConfig?.CreditPlanProjectId, planProjectItemId: mscoaConfig?.CreditPlanProjectItemId,
                            outboxId: revalOutboxId);
                }

                if (depreciationAdjustment > 0 && offsetVoteId.HasValue)
                {
                    await _txnService.InsertGeneralLedgerEntry(conn, txn,
                        revalutionDate, processingMonth, offsetVoteId, finYear,
                        documentTypeId, itemDescription + " - DepreciationAdjustment", documentNumber,
                        debit: null, credit: depreciationAdjustment, matchTranGuid: transactionId,
                        journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                        scoaFundsId: mscoaConfig?.OffsetScoaFundId, scoaRegionId: mscoaConfig?.OffsetScoaRegionId,
                        scoaCostingId: mscoaConfig?.OffsetScoaCostingId,
                        scoaProjectId: mscoaConfig?.OffsetPlanProjectId, scoaFunctionId: mscoaConfig?.OffsetScoaFunctionId,
                        scoaItemId: mscoaConfig?.OffsetScoaItemId ?? 0,
                        divisionId: mscoaConfig?.OffsetDivisionId,
                        projectId: mscoaConfig?.OffsetPlanProjectId, planProjectItemId: mscoaConfig?.OffsetPlanProjectItemId,
                            outboxId: revalOutboxId);
                }
            }

            if (postLoss)
            {
                if (revaluationGainDt > 0 && creditVoteId.HasValue)
                {
                    await _txnService.InsertGeneralLedgerEntry(conn, txn,
                        revalutionDate, processingMonth, creditVoteId, finYear,
                        documentTypeId, itemDescription, documentNumber,
                        debit: revaluationGainDt, credit: null, matchTranGuid: transactionId,
                        journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                        scoaFundsId: mscoaConfig?.CreditScoaFundId, scoaRegionId: mscoaConfig?.CreditScoaRegionId,
                        scoaCostingId: mscoaConfig?.CreditScoaCostingId,
                        scoaProjectId: mscoaConfig?.CreditPlanProjectId, scoaFunctionId: mscoaConfig?.CreditScoaFunctionId,
                        scoaItemId: mscoaConfig?.CreditScoaItemId ?? 0,
                        divisionId: mscoaConfig?.CreditDivisionId,
                        projectId: mscoaConfig?.CreditPlanProjectId, planProjectItemId: mscoaConfig?.CreditPlanProjectItemId,
                            outboxId: revalOutboxId);
                }

                if (revaluationLoss > 0 && reserveVoteId.HasValue)
                {
                    await _txnService.InsertGeneralLedgerEntry(conn, txn,
                        revalutionDate, processingMonth, reserveVoteId, finYear,
                        documentTypeId, itemDescription, documentNumber,
                        debit: revaluationLoss, credit: null, matchTranGuid: transactionId,
                        journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                        scoaFundsId: mscoaConfig?.ReserveScoaFundId, scoaRegionId: mscoaConfig?.ReserveScoaRegionId,
                        scoaCostingId: mscoaConfig?.ReserveScoaCostingId,
                        scoaProjectId: mscoaConfig?.ReservePlanProjectId, scoaFunctionId: mscoaConfig?.ReserveScoaFunctionId,
                        scoaItemId: mscoaConfig?.ReserveScoaItemId ?? 0,
                        divisionId: mscoaConfig?.ReserveDivisionId,
                        projectId: mscoaConfig?.ReservePlanProjectId, planProjectItemId: mscoaConfig?.ReservePlanProjectItemId,
                            outboxId: revalOutboxId);
                }

                if (revaluationCredit > 0 && offsetVoteId.HasValue)
                {
                    await _txnService.InsertGeneralLedgerEntry(conn, txn,
                        revalutionDate, processingMonth, offsetVoteId, finYear,
                        documentTypeId, itemDescription, documentNumber,
                        debit: null, credit: revaluationCredit, matchTranGuid: transactionId,
                        journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                        scoaFundsId: mscoaConfig?.OffsetScoaFundId, scoaRegionId: mscoaConfig?.OffsetScoaRegionId,
                        scoaCostingId: mscoaConfig?.OffsetScoaCostingId,
                        scoaProjectId: mscoaConfig?.OffsetPlanProjectId, scoaFunctionId: mscoaConfig?.OffsetScoaFunctionId,
                        scoaItemId: mscoaConfig?.OffsetScoaItemId ?? 0,
                        divisionId: mscoaConfig?.OffsetDivisionId,
                        projectId: mscoaConfig?.OffsetPlanProjectId, planProjectItemId: mscoaConfig?.OffsetPlanProjectItemId,
                            outboxId: revalOutboxId);
                }

                if (depreciationAdjustment < 0 && offsetVoteId.HasValue)
                {
                    await _txnService.InsertGeneralLedgerEntry(conn, txn,
                        revalutionDate, processingMonth, offsetVoteId, finYear,
                        documentTypeId, itemDescription + " - DepreciationAdjustment", documentNumber,
                        debit: Math.Abs(depreciationAdjustment), credit: null, matchTranGuid: transactionId,
                        journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                        scoaFundsId: mscoaConfig?.OffsetScoaFundId, scoaRegionId: mscoaConfig?.OffsetScoaRegionId,
                        scoaCostingId: mscoaConfig?.OffsetScoaCostingId,
                        scoaProjectId: mscoaConfig?.OffsetPlanProjectId, scoaFunctionId: mscoaConfig?.OffsetScoaFunctionId,
                        scoaItemId: mscoaConfig?.OffsetScoaItemId ?? 0,
                        divisionId: mscoaConfig?.OffsetDivisionId,
                        projectId: mscoaConfig?.OffsetPlanProjectId, planProjectItemId: mscoaConfig?.OffsetPlanProjectItemId,
                            outboxId: revalOutboxId);
                }
            }

            int revalTransTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""ReferenceData_ID"", 0) FROM ""Const_ReferenceData_sys""
                WHERE ""Description"" = 'Revaluation' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
            if (revalTransTypeId == 0) revalTransTypeId = 5;

            var existingAccReval = await conn.QueryFirstOrDefaultAsync<decimal?>(@"
                SELECT ""AccumulatedRevaluation"" FROM ""Asset_Register_Transactions""
                WHERE ""AssetRegisterItem_ID"" = @assetRegId
                ORDER BY ""ID"" DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", new { assetRegId }, txn);
            decimal accRevalFromTxn = existingAccReval ?? 0m;

            var assetLifeData = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ""UsefulLifeMonthComponent"", ""RemainingUsefulLife""
                FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId", new { assetRegId }, txn);
            decimal? originalUsefulLife = assetLifeData?.UsefulLifeMonthComponent;

            decimal? rulToWrite = usefulLife > 0 ? usefulLife : (decimal?)(assetLifeData?.RemainingUsefulLife ?? 0m);

            await _txnService.UpsertAssetRegisterTransaction(conn, txn,
                assetRegId, revalTransTypeId, revalutionDate,
                fyYear, fyPeriod, transactionId, documentTypeId,
                revaluationValue: surplusAmount,
                currentValue: revalautionAmt,
                usefulLife: originalUsefulLife,
                remainingUsefulLife: rulToWrite,
                accumulatedRevaluation: accRevalFromTxn + surplusAmount,
                depreciationAdjustment: depreciationAdjustment,
                movementInRevaluationReserve: movementInRevalReserve);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items""
                SET ""CurrentAmount"" = CASE WHEN @revalautionAmt < 0 THEN 0 ELSE @revalautionAmt END,
                    ""Modifier_ID"" = @approvedBy,
                    ""RemainingUsefulLife"" = @rulToWrite
                WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { revalautionAmt, approvedBy = request.ApprovedBy, rulToWrite, assetRegId }, txn);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Revaluations""
                SET ""PostDateTime"" = GETDATE(), ""Approved"" = TRUE, ""ApprovedBy"" = @approvedBy, ""ApprovedDate"" = GETDATE()
                WHERE ""AssetRegisterID"" = @assetRegId AND (""Approved"" IS NULL OR ""Approved"" = FALSE)",
                new { approvedBy = request.ApprovedBy, assetRegId }, txn);

            await _txnService.PopulateTransactionSummarySingle(conn, txn, assetRegId, finYear, 1);

            await txn.CommitAsync();

            if (catchUpGlOutboxId.HasValue)
                await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(revalOutboxId, catchUpGlOutboxId.Value);
            else
                await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(revalOutboxId);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_WorkflowInstances""
                SET ""status"" = 'approved', ""completed_at"" = GETDATE()
                WHERE ""entity_type"" = 'revaluation' AND ""mssql_reference_id"" = @refId AND ""status"" IN ('pending', 'in_progress')",
                new { refId = id.ToString() });

            var revalTokens = await _emailService.BuildAssetBaseTokensAsync(conn, assetRegId);
            revalTokens["RevaluationDate"]        = revalutionDate.ToString("dd MMM yyyy");
            revalTokens["CostRevaluedAmount"]     = revalautionAmt.ToString("N2");
            revalTokens["SurplusAmount"]          = surplusAmount.ToString("N2");
            revalTokens["DepreciationAdjustment"] = depreciationAdjustment.ToString("N2");
            revalTokens["FinancialYear"]          = finYear;
            revalTokens["LastDepreciationDate"]   = "";
            revalTokens["MarketValue"]            = "";
            try
            {
                var revalSnap = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                    SELECT r.""DiffDepAcc"", r.""DiffBook"", r.""RevalModel"",
                           a.""AccumulatedDepreciationClosingBalance"",
                           a.""CarryingAmountClosingBalance"",
                           a.""RevaluationReserveClosingBalance"",
                           COALESCE(a.""MarketValue"", 0) AS ""MarketValue""
                    FROM ""Asset_Revaluations"" r
                    LEFT JOIN ""Asset_Register_Items"" a ON r.""AssetRegisterID"" = a.""AssetRegisterItem_ID""
                    WHERE r.""Asset_RevaluationsID"" = @id", new { id });
                if (revalSnap != null)
                {
                    revalTokens["AccumDepAdjustment"]        = Convert.ToDecimal(revalSnap.DiffDepAcc ?? 0m).ToString("N2");
                    revalTokens["FairValueAdjustment"]       = Convert.ToDecimal(revalSnap.DiffBook ?? 0m).ToString("N2");
                    revalTokens["ValuationModule"]           = Convert.ToString(revalSnap.RevalModel ?? 0) ?? "";
                    revalTokens["AccumulatedDepreciation"]   = Convert.ToDecimal(revalSnap.AccumulatedDepreciationClosingBalance ?? 0m).ToString("N2");
                    revalTokens["AdjustedCarryingAmount"]    = Convert.ToDecimal(revalSnap.CarryingAmountClosingBalance ?? 0m).ToString("N2");
                    revalTokens["CarryingAmountAtLastDep"]   = Convert.ToDecimal(revalSnap.CarryingAmountClosingBalance ?? 0m).ToString("N2");
                    revalTokens["RevaluationReserveBalance"] = Convert.ToDecimal(revalSnap.RevaluationReserveClosingBalance ?? 0m).ToString("N2");
                    revalTokens["RevaluationReserveAfter"]   = Convert.ToDecimal(revalSnap.RevaluationReserveClosingBalance ?? 0m).ToString("N2");
                    revalTokens["MarketValue"]               = Convert.ToDecimal(revalSnap.MarketValue ?? 0m).ToString("N2");
                }
                var lastDepRow = await conn.QueryFirstOrDefaultAsync<dynamic>(
                    @"SELECT MAX(""DepreciationDate"") AS last_dep FROM ""Asset_Depreciation"" WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                    new { assetRegId });
                if (lastDepRow?.last_dep is DateTime lastDepDt)
                    revalTokens["LastDepreciationDate"] = lastDepDt.ToString("dd MMM yyyy");
            }
            catch { }
            _ = _emailService.SendTransactionEmailsAsync("Revaluation", revalTokens);
            return Ok(new { success = 1, journalId, documentNumber, transactionId });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            Console.Error.WriteLine($"[REVALUATION APPROVAL ERROR] id={id}: {ex}");
            return StatusCode(500, new { error = "Approval failed", details = ex.Message });
        }
    }

    private async Task<Guid> PostCatchUpDepreciationForRevaluation(DbConnection conn, DbTransaction txn,
        int assetRegId, decimal catchUpAmount, DateTime transactionDate, string finYear, int catchUpDays, dynamic assetData)
    {
        var mscoaConfig = await _txnService.LookupMscoaConfig(conn, assetRegId, "Depreciation", finYear, txn);
        var depConfigErrors = _txnService.ValidateMscoaConfig(mscoaConfig, "Depreciation", assetRegId);
        if (depConfigErrors.Count > 0)
            throw new InvalidOperationException($"Catch-up depreciation GL posting failed: {string.Join("; ", depConfigErrors)}");

        int depJournalTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
            SELECT COALESCE(""AssetJournalTransactionType_ID"", 0) FROM ""Const_AssetJournalTransactionType_Sys""
            WHERE ""AssetJournalTransactionDesc"" = 'Asset Depreciation' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);

        int depDocTypeId = await _lookupService.GetDocumentTypeIdAsync(conn, "Asset Depreciation", txn);

        string depDocNumber = await _txnService.GenerateDocumentNumber(conn, depDocTypeId, txn);
        int depIntDocNum = int.TryParse(depDocNumber.Split('/').LastOrDefault(), out var dn2) ? dn2 : 1;

        var depTxnId = Guid.NewGuid();
        int processingMonth = await _txnService.GetProcessingMonth(conn, 1, txn);
        var (fyYear, fyPeriod) = _txnService.GetFinancialPeriodForDate(transactionDate);

        int depJournalId = await _txnService.InsertJournalAsset(conn, txn,
            finYear, processingMonth, depTxnId, depJournalTypeId,
            transactionDate, mscoaConfig?.DebitVoteId, mscoaConfig?.CreditVoteId, catchUpAmount,
            depDocNumber, depIntDocNum, assetRegId,
            scoaFundsId: mscoaConfig?.DebitScoaFundId,
            scoaRegionId: mscoaConfig?.DebitScoaRegionId,
            scoaCostingId: mscoaConfig?.DebitScoaCostingId,
            scoaFunctionId: mscoaConfig?.DebitScoaFunctionId,
            scoaItemId: mscoaConfig?.DebitScoaItemId,
            divisionId: mscoaConfig?.DebitDivisionId,
            itemDescription: "Asset Depreciation - Catch-up to Revaluation Date",
            depRunType: "CatchUp");

        var revalCatchUpOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
            conn, txn, "ASSET_DEPRECIATION", depDocNumber);

        if (mscoaConfig?.DebitVoteId != null)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, mscoaConfig.DebitVoteId, finYear,
                depDocTypeId, "Asset Depreciation - Catch-up to Revaluation Date", depDocNumber,
                debit: catchUpAmount, credit: null, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: mscoaConfig.DebitScoaFundId, scoaRegionId: mscoaConfig.DebitScoaRegionId,
                scoaCostingId: mscoaConfig.DebitScoaCostingId,
                scoaProjectId: mscoaConfig.DebitPlanProjectId, scoaFunctionId: mscoaConfig.DebitScoaFunctionId,
                scoaItemId: mscoaConfig.DebitScoaItemId ?? 0,
                divisionId: mscoaConfig.DebitDivisionId,
                projectId: mscoaConfig.DebitPlanProjectId, planProjectItemId: mscoaConfig.DebitPlanProjectItemId,
                    outboxId: revalCatchUpOutboxId);
        }

        if (mscoaConfig?.CreditVoteId != null)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, mscoaConfig.CreditVoteId, finYear,
                depDocTypeId, "Asset Depreciation - Catch-up to Revaluation Date", depDocNumber,
                debit: null, credit: catchUpAmount, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: mscoaConfig.CreditScoaFundId, scoaRegionId: mscoaConfig.CreditScoaRegionId,
                scoaCostingId: mscoaConfig.CreditScoaCostingId,
                scoaProjectId: mscoaConfig.CreditPlanProjectId, scoaFunctionId: mscoaConfig.CreditScoaFunctionId,
                scoaItemId: mscoaConfig.CreditScoaItemId ?? 0,
                divisionId: mscoaConfig.CreditDivisionId,
                projectId: mscoaConfig.CreditPlanProjectId, planProjectItemId: mscoaConfig.CreditPlanProjectItemId,
                    outboxId: revalCatchUpOutboxId);
        }

        int depTransTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
            SELECT COALESCE(""ReferenceData_ID"", 0) FROM ""Const_ReferenceData_sys""
            WHERE ""Description"" = 'Depreciation' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
        if (depTransTypeId == 0) depTransTypeId = 1;

        decimal currentAccDep = (decimal)(assetData.AccDepreciation ?? 0m);
        decimal newAccDep = currentAccDep + catchUpAmount;
        decimal currentCarrying = (decimal)(assetData.CarryingValue ?? 0m);
        decimal newCarrying = currentCarrying - catchUpAmount;
        decimal currentRul = (decimal)(assetData.RemainingUsefulLife ?? 0m);
        decimal? origUsefulLife = assetData.UsefulLifeMonthComponent;
        decimal monthsConsumed = catchUpDays > 0 ? Math.Round((decimal)catchUpDays / 30.44m, 8) : 0m;
        decimal adjustedRul = currentRul - monthsConsumed;
        if (adjustedRul < 0) adjustedRul = 0;

        decimal revalReserve = (decimal)(assetData.RevaluationReserve ?? 0m);
        decimal depreciationOffset = 0m;
        if (revalReserve > 0 && currentRul > 0)
        {
            decimal totalRemainingDays = currentRul / 12m * 365m;
            if (totalRemainingDays > 0)
            {
                depreciationOffset = Math.Round(revalReserve / totalRemainingDays * catchUpDays, 2);
                if (depreciationOffset > revalReserve) depreciationOffset = revalReserve;
            }
        }

        decimal postedOffset = 0m;
        if (depreciationOffset > 0 && mscoaConfig?.OffsetVoteId != null && mscoaConfig?.ReserveVoteId != null)
        {
            postedOffset = depreciationOffset;

            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, mscoaConfig.ReserveVoteId, finYear,
                depDocTypeId, "Asset Depreciation Offset - Catch-up", depDocNumber,
                debit: postedOffset, credit: null, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: mscoaConfig.ReserveScoaFundId, scoaRegionId: mscoaConfig.ReserveScoaRegionId,
                scoaCostingId: mscoaConfig.ReserveScoaCostingId,
                scoaProjectId: mscoaConfig.ReservePlanProjectId, scoaFunctionId: mscoaConfig.ReserveScoaFunctionId,
                scoaItemId: mscoaConfig.ReserveScoaItemId ?? 0,
                divisionId: mscoaConfig.ReserveDivisionId,
                projectId: mscoaConfig.ReservePlanProjectId, planProjectItemId: mscoaConfig.ReservePlanProjectItemId,
                    outboxId: revalCatchUpOutboxId);

            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, mscoaConfig.OffsetVoteId, finYear,
                depDocTypeId, "Asset Depreciation Offset - Catch-up", depDocNumber,
                debit: null, credit: postedOffset, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: mscoaConfig.OffsetScoaFundId, scoaRegionId: mscoaConfig.OffsetScoaRegionId,
                scoaCostingId: mscoaConfig.OffsetScoaCostingId,
                scoaProjectId: mscoaConfig.OffsetPlanProjectId, scoaFunctionId: mscoaConfig.OffsetScoaFunctionId,
                scoaItemId: mscoaConfig.OffsetScoaItemId ?? 0,
                divisionId: mscoaConfig.OffsetDivisionId,
                projectId: mscoaConfig.OffsetPlanProjectId, planProjectItemId: mscoaConfig.OffsetPlanProjectItemId,
                    outboxId: revalCatchUpOutboxId);
        }

        await _txnService.UpsertAssetRegisterTransaction(conn, txn,
            assetRegId, depTransTypeId, transactionDate,
            fyYear, fyPeriod, depTxnId, depDocTypeId,
            depreciationValue: catchUpAmount,
            currentValue: newCarrying,
            accumulatedDepreciation: newAccDep,
            usefulLife: origUsefulLife,
            remainingUsefulLife: adjustedRul,
            depreciationOffset: postedOffset > 0 ? postedOffset : (decimal?)null);

        var scheduleId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_DepreciationSchedule"" (""FinYear"", ""RunDate"", ""RunType_ID"", ""RunStatus_ID"",
                ""DateCaptured"", ""CapturerID"", ""ScheduledDate"", ""StatusID"", ""TotalAssets"")
            VALUES (@finYear, GETDATE(), 2, 2, GETDATE(), 1, @transactionDate, 2, 1)
            ON CONFLICT (""FinYear"") DO UPDATE SET ""RunDate"" = GETDATE()
            RETURNING ""Asset_DepreciationSchedule_ID""",
            new { finYear, transactionDate }, txn);

        var scheduleItemId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_DepreciationSchedule_Item""
                (""Asset_DepreciationSchedule_ID"", ""ScheduledDate"",
                 ""AssetRegisterItem_ID"", ""AssetType_ID"", ""AssetCategory_ID"", ""Asset_SubCategory_ID"",
                 ""MeasurementType_ID"", ""AssetStatus_ID"", ""StatusID"", ""FinancialPeriod"", ""FinYear"")
            VALUES (@scheduleId, @transactionDate,
                    @assetRegId, @assetTypeId, @assetCategoryId, @assetSubCategoryId,
                    @measurementTypeId, @assetStatusId, 2, @fyPeriod, @finYear)
            RETURNING ""Asset_DepreciationSchedule_Item_ID""",
            new {
                scheduleId, transactionDate, assetRegId,
                assetTypeId = (int)(assetData.AssetType_ID),
                assetCategoryId = (int)(assetData.AssetCategory_ID),
                assetSubCategoryId = (int)(assetData.Asset_SubCategory_ID),
                measurementTypeId = (int)(assetData.MeasurementType_ID),
                assetStatusId = (int)(assetData.AssetStatus_ID),
                fyPeriod, finYear
            }, txn);

        await conn.ExecuteAsync(@"
            INSERT INTO ""Asset_Depreciation"" (""AssetRegisterItem_ID"", ""DepreciationDate"",
                ""DepreciationAmount"", ""AccumulatedDepreciation"", ""CarryingAmount"",
                ""RunType_ID"", ""RunStatus_ID"", ""FinYear"", ""MonthID"",
                ""Depreciation_ScheduledItemID"", ""DaysFromLastRun"", ""DateCaptured"", ""CapturerID"", ""IsApproved"")
            VALUES (@assetRegId, @transactionDate, @catchUpAmount, @newAccDep, @newCarrying,
                2, 2, @finYear, @fyPeriod, @scheduleItemId, @catchUpDays, GETDATE(), 1, 1)",
            new { assetRegId, transactionDate, catchUpAmount, newAccDep, newCarrying,
                  finYear, fyPeriod, scheduleItemId, catchUpDays }, txn);

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_Register_Items""
            SET ""AccumulatedDepreciationClosingBalance"" = COALESCE(""AccumulatedDepreciationClosingBalance"", 0) + @catchUpAmount,
                ""AccumulatedDepreciationCurrentYear"" = COALESCE(""AccumulatedDepreciationCurrentYear"", 0) + @catchUpAmount,
                ""RevaluationReserveClosingBalance"" = COALESCE(""RevaluationReserveClosingBalance"", 0) - @postedOffset,
                ""CarryingAmountClosingBalance"" = COALESCE(""CarryingAmountClosingBalance"", 0) - @catchUpAmount,
                ""CurrentAmount"" = COALESCE(""CurrentAmount"", 0) - @catchUpAmount,
                ""RemainingUsefulLife"" = @adjustedRul
            WHERE ""AssetRegisterItem_ID"" = @assetRegId",
            new { catchUpAmount, postedOffset, adjustedRul, assetRegId }, txn);

        return revalCatchUpOutboxId;
    }

    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] RevaluationRejectRequest? request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_Revaluations""
            SET ""Approved"" = FALSE, ""RejectedBy"" = @rejectedBy, ""RejectedDate"" = GETDATE(), ""RejectionReason"" = @reason
            WHERE ""Asset_RevaluationsID"" = @id AND (""Approved"" IS NULL OR ""Approved"" = FALSE) AND ""PostDateTime"" IS NULL",
            new { id, rejectedBy = request?.RejectedBy ?? 0, reason = request?.Reason ?? "" });
        if (rows == 0) return NotFound(new { error = "Revaluation record not found or already processed" });

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WorkflowInstances""
            SET ""status"" = 'rejected', ""completed_at"" = GETDATE()
            WHERE ""entity_type"" = 'revaluation' AND ""mssql_reference_id"" = @refId AND ""status"" IN ('pending', 'in_progress')",
            new { refId = id.ToString() });

        return Ok(new { success = 1 });
    }
}

public class RevaluationApprovalRequest
{
    public int ApprovedBy { get; set; }
    public decimal? UsefulLife { get; set; }
}

public class RevaluationRejectRequest
{
    public int RejectedBy { get; set; }
    public string? Reason { get; set; }
}
