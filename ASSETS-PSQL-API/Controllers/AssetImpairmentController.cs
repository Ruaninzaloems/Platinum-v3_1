using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data.Common;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-impairments")]
public class AssetImpairmentController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;
    private readonly LookupService _lookupService;
    private readonly EmailService _emailService;

    public AssetImpairmentController(DbConnectionFactory db, TransactionService txnService, LookupService lookupService, EmailService emailService)
    {
        _db = db;
        _txnService = txnService;
        _lookupService = lookupService;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear, [FromQuery] int? assetRegisterItemId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT i.""Impairment_ID"" AS ""AssetImpairment_ID"", i.""Asset_ItemID"" AS ""AssetRegisterItem_ID"", i.""Asset_ItemID"", i.""ImpairmentDate"", i.""ImpairmentAmount"", i.""PreviousCarryingAmount"", i.""NewCarryingAmount"", i.""RemainingUsefulLife"", i.""Reason"", i.""Status"", i.""FinYear"", i.""CatchUpDepreciation"", i.""CatchUpDays"", i.""Approved"", i.""ApprovedDate"", i.""ApprovedBy"", i.""IsRejected"", i.""DateCaptured"", i.""CapturerID"", i.""DateModified"", i.""ModifierID"",
                COALESCE(i.""IsReversal"",
                (SELECT MAX(pp.""IsReversal"") FROM ""Asset_ImpairmentPostings"" pp
                 WHERE pp.""Impairment_ID"" = i.""Impairment_ID""), 0
            ) AS ""IsReversal""
            FROM ""Asset_Impairment"" i
            WHERE 1=1";
        if (!string.IsNullOrEmpty(finYear)) sql += @" AND i.""FinYear"" = @finYear";
        if (assetRegisterItemId.HasValue) sql += @" AND i.""Asset_ItemID"" = @assetRegisterItemId";
        sql += @" ORDER BY i.""Impairment_ID"" DESC";
        var items = await conn.QueryAsync<AssetImpairment>(sql, new { finYear, assetRegisterItemId });
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetImpairment>(@"SELECT ""Impairment_ID"" AS ""AssetImpairment_ID"", ""Asset_ItemID"" AS ""AssetRegisterItem_ID"", ""Asset_ItemID"", ""ImpairmentDate"", ""ImpairmentAmount"", ""PreviousCarryingAmount"", ""NewCarryingAmount"", ""RemainingUsefulLife"", ""Reason"", ""Status"", ""FinYear"", ""CatchUpDepreciation"", ""CatchUpDays"", ""Approved"", ""ApprovedDate"", ""ApprovedBy"", ""IsRejected"", ""IsReversal"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"" FROM ""Asset_Impairment"" WHERE ""Impairment_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Impairment record not found" }) : Ok(item);
    }

    [HttpGet("{id:int}/detail")]
    public async Task<IActionResult> GetDetail(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var imp = await conn.QueryFirstOrDefaultAsync<AssetImpairment>(
            @"SELECT ""Impairment_ID"" AS ""AssetImpairment_ID"", ""Asset_ItemID"" AS ""AssetRegisterItem_ID"", ""Asset_ItemID"", ""ImpairmentDate"", ""ImpairmentAmount"", ""PreviousCarryingAmount"", ""NewCarryingAmount"", ""RemainingUsefulLife"", ""Reason"", ""Status"", ""FinYear"", ""CatchUpDepreciation"", ""CatchUpDays"", ""Approved"", ""ApprovedDate"", ""ApprovedBy"", ""IsRejected"", ""IsReversal"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"" FROM ""Asset_Impairment"" WHERE ""Impairment_ID"" = @id", new { id });
        if (imp == null) return NotFound(new { error = "Impairment record not found" });

        int assetId = imp.AssetRegisterItem_ID ?? imp.Asset_ItemID ?? 0;
        DateTime txnDate = imp.ImpairmentDate ?? DateTime.Today;

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

        decimal catchUpDep = imp.CatchUpDepreciation ?? 0m;
        int catchUpDays = imp.CatchUpDays ?? 0;
        decimal dailyRate = catchUpDays > 0 ? Math.Round(catchUpDep / catchUpDays, 2) : 0m;
        decimal carryingBeforeCatchUp = projected.CarryingAmount;
        decimal adjustedCarrying = Math.Max(0, carryingBeforeCatchUp - catchUpDep);
        decimal impAmt = imp.ImpairmentAmount ?? 0m;
        decimal revalReserve = projected.RevaluationReserve;
        decimal fromRevalReserve = Math.Min(impAmt, revalReserve);
        decimal impairmentLossToP_L = Math.Max(0, impAmt - revalReserve);
        bool isReversal = (imp.IsReversal ?? 0) == 1;
        decimal newCarrying = isReversal
            ? adjustedCarrying + impAmt
            : Math.Max(0, adjustedCarrying - impAmt);

        return Ok(new
        {
            transaction = imp,
            asset,
            projected = new
            {
                carryingBeforeCatchUp,
                accumulatedDepreciation = projected.AccumulatedDepreciation,
                revalReserve,
                adjustedCarrying,
                newCarrying,
                dailyRate,
                catchUpDays,
                catchUpDep,
                fromRevalReserve,
                impairmentLossToP_L
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetImpairment? model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Where(e => e.Value?.Errors.Count > 0)
                .Select(e => new { field = e.Key, messages = e.Value!.Errors.Select(err => err.ErrorMessage + (err.Exception != null ? " | " + err.Exception.Message : "")).ToList() })
                .ToList();
            Request.Body.Position = 0;
            using var sr = new StreamReader(Request.Body);
            var rawBody = await sr.ReadToEndAsync();
            return BadRequest(new { error = "Validation failed", details = errors, rawBody });
        }
        if (model == null)
        {
            Request.Body.Position = 0;
            using var reader = new StreamReader(Request.Body);
            var rawBody = await reader.ReadToEndAsync();
            return BadRequest(new { error = "Model binding failed", rawBody });
        }
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var impApprovalMethod = await _txnService.GetApprovalMethod(conn);

        if (model.ImpairmentDate.HasValue && model.AssetRegisterItem_ID.HasValue)
        {
            if (impApprovalMethod == "Automated")
            {
                string txnKind = (model.IsReversal ?? 0) == 1 ? "reversal" : "impairment";
                bool duplicate = await _txnService.HasPendingTransactionInMonth(conn, txnKind, model.AssetRegisterItem_ID.Value, model.ImpairmentDate.Value);
                if (duplicate)
                    return BadRequest(new { error = $"An {txnKind} already exists for this asset in {model.ImpairmentDate.Value:MMMM yyyy}. Only one {txnKind} per asset per month is allowed in Automated mode." });
            }
            else
            {
                var pendingType = await _txnService.GetPendingTransactionTypeForAsset(conn, model.AssetRegisterItem_ID.Value, model.ImpairmentDate.Value);
                if (pendingType != null)
                    return BadRequest(new { error = $"There is an unapproved {pendingType} for this asset in {model.ImpairmentDate.Value:MMMM yyyy}. Please approve or reject it before capturing a new transaction." });
            }

            // Cutoff validation — after duplicate checks, transaction must be on or before the next scheduled run's month-end date
            var (impCutoffDate, _, _) = await _txnService.GetNextRunCutoffDateAsync(conn);
            if (model.ImpairmentDate.Value.Date > impCutoffDate.Date)
                return BadRequest(new { error = $"Transaction date {model.ImpairmentDate.Value:dd MMM yyyy} exceeds the next scheduled run's month-end date of {impCutoffDate:dd MMM yyyy}. Please capture a date on or before this cutoff." });

            if ((model.IsReversal ?? 0) == 0)
            {
                var projValues = await _txnService.GetEffectiveAssetValues(conn, model.AssetRegisterItem_ID.Value, model.ImpairmentDate.Value);
                model.PreviousCarryingAmount = projValues.CarryingAmount;
                decimal catchUp = model.CatchUpDepreciation ?? 0m;
                decimal impAmt = model.ImpairmentAmount ?? 0m;
                model.NewCarryingAmount = projValues.CarryingAmount - catchUp - impAmt;
                if (model.NewCarryingAmount < 0) model.NewCarryingAmount = 0;
            }
        }

        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_Impairment"" (""Asset_ItemID"", ""ImpairmentDate"", ""ImpairmentAmount"", ""PreviousCarryingAmount"", ""NewCarryingAmount"", ""RemainingUsefulLife"", ""Reason"", ""Status"", ""FinYear"", ""CatchUpDepreciation"", ""CatchUpDays"", ""IsReversal"", ""DateCaptured"", ""CapturerID"")
            VALUES (COALESCE(@Asset_ItemID, @AssetRegisterItem_ID), @ImpairmentDate, @ImpairmentAmount, @PreviousCarryingAmount, @NewCarryingAmount, @RemainingUsefulLife, @Reason, COALESCE(@Status, 'Pending'), @FinYear, @CatchUpDepreciation, @CatchUpDays, COALESCE(@IsReversal, 0), GETDATE(), @CapturerID)
            RETURNING ""Impairment_ID""", model);
        model.AssetImpairment_ID = id;

        if (impApprovalMethod == "Automated" && model.AssetRegisterItem_ID.HasValue && model.ImpairmentDate.HasValue)
            await _txnService.RecalculatePendingAfterDate(conn, model.AssetRegisterItem_ID.Value, model.ImpairmentDate.Value, model.FinYear);

        string impEntityType = (model.IsReversal == 1) ? "impairment_reversal" : "impairment";
        var defId = await conn.QueryFirstOrDefaultAsync<int?>(@"
            SELECT ""id"" FROM ""Asset_WorkflowDefinitions"" WHERE ""entity_type"" = @impEntityType AND ""is_active"" = TRUE OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            new { impEntityType });
        if (defId.HasValue)
        {
            var wfData = System.Text.Json.JsonSerializer.Serialize(new { assetId = model.AssetRegisterItem_ID, impairmentAmount = model.ImpairmentAmount, previousCarryingAmount = model.PreviousCarryingAmount, newCarryingAmount = model.NewCarryingAmount, reason = model.Reason, isReversal = model.IsReversal });
            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_WorkflowInstances"" (""definition_id"", ""entity_type"", ""entity_id"", ""current_step"", ""status"", ""initiated_by"", ""data"", ""mssql_reference_id"")
                VALUES (@defId, @impEntityType, @entityId, 1, 'pending', 1, @wfData::jsonb, @refId)",
                new { defId = defId.Value, impEntityType, entityId = id.ToString(), wfData, refId = id.ToString() });
        }

        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetImpairment model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_Impairment""
            SET ""ImpairmentDate"" = @ImpairmentDate, ""ImpairmentAmount"" = @ImpairmentAmount, ""PreviousCarryingAmount"" = @PreviousCarryingAmount,
                ""NewCarryingAmount"" = @NewCarryingAmount, ""RemainingUsefulLife"" = @RemainingUsefulLife, ""Reason"" = @Reason, ""Status"" = @Status, ""FinYear"" = @FinYear, ""DateModified"" = GETDATE(), ""ModifierID"" = @ModifierID
            WHERE ""Impairment_ID"" = @id", new { model.ImpairmentDate, model.ImpairmentAmount, model.PreviousCarryingAmount, model.NewCarryingAmount, model.RemainingUsefulLife, model.Reason, model.Status, model.FinYear, model.ModifierID, id });
        return rows == 0 ? NotFound(new { error = "Impairment record not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Asset_Impairment"" WHERE ""Impairment_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Impairment record not found" }) : Ok(new { success = 1 });
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ImpairmentApprovalRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            var impairment = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ""Impairment_ID"" AS ""AssetImpairment_ID"", ""Asset_ItemID"" AS ""AssetRegID"",
                       ""ImpairmentDate"", ""NewCarryingAmount"", ""ImpairmentAmount"", ""FinYear"", ""RemainingUsefulLife"",
                       COALESCE(""Approved"", 0) AS ""Approved"",
                       COALESCE(""CatchUpDepreciation"", 0) AS ""CatchUpDepreciation"",
                       COALESCE(""CatchUpDays"", 0) AS ""CatchUpDays"",
                       COALESCE(""Reason"", '') AS ""Reason""
                FROM ""Asset_Impairment"" WHERE ""Impairment_ID"" = @id", new { id }, txn);

            if (impairment is null)
                return NotFound(new { error = "Impairment record not found" });

            if ((int)(impairment.Approved ?? 0) == 1)
            {
                await txn.RollbackAsync();
                return Ok(new { success = 1, alreadyApproved = 1, message = "Impairment already approved" });
            }

            int assetRegId = (int)(impairment.AssetRegID ?? 0);
            string finYear = (string)(impairment.FinYear ?? _txnService.GetCurrentFinancialPeriod().year);
            DateTime impairmentDate = (DateTime)(impairment.ImpairmentDate ?? DateTime.Now);
            decimal newCarryingValue = (decimal)(impairment.NewCarryingAmount ?? 0m);
            decimal impairmentAmount = (decimal)(impairment.ImpairmentAmount ?? 0m);
            decimal catchUpDepreciation = (decimal)(impairment.CatchUpDepreciation ?? 0m);
            int catchUpDays = (int)(impairment.CatchUpDays ?? 0);
            decimal newRemainingUsefulLife = (decimal)(impairment.RemainingUsefulLife ?? 0m);

            Guid? catchUpGlOutboxId = null;
            if (catchUpDepreciation > 0)
            {
                catchUpGlOutboxId = await PostCatchUpDepreciation(conn, txn, assetRegId, catchUpDepreciation, impairmentDate, finYear, catchUpDays);
            }

            var unapprovedPostings = (await conn.QueryAsync<dynamic>(@"
                SELECT * FROM ""Asset_ImpairmentPostings""
                WHERE ""Impairment_ID"" = @id AND COALESCE(""Approved"", 0) = 0
                ORDER BY ""Id"" DESC", new { id }, txn)).ToList();

            bool isReversal = unapprovedPostings.Any() && (short)(unapprovedPostings.First().IsReversal ?? (short)0) == 1;

            string itemDescription = isReversal ? "Asset Reversal of Impairment" : "Asset Impairment";
            string transactionTypeName = isReversal ? "Impairment Reversal" : "Impairment";

            var mscoaConfig = await _txnService.LookupMscoaConfig(conn, assetRegId, transactionTypeName, finYear, txn);
            var configErrors = _txnService.ValidateMscoaConfig(mscoaConfig, transactionTypeName, assetRegId);
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
            var (fyYear, fyPeriod) = _txnService.GetFinancialPeriodForDate(impairmentDate);

            decimal impairmentTotal = isReversal ? 0 - impairmentAmount : impairmentAmount;
            decimal revaluationReserveAmount = 0m;

            foreach (var posting in unapprovedPostings)
            {
                decimal revalAmt = (decimal)(posting.AmountFromRevaluationReserve ?? 0m);
                revaluationReserveAmount += revalAmt;
            }

            if (isReversal)
            {
                revaluationReserveAmount = 0 - revaluationReserveAmount;
            }

            var impOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
                conn, txn, "ASSET_IMPAIRMENT", documentNumber);

            if (revaluationReserveAmount != 0 && !isReversal)
            {
                if (mscoaConfig?.ReserveVoteId == null || mscoaConfig?.OffsetVoteId == null)
                {
                    var missingLegs = new List<string>();
                    if (mscoaConfig?.ReserveVoteId == null)
                        missingLegs.Add("Reserve (Revaluation Reserve) vote (CreditItem13_1 / Project13)");
                    if (mscoaConfig?.OffsetVoteId == null)
                        missingLegs.Add("Offset (Depreciation Reserve Transfer) vote (DebitItem12_1 / Project12)");
                    await txn.RollbackAsync();
                    return BadRequest(new { error = "GL posting configuration incomplete for revaluation reserve transfer", details = missingLegs });
                }
            }

            int? debitVoteId = mscoaConfig?.DebitVoteId;
            int? creditVoteId = mscoaConfig?.CreditVoteId;

            int journalId = await _txnService.InsertJournalAsset(conn, txn,
                finYear, processingMonth, transactionId, journalTransactionTypeId,
                impairmentDate, debitVoteId, creditVoteId, impairmentTotal,
                documentNumber, intDocNumber, assetRegId,
                scoaFundsId: mscoaConfig?.DebitScoaFundId,
                scoaRegionId: mscoaConfig?.DebitScoaRegionId,
                scoaCostingId: mscoaConfig?.DebitScoaCostingId,
                scoaFunctionId: mscoaConfig?.DebitScoaFunctionId,
                scoaItemId: mscoaConfig?.DebitScoaItemId,
                divisionId: mscoaConfig?.DebitDivisionId,
                itemDescription: itemDescription);

            if (debitVoteId.HasValue)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    impairmentDate, processingMonth, debitVoteId, finYear,
                    documentTypeId, itemDescription, documentNumber,
                    debit: impairmentTotal, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig?.DebitScoaFundId, scoaRegionId: mscoaConfig?.DebitScoaRegionId,
                    scoaCostingId: mscoaConfig?.DebitScoaCostingId,
                    scoaProjectId: mscoaConfig?.DebitPlanProjectId, scoaFunctionId: mscoaConfig?.DebitScoaFunctionId,
                    scoaItemId: mscoaConfig?.DebitScoaItemId ?? 0,
                    divisionId: mscoaConfig?.DebitDivisionId,
                    projectId: mscoaConfig?.DebitPlanProjectId, planProjectItemId: mscoaConfig?.DebitPlanProjectItemId,
                        outboxId: impOutboxId);
            }

            if (creditVoteId.HasValue)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    impairmentDate, processingMonth, creditVoteId, finYear,
                    documentTypeId, itemDescription, documentNumber,
                    debit: null, credit: impairmentTotal, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig?.CreditScoaFundId, scoaRegionId: mscoaConfig?.CreditScoaRegionId,
                    scoaCostingId: mscoaConfig?.CreditScoaCostingId,
                    scoaProjectId: mscoaConfig?.CreditPlanProjectId, scoaFunctionId: mscoaConfig?.CreditScoaFunctionId,
                    scoaItemId: mscoaConfig?.CreditScoaItemId ?? 0,
                    divisionId: mscoaConfig?.CreditDivisionId,
                    projectId: mscoaConfig?.CreditPlanProjectId, planProjectItemId: mscoaConfig?.CreditPlanProjectItemId,
                        outboxId: impOutboxId);
            }

            if (revaluationReserveAmount != 0 && !isReversal
                && mscoaConfig?.ReserveVoteId != null && mscoaConfig?.OffsetVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    impairmentDate, processingMonth, mscoaConfig.ReserveVoteId, finYear,
                    documentTypeId, itemDescription + " - Revaluation Reserve", documentNumber,
                    debit: revaluationReserveAmount, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.ReserveScoaFundId, scoaRegionId: mscoaConfig.ReserveScoaRegionId,
                    scoaCostingId: mscoaConfig.ReserveScoaCostingId,
                    scoaProjectId: mscoaConfig.ReservePlanProjectId, scoaFunctionId: mscoaConfig.ReserveScoaFunctionId,
                    scoaItemId: mscoaConfig.ReserveScoaItemId ?? 0,
                    divisionId: mscoaConfig.ReserveDivisionId,
                    projectId: mscoaConfig.ReservePlanProjectId, planProjectItemId: mscoaConfig.ReservePlanProjectItemId,
                        outboxId: impOutboxId);

                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    impairmentDate, processingMonth, mscoaConfig.OffsetVoteId, finYear,
                    documentTypeId, itemDescription + " - Revaluation Reserve", documentNumber,
                    debit: null, credit: revaluationReserveAmount, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.OffsetScoaFundId, scoaRegionId: mscoaConfig.OffsetScoaRegionId,
                    scoaCostingId: mscoaConfig.OffsetScoaCostingId,
                    scoaProjectId: mscoaConfig.OffsetPlanProjectId, scoaFunctionId: mscoaConfig.OffsetScoaFunctionId,
                    scoaItemId: mscoaConfig.OffsetScoaItemId ?? 0,
                    divisionId: mscoaConfig.OffsetDivisionId,
                    projectId: mscoaConfig.OffsetPlanProjectId, planProjectItemId: mscoaConfig.OffsetPlanProjectItemId,
                        outboxId: impOutboxId);
            }

            int impairmentTransTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""ReferenceData_ID"", 0) FROM ""Const_ReferenceData_sys""
                WHERE ""Description"" = 'Impairment' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
            if (impairmentTransTypeId == 0) impairmentTransTypeId = 3;

            var existingAccums = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT COALESCE(SUM(""ImpairmentValue""), 0) AS ""AccImp"",
                       COALESCE(SUM(""ImpairmentReversalValue""), 0) AS ""AccImpRev""
                FROM ""Asset_Register_Transactions""
                WHERE ""AssetRegisterItem_ID"" = @assetRegId", new { assetRegId }, txn);

            decimal accumulatedImpairment = (decimal)(existingAccums?.AccImp ?? 0m);
            decimal accumulatedImpairmentReversal = (decimal)(existingAccums?.AccImpRev ?? 0m);

            decimal totalImpairmentAmount = impairmentTotal;
            decimal absTotalImpairment = Math.Abs(totalImpairmentAmount);
            decimal absImpTotal = Math.Abs(impairmentTotal);
            decimal absRevalResAmt = Math.Abs(revaluationReserveAmount);

            if (totalImpairmentAmount >= 0)
                accumulatedImpairment += absTotalImpairment;
            else
                accumulatedImpairmentReversal += absTotalImpairment;

            var existingAccReval = await conn.QueryFirstOrDefaultAsync<decimal?>(@"
                SELECT ""AccumulatedRevaluation"" FROM ""Asset_Register_Transactions""
                WHERE ""AssetRegisterItem_ID"" = @assetRegId
                ORDER BY ""ID"" DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", new { assetRegId }, txn);
            decimal accumulatedRevaluation = (existingAccReval ?? 0m) - revaluationReserveAmount;

            decimal impairmentSurplus = impairmentTotal;

            decimal? revaluationReserveImpairmentVal = null;
            decimal? revaluationReserveImpairmentReversalVal = null;
            if (!isReversal)
                revaluationReserveImpairmentVal = absRevalResAmt;
            else
                revaluationReserveImpairmentReversalVal = absRevalResAmt;

            var assetLifeData = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ""UsefulLifeMonthComponent"", ""RemainingUsefulLife""
                FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId", new { assetRegId }, txn);
            decimal? originalUsefulLife = assetLifeData?.UsefulLifeMonthComponent;
            decimal currentRul = (decimal)(assetLifeData?.RemainingUsefulLife ?? 0m);

            decimal monthsConsumed = catchUpDays > 0 ? Math.Round((decimal)catchUpDays / 30.44m, 8) : 0m;
            decimal adjustedRul = currentRul - monthsConsumed;
            if (adjustedRul < 0) adjustedRul = 0;

            decimal? rulToWrite;
            if (newRemainingUsefulLife > 0 && newRemainingUsefulLife != currentRul)
                rulToWrite = newRemainingUsefulLife;
            else
                rulToWrite = adjustedRul;
            await _txnService.UpsertAssetRegisterTransaction(conn, txn,
                assetRegId, impairmentTransTypeId, impairmentDate,
                fyYear, fyPeriod, transactionId, documentTypeId,
                impairmentValue: totalImpairmentAmount >= 0 ? absTotalImpairment : (decimal?)null,
                impairmentReversalValue: totalImpairmentAmount < 0 ? absTotalImpairment : (decimal?)null,
                currentValue: newCarryingValue,
                usefulLife: originalUsefulLife,
                remainingUsefulLife: rulToWrite,
                accumulatedImpairment: accumulatedImpairment,
                accumulatedImpairmentReversal: accumulatedImpairmentReversal,
                accumulatedRevaluation: accumulatedRevaluation,
                impairmentSurplus: impairmentSurplus,
                revaluationReserveImpairment: revaluationReserveImpairmentVal,
                revaluationReserveImpairmentReversal: revaluationReserveImpairmentReversalVal);

            var impRevData = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT COALESCE(SUM(""ImpairmentValue""), 0) AS ""ImpairmentValue"",
                       COALESCE(SUM(""ImpairmentReversalValue""), 0) AS ""ImpairmentReversalValue""
                FROM ""Asset_Register_Transactions""
                WHERE ""AssetRegisterItem_ID"" = @assetRegId", new { assetRegId }, txn);

            decimal totalImpValue = (decimal)(impRevData?.ImpairmentValue ?? 0m);
            decimal totalImpRevValue = (decimal)(impRevData?.ImpairmentReversalValue ?? 0m);

            decimal netImpairment = totalImpValue - totalImpRevValue;

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items""
                SET ""ImpairmentAmountCurrentYear"" = COALESCE(""ImpairmentAmountCurrentYear"", 0) + @impairmentTotal,
                    ""AccumulatedImpairmentClosingBalance"" = COALESCE(""AccumulatedImpairmentOpeningBalance"", 0) + @netImpairment,
                    ""CurrentAmount"" = @newCarryingValue,
                    ""CarryingAmountClosingBalance"" = @newCarryingValue,
                    ""Impairment_Date"" = @impairmentDate,
                    ""RemainingUsefulLife"" = @rulToWrite,
                    ""RevaluationReserveClosingBalance"" = COALESCE(""RevaluationReserveClosingBalance"", 0) - @revaluationReserveAmount
                WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { impairmentTotal, netImpairment, newCarryingValue, impairmentDate, rulToWrite, revaluationReserveAmount, assetRegId }, txn);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Impairment""
                SET ""Approved"" = 1, ""ApprovedDate"" = GETDATE(), ""ApprovedBy"" = @approvedBy
                WHERE ""Impairment_ID"" = @id",
                new { approvedBy = request.ApprovedBy, id }, txn);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_ImpairmentPostings""
                SET ""Approved"" = 1
                WHERE ""Impairment_ID"" = @id AND COALESCE(""Approved"", 0) = 0",
                new { id }, txn);

            await _txnService.PopulateTransactionSummarySingle(conn, txn, assetRegId, finYear, 1);

            await txn.CommitAsync();

            if (catchUpGlOutboxId.HasValue)
                await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(impOutboxId, catchUpGlOutboxId.Value);
            else
                await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(impOutboxId);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_WorkflowInstances""
                SET ""status"" = 'approved', ""completed_at"" = GETDATE()
                WHERE ""entity_type"" = 'impairment' AND ""mssql_reference_id"" = @refId AND ""status"" IN ('pending', 'in_progress')",
                new { refId = id.ToString() });

            var impTokens = await _emailService.BuildAssetBaseTokensAsync(conn, assetRegId);
            impTokens["TransactionDate"]          = impairmentDate.ToString("dd MMM yyyy");
            impTokens["ImpairmentType"]           = transactionTypeName;
            impTokens["ImpairmentLoss"]           = impairmentAmount.ToString("N2");
            impTokens["AdjustedCarryingAmount"]   = newCarryingValue.ToString("N2");
            impTokens["RecoverableServiceAmount"] = newCarryingValue.ToString("N2");
            impTokens["CatchUpDepreciation"]      = catchUpDepreciation.ToString("N2");
            impTokens["RevaluationReserve"]       = revaluationReserveAmount.ToString("N2");
            try
            {
                var impPosting = await conn.QueryFirstOrDefaultAsync<dynamic>(
                    @"SELECT COALESCE(""PresentValue"", 0) AS pv FROM ""Asset_ImpairmentPostings"" WHERE ""Impairment_ID"" = @id ORDER BY ""Id"" DESC LIMIT 1",
                    new { id });
                impTokens["ValueInUse"] = impPosting != null ? Convert.ToDecimal(impPosting.pv ?? 0m).ToString("N2") : "";
            }
            catch { impTokens["ValueInUse"] = ""; }
            impTokens["Reason"]                   = (string)(impairment.Reason ?? "");
            impTokens["FinancialYear"]            = finYear;
            _ = _emailService.SendTransactionEmailsAsync(isReversal ? "Impairment Reversal" : "Impairment", impTokens);
            return Ok(new { success = 1, journalId, documentNumber, transactionId });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            Console.Error.WriteLine($"[IMPAIRMENT APPROVAL ERROR] id={id}: {ex}");
            return StatusCode(500, new { error = "Approval failed", details = ex.Message });
        }
    }

    private async Task<Guid> PostCatchUpDepreciation(DbConnection conn, DbTransaction txn,
        int assetRegId, decimal catchUpAmount, DateTime transactionDate, string finYear, int catchUpDays = 0)
    {
        var mscoaConfig = await _txnService.LookupMscoaConfig(conn, assetRegId, "Depreciation", finYear, txn);
        var depConfigErrors = _txnService.ValidateMscoaConfig(mscoaConfig, "Depreciation", assetRegId);
        if (depConfigErrors.Count > 0)
        {
            throw new InvalidOperationException($"Catch-up depreciation GL posting failed: {string.Join("; ", depConfigErrors)}");
        }

        int depJournalTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
            SELECT COALESCE(""AssetJournalTransactionType_ID"", 0) FROM ""Const_AssetJournalTransactionType_Sys""
            WHERE ""AssetJournalTransactionDesc"" = 'Asset Depreciation' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);

        int depDocTypeId = await _lookupService.GetDocumentTypeIdAsync(conn, "Asset Depreciation", txn);

        string depDocNumber = await _txnService.GenerateDocumentNumber(conn, depDocTypeId, txn);
        int depIntDocNum = int.TryParse(depDocNumber.Split('/').LastOrDefault(), out var dn2) ? dn2 : 1;

        var depTxnId = Guid.NewGuid();
        int processingMonth = await _txnService.GetProcessingMonth(conn, 1, txn);
        var (fyYear, fyPeriod) = _txnService.GetFinancialPeriodForDate(transactionDate);

        int? debitVoteId = mscoaConfig?.DebitVoteId;
        int? creditVoteId = mscoaConfig?.CreditVoteId;

        int depJournalId = await _txnService.InsertJournalAsset(conn, txn,
            finYear, processingMonth, depTxnId, depJournalTypeId,
            transactionDate, debitVoteId, creditVoteId, catchUpAmount,
            depDocNumber, depIntDocNum, assetRegId,
            scoaFundsId: mscoaConfig?.DebitScoaFundId,
            scoaRegionId: mscoaConfig?.DebitScoaRegionId,
            scoaCostingId: mscoaConfig?.DebitScoaCostingId,
            scoaFunctionId: mscoaConfig?.DebitScoaFunctionId,
            scoaItemId: mscoaConfig?.DebitScoaItemId,
            divisionId: mscoaConfig?.DebitDivisionId,
            itemDescription: "Asset Depreciation - Catch-up to Impairment Date",
            depRunType: "CatchUp");

        var impCatchUpOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
            conn, txn, "ASSET_DEPRECIATION", depDocNumber);

        if (debitVoteId.HasValue)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, debitVoteId, finYear,
                depDocTypeId, "Asset Depreciation - Catch-up to Impairment Date", depDocNumber,
                debit: catchUpAmount, credit: null, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: mscoaConfig?.DebitScoaFundId, scoaRegionId: mscoaConfig?.DebitScoaRegionId,
                scoaCostingId: mscoaConfig?.DebitScoaCostingId,
                scoaProjectId: mscoaConfig?.DebitPlanProjectId, scoaFunctionId: mscoaConfig?.DebitScoaFunctionId,
                scoaItemId: mscoaConfig?.DebitScoaItemId ?? 0,
                divisionId: mscoaConfig?.DebitDivisionId,
                projectId: mscoaConfig?.DebitPlanProjectId, planProjectItemId: mscoaConfig?.DebitPlanProjectItemId,
                    outboxId: impCatchUpOutboxId);
        }

        if (creditVoteId.HasValue)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, creditVoteId, finYear,
                depDocTypeId, "Asset Depreciation - Catch-up to Impairment Date", depDocNumber,
                debit: null, credit: catchUpAmount, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: mscoaConfig?.CreditScoaFundId, scoaRegionId: mscoaConfig?.CreditScoaRegionId,
                scoaCostingId: mscoaConfig?.CreditScoaCostingId,
                scoaProjectId: mscoaConfig?.CreditPlanProjectId, scoaFunctionId: mscoaConfig?.CreditScoaFunctionId,
                scoaItemId: mscoaConfig?.CreditScoaItemId ?? 0,
                divisionId: mscoaConfig?.CreditDivisionId,
                projectId: mscoaConfig?.CreditPlanProjectId, planProjectItemId: mscoaConfig?.CreditPlanProjectItemId,
                    outboxId: impCatchUpOutboxId);
        }

        int depTransTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
            SELECT COALESCE(""ReferenceData_ID"", 0) FROM ""Const_ReferenceData_sys""
            WHERE ""Description"" = 'Depreciation' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
        if (depTransTypeId == 0) depTransTypeId = 1;

        var assetLife = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""UsefulLifeMonthComponent"", ""RemainingUsefulLife"",
                   ""CarryingAmountClosingBalance"", ""PurchaseAmount"", ""AccumulatedDepreciationClosingBalance"",
                   COALESCE(""RevaluationReserveClosingBalance"", 0) AS ""RevalReserve"",
                   COALESCE(""AssetType_ID"", 0) AS ""AssetType_ID"",
                   COALESCE(""AssetCategory_ID"", 0) AS ""AssetCategory_ID"",
                   COALESCE(""Asset_SubCategory_ID"", 0) AS ""Asset_SubCategory_ID"",
                   COALESCE(""MeasurementType_ID"", 0) AS ""MeasurementType_ID"",
                   COALESCE(""AssetStatus_ID"", 0) AS ""AssetStatus_ID""
            FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId",
            new { assetRegId }, txn);
        decimal? origUsefulLife = assetLife?.UsefulLifeMonthComponent;
        decimal currentRul = (decimal)(assetLife?.RemainingUsefulLife ?? 0m);
        decimal monthsConsumed = catchUpDays > 0 ? Math.Round((decimal)catchUpDays / 30.44m, 8) : 0m;
        decimal adjustedRul = currentRul - monthsConsumed;
        if (adjustedRul < 0) adjustedRul = 0;
        decimal currentCarrying = (decimal)(assetLife?.CarryingAmountClosingBalance ?? assetLife?.PurchaseAmount ?? 0m);
        decimal currentAccDep = (decimal)(assetLife?.AccumulatedDepreciationClosingBalance ?? 0m);
        decimal newAccDep = currentAccDep + catchUpAmount;
        decimal newCarrying = currentCarrying - catchUpAmount;

        var scheduleId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_DepreciationSchedule"" (""FinYear"", ""RunDate"", ""RunType_ID"", ""RunStatus_ID"",
                ""DateCaptured"", ""CapturerID"", ""ScheduledDate"", ""StatusID"", ""TotalAssets"")
            VALUES (@finYear, GETDATE(), 2, 3, GETDATE(), 1, @transactionDate, 13, 1)
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
                assetTypeId = (int)(assetLife.AssetType_ID),
                assetCategoryId = (int)(assetLife.AssetCategory_ID),
                assetSubCategoryId = (int)(assetLife.Asset_SubCategory_ID),
                measurementTypeId = (int)(assetLife.MeasurementType_ID),
                assetStatusId = (int)(assetLife.AssetStatus_ID),
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

        decimal revalReserve = (decimal)(assetLife?.RevalReserve ?? 0m);
        decimal depreciationOffset = 0m;
        if (revalReserve > 0 && currentRul > 0)
        {
            decimal totalRemainingDays = currentRul / 12m * 365m;
            if (totalRemainingDays > 0)
            {
                depreciationOffset = Math.Round(revalReserve / totalRemainingDays * catchUpDays, 2);
                if (depreciationOffset > revalReserve)
                    depreciationOffset = revalReserve;
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
                projectId: mscoaConfig.ReservePlanProjectId, planProjectItemId: mscoaConfig.ReservePlanProjectItemId);

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
                projectId: mscoaConfig.OffsetPlanProjectId, planProjectItemId: mscoaConfig.OffsetPlanProjectItemId);
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

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_Register_Items""
            SET ""AccumulatedDepreciationClosingBalance"" = COALESCE(""AccumulatedDepreciationClosingBalance"", 0) + @catchUpAmount,
                ""AccumulatedDepreciationCurrentYear"" = COALESCE(""AccumulatedDepreciationCurrentYear"", 0) + @catchUpAmount,
                ""RevaluationReserveClosingBalance"" = COALESCE(""RevaluationReserveClosingBalance"", 0) - @postedOffset
            WHERE ""AssetRegisterItem_ID"" = @assetRegId",
            new { catchUpAmount, postedOffset, assetRegId }, txn);

        return impCatchUpOutboxId;
    }

    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] ImpairmentRejectRequest? request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_Impairment""
            SET ""IsRejected"" = 1, ""Status"" = 'Rejected',
                ""RejectedBy"" = @rejectedBy, ""RejectedDate"" = GETDATE(), ""RejectionReason"" = @reason
            WHERE ""Impairment_ID"" = @id",
            new { id, rejectedBy = request?.RejectedBy ?? 0, reason = request?.Reason ?? "" });

        if (rows == 0)
            return NotFound(new { error = "Impairment record not found" });

        await conn.ExecuteAsync(@"
            DELETE FROM ""Asset_ImpairmentPostings""
            WHERE ""Impairment_ID"" = @id AND COALESCE(""Approved"", 0) = 0",
            new { id });

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WorkflowInstances""
            SET ""status"" = 'rejected', ""completed_at"" = GETDATE()
            WHERE ""entity_type"" = 'impairment' AND ""mssql_reference_id"" = @refId AND ""status"" IN ('pending', 'in_progress')",
            new { refId = id.ToString() });

        return Ok(new { success = 1 });
    }

    [HttpPost("{id:int}/approve-reversal")]
    public async Task<IActionResult> ApproveReversal(int id, [FromBody] ImpairmentApprovalRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            var impairment = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ""Impairment_ID"" AS ""AssetImpairment_ID"", ""Asset_ItemID"" AS ""AssetRegID"",
                       ""ImpairmentDate"", ""NewCarryingAmount"", ""ImpairmentAmount"", ""FinYear"", ""RemainingUsefulLife"",
                       COALESCE(""Approved"", 0) AS ""Approved"",
                       COALESCE(""CatchUpDepreciation"", 0) AS ""CatchUpDepreciation"",
                       COALESCE(""CatchUpDays"", 0) AS ""CatchUpDays""
                FROM ""Asset_Impairment"" WHERE ""Impairment_ID"" = @id", new { id }, txn);

            if (impairment is null)
                return NotFound(new { error = "Impairment record not found" });

            if ((int)(impairment.Approved ?? 0) == 1)
            {
                await txn.RollbackAsync();
                return Ok(new { success = 1, alreadyApproved = 1, message = "Impairment reversal already approved" });
            }

            var reversalPostings = (await conn.QueryAsync<dynamic>(@"
                SELECT * FROM ""Asset_ImpairmentPostings""
                WHERE ""Impairment_ID"" = @id
                  AND COALESCE(""Approved"", 0) = 0 AND COALESCE(""IsReversal"", 0) = 1
                ORDER BY ""Id"" DESC", new { id }, txn)).ToList();

            if (!reversalPostings.Any())
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = "No unapproved reversal postings found for this impairment" });
            }

            int assetRegId = (int)(impairment.AssetRegID ?? 0);
            string finYear = (string)(impairment.FinYear ?? _txnService.GetCurrentFinancialPeriod().year);
            DateTime impairmentDate = (DateTime)(impairment.ImpairmentDate ?? DateTime.Now);
            decimal newCarryingValue = (decimal)(impairment.NewCarryingAmount ?? 0m);
            decimal impairmentAmount = (decimal)(impairment.ImpairmentAmount ?? 0m);
            decimal catchUpDepreciation = (decimal)(impairment.CatchUpDepreciation ?? 0m);
            int catchUpDays = (int)(impairment.CatchUpDays ?? 0);
            decimal newRemainingUsefulLife = (decimal)(impairment.RemainingUsefulLife ?? 0m);

            if (catchUpDepreciation > 0)
            {
                await PostCatchUpDepreciation(conn, txn, assetRegId, catchUpDepreciation, impairmentDate, finYear, catchUpDays);
            }

            string itemDescription = "Asset Reversal of Impairment";
            string transactionTypeName = "Impairment Reversal";

            var mscoaConfig = await _txnService.LookupMscoaConfig(conn, assetRegId, transactionTypeName, finYear, txn);
            var configErrors = _txnService.ValidateMscoaConfig(mscoaConfig, transactionTypeName, assetRegId);
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
            var (fyYear, fyPeriod) = _txnService.GetFinancialPeriodForDate(impairmentDate);

            decimal impairmentTotal = Math.Abs(impairmentAmount);
            decimal revaluationReserveAmount = 0m;

            foreach (var posting in reversalPostings)
            {
                decimal revalAmt = Math.Abs((decimal)(posting.AmountFromRevaluationReserve ?? 0m));
                revaluationReserveAmount += revalAmt;
            }

            var revOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
                conn, txn, "ASSET_IMPAIRMENT", documentNumber);

            int? debitVoteId = mscoaConfig?.DebitVoteId;
            int? creditVoteId = mscoaConfig?.CreditVoteId;

            int journalId = await _txnService.InsertJournalAsset(conn, txn,
                finYear, processingMonth, transactionId, journalTransactionTypeId,
                impairmentDate, debitVoteId, creditVoteId, impairmentTotal,
                documentNumber, intDocNumber, assetRegId,
                scoaFundsId: mscoaConfig?.DebitScoaFundId,
                scoaRegionId: mscoaConfig?.DebitScoaRegionId,
                scoaCostingId: mscoaConfig?.DebitScoaCostingId,
                scoaFunctionId: mscoaConfig?.DebitScoaFunctionId,
                scoaItemId: mscoaConfig?.DebitScoaItemId,
                divisionId: mscoaConfig?.DebitDivisionId,
                itemDescription: itemDescription);

            if (debitVoteId.HasValue)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    impairmentDate, processingMonth, debitVoteId, finYear,
                    documentTypeId, itemDescription, documentNumber,
                    debit: impairmentTotal, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig?.DebitScoaFundId, scoaRegionId: mscoaConfig?.DebitScoaRegionId,
                    scoaCostingId: mscoaConfig?.DebitScoaCostingId,
                    scoaProjectId: mscoaConfig?.DebitPlanProjectId, scoaFunctionId: mscoaConfig?.DebitScoaFunctionId,
                    scoaItemId: mscoaConfig?.DebitScoaItemId ?? 0,
                    divisionId: mscoaConfig?.DebitDivisionId,
                    projectId: mscoaConfig?.DebitPlanProjectId, planProjectItemId: mscoaConfig?.DebitPlanProjectItemId,
                        outboxId: revOutboxId);
            }

            if (creditVoteId.HasValue)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    impairmentDate, processingMonth, creditVoteId, finYear,
                    documentTypeId, itemDescription, documentNumber,
                    debit: null, credit: impairmentTotal, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig?.CreditScoaFundId, scoaRegionId: mscoaConfig?.CreditScoaRegionId,
                    scoaCostingId: mscoaConfig?.CreditScoaCostingId,
                    scoaProjectId: mscoaConfig?.CreditPlanProjectId, scoaFunctionId: mscoaConfig?.CreditScoaFunctionId,
                    scoaItemId: mscoaConfig?.CreditScoaItemId ?? 0,
                    divisionId: mscoaConfig?.CreditDivisionId,
                    projectId: mscoaConfig?.CreditPlanProjectId, planProjectItemId: mscoaConfig?.CreditPlanProjectItemId,
                        outboxId: revOutboxId);
            }

            if (revaluationReserveAmount > 0
                && mscoaConfig?.ReserveVoteId != null && mscoaConfig?.OffsetVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    impairmentDate, processingMonth, mscoaConfig.ReserveVoteId, finYear,
                    documentTypeId, itemDescription + " - Revaluation Reserve", documentNumber,
                    debit: null, credit: revaluationReserveAmount, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.ReserveScoaFundId, scoaRegionId: mscoaConfig.ReserveScoaRegionId,
                    scoaCostingId: mscoaConfig.ReserveScoaCostingId,
                    scoaProjectId: mscoaConfig.ReservePlanProjectId, scoaFunctionId: mscoaConfig.ReserveScoaFunctionId,
                    scoaItemId: mscoaConfig.ReserveScoaItemId ?? 0,
                    divisionId: mscoaConfig.ReserveDivisionId,
                    projectId: mscoaConfig.ReservePlanProjectId, planProjectItemId: mscoaConfig.ReservePlanProjectItemId,
                        outboxId: revOutboxId);

                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    impairmentDate, processingMonth, mscoaConfig.OffsetVoteId, finYear,
                    documentTypeId, itemDescription + " - Revaluation Reserve", documentNumber,
                    debit: revaluationReserveAmount, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.OffsetScoaFundId, scoaRegionId: mscoaConfig.OffsetScoaRegionId,
                    scoaCostingId: mscoaConfig.OffsetScoaCostingId,
                    scoaProjectId: mscoaConfig.OffsetPlanProjectId, scoaFunctionId: mscoaConfig.OffsetScoaFunctionId,
                    scoaItemId: mscoaConfig.OffsetScoaItemId ?? 0,
                    divisionId: mscoaConfig.OffsetDivisionId,
                    projectId: mscoaConfig.OffsetPlanProjectId, planProjectItemId: mscoaConfig.OffsetPlanProjectItemId,
                        outboxId: revOutboxId);
            }

            int impairmentTransTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""ReferenceData_ID"", 0) FROM ""Const_ReferenceData_sys""
                WHERE ""Description"" = 'Impairment' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
            if (impairmentTransTypeId == 0) impairmentTransTypeId = 3;

            var existingAccums = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT COALESCE(SUM(""ImpairmentValue""), 0) AS ""AccImp"",
                       COALESCE(SUM(""ImpairmentReversalValue""), 0) AS ""AccImpRev""
                FROM ""Asset_Register_Transactions""
                WHERE ""AssetRegisterItem_ID"" = @assetRegId", new { assetRegId }, txn);

            decimal accumulatedImpairment = (decimal)(existingAccums?.AccImp ?? 0m);
            decimal accumulatedImpairmentReversal = (decimal)(existingAccums?.AccImpRev ?? 0m);

            decimal absTotalImpairment = impairmentTotal;
            decimal absRevalResAmt = revaluationReserveAmount;

            accumulatedImpairmentReversal += absTotalImpairment;

            var existingAccReval = await conn.QueryFirstOrDefaultAsync<decimal?>(@"
                SELECT ""AccumulatedRevaluation"" FROM ""Asset_Register_Transactions""
                WHERE ""AssetRegisterItem_ID"" = @assetRegId
                ORDER BY ""ID"" DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", new { assetRegId }, txn);
            decimal accumulatedRevaluation = (existingAccReval ?? 0m) + revaluationReserveAmount;

            var assetLifeData = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ""UsefulLifeMonthComponent"", ""RemainingUsefulLife""
                FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId", new { assetRegId }, txn);
            decimal? originalUsefulLife = assetLifeData?.UsefulLifeMonthComponent;
            decimal currentRul = (decimal)(assetLifeData?.RemainingUsefulLife ?? 0m);

            decimal monthsConsumed = catchUpDays > 0 ? Math.Round((decimal)catchUpDays / 30.44m, 8) : 0m;
            decimal adjustedRul = currentRul - monthsConsumed;
            if (adjustedRul < 0) adjustedRul = 0;

            decimal? rulToWrite;
            if (newRemainingUsefulLife > 0 && newRemainingUsefulLife != currentRul)
                rulToWrite = newRemainingUsefulLife;
            else
                rulToWrite = adjustedRul;

            await _txnService.UpsertAssetRegisterTransaction(conn, txn,
                assetRegId, impairmentTransTypeId, impairmentDate,
                fyYear, fyPeriod, transactionId, documentTypeId,
                impairmentReversalValue: absTotalImpairment,
                currentValue: newCarryingValue,
                usefulLife: originalUsefulLife,
                remainingUsefulLife: rulToWrite,
                accumulatedImpairment: accumulatedImpairment,
                accumulatedImpairmentReversal: accumulatedImpairmentReversal,
                accumulatedRevaluation: accumulatedRevaluation,
                impairmentSurplus: impairmentTotal,
                revaluationReserveImpairmentReversal: absRevalResAmt);

            var impRevData = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT COALESCE(SUM(""ImpairmentValue""), 0) AS ""ImpairmentValue"",
                       COALESCE(SUM(""ImpairmentReversalValue""), 0) AS ""ImpairmentReversalValue""
                FROM ""Asset_Register_Transactions""
                WHERE ""AssetRegisterItem_ID"" = @assetRegId", new { assetRegId }, txn);

            decimal totalImpValue = (decimal)(impRevData?.ImpairmentValue ?? 0m);
            decimal totalImpRevValue = (decimal)(impRevData?.ImpairmentReversalValue ?? 0m);
            decimal netImpairment = totalImpValue - totalImpRevValue;

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items""
                SET ""ImpairmentAmountCurrentYear"" = COALESCE(""ImpairmentAmountCurrentYear"", 0) - @impairmentTotal,
                    ""AccumulatedImpairmentClosingBalance"" = COALESCE(""AccumulatedImpairmentOpeningBalance"", 0) + @netImpairment,
                    ""CurrentAmount"" = @newCarryingValue,
                    ""CarryingAmountClosingBalance"" = @newCarryingValue,
                    ""Impairment_Date"" = @impairmentDate,
                    ""RemainingUsefulLife"" = @rulToWrite,
                    ""RevaluationReserveClosingBalance"" = COALESCE(""RevaluationReserveClosingBalance"", 0) + @revaluationReserveAmount
                WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { impairmentTotal, netImpairment, newCarryingValue, impairmentDate, rulToWrite, revaluationReserveAmount, assetRegId }, txn);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Impairment""
                SET ""Approved"" = 1, ""ApprovedDate"" = GETDATE(), ""ApprovedBy"" = @approvedBy
                WHERE ""Impairment_ID"" = @id",
                new { approvedBy = request.ApprovedBy, id }, txn);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_ImpairmentPostings""
                SET ""Approved"" = 1
                WHERE ""Impairment_ID"" = @id
                  AND COALESCE(""Approved"", 0) = 0 AND COALESCE(""IsReversal"", 0) = 1",
                new { id }, txn);

            await _txnService.PopulateTransactionSummarySingle(conn, txn, assetRegId, finYear, 1);

            await txn.CommitAsync();

            await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(revOutboxId);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_WorkflowInstances""
                SET ""status"" = 'approved', ""completed_at"" = GETDATE()
                WHERE ""entity_type"" = 'impairment_reversal' AND ""mssql_reference_id"" = @refId AND ""status"" IN ('pending', 'in_progress')",
                new { refId = id.ToString() });

            return Ok(new { success = 1, journalId, documentNumber, transactionId });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            return StatusCode(500, new { error = "Reversal approval failed", details = ex.Message });
        }
    }

    [HttpGet("asset/{assetId:int}/reserve-basis")]
    public async Task<IActionResult> GetReserveBasis(int assetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var result = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT
                COALESCE(SUM(CASE WHEN COALESCE(ip.""IsReversal"", 0) = 0
                    THEN COALESCE(ip.""AmountFromRevaluationReserve"", 0) ELSE 0 END), 0) AS ""totalReserve"",
                COALESCE(SUM(CASE WHEN COALESCE(ip.""IsReversal"", 0) = 0
                    THEN COALESCE(ip.""ImpairmentLostAmt"", 0) ELSE 0 END), 0) AS ""totalPnL"",
                COALESCE(SUM(CASE WHEN COALESCE(ip.""IsReversal"", 0) = 1
                    THEN COALESCE(ip.""AmountFromRevaluationReserve"", 0) ELSE 0 END), 0) AS ""reversedReserve"",
                COALESCE(SUM(CASE WHEN COALESCE(ip.""IsReversal"", 0) = 1
                    THEN COALESCE(ip.""ImpairmentLostAmt"", 0) ELSE 0 END), 0) AS ""reversedPnL""
            FROM ""Asset_ImpairmentPostings"" ip
            JOIN ""Asset_Impairment"" ai ON ai.""Impairment_ID"" = ip.""Impairment_ID""
            WHERE ai.""Asset_ItemID"" = @assetId AND COALESCE(ai.""Approved"", 0) = 1",
            new { assetId });

        decimal totalReserve = (decimal)(result?.totalReserve ?? 0m);
        decimal totalPnL = (decimal)(result?.totalPnL ?? 0m);
        decimal reversedReserve = (decimal)(result?.reversedReserve ?? 0m);
        decimal reversedPnL = (decimal)(result?.reversedPnL ?? 0m);

        decimal netReserve = Math.Max(0, totalReserve - reversedReserve);
        decimal netPnL = Math.Max(0, totalPnL - reversedPnL);

        return Ok(new { originalPnL = netPnL, originalReserve = netReserve });
    }

    [HttpPost("{id:int}/correct-gl")]
    public async Task<IActionResult> CorrectGl(int id)
    {
        if (id != 4)
            return BadRequest(new { error = "correct-gl is scoped to the known reversal incident (Impairment_ID=4 only)" });

        const decimal KnownImpairmentAmount = 43189.07m;
        const decimal KnownToReserve = 38306.13m;
        const decimal KnownToPnL = 4882.94m;
        const int KnownAssetRegId = 1;
        const string KnownFinYear = "2025/2026";
        var KnownImpairmentDate = new DateTime(2025, 7, 25);

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            string reversalJournalDesc = "Asset Reversal of Impairment";
            int journalTxnTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""AssetJournalTransactionType_ID"", 0)
                FROM ""Const_AssetJournalTransactionType_Sys""
                WHERE ""AssetJournalTransactionDesc"" = @reversalJournalDesc
                OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
                new { reversalJournalDesc }, txn);

            int assetLinkId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""AssetJournal_ID"", 0) FROM ""Led_Journal_Asset""
                WHERE ""Asset_RegisterItem_ID"" = @assetRegId
                  AND ""TransactionDate"" = @impairmentDate
                  AND ""AssetJournalTransactionTypeID"" = @journalTxnTypeId
                ORDER BY ""AssetJournal_ID"" DESC
                OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
                new { assetRegId = KnownAssetRegId, impairmentDate = KnownImpairmentDate, journalTxnTypeId }, txn);

            if (assetLinkId == 0)
            {
                await txn.RollbackAsync();
                return NotFound(new { error = "Journal entry for the known reversal incident not found" });
            }

            int negativeCount = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COUNT(*)::int FROM ""Asset_GeneralLedger""
                WHERE ""AssetLinkID"" = @assetLinkId AND (""Debit"" < 0 OR ""Credit"" < 0)",
                new { assetLinkId }, txn);

            if (negativeCount == 0)
            {
                await txn.RollbackAsync();
                await _txnService.PopulateTransactionSummarySingle(KnownAssetRegId, KnownFinYear, 1);
                return Ok(new { success = 0, message = "No negative GL entries for this journal link — GL correction already applied. ATS regenerated." });
            }

            var mscoaConfig = await _txnService.LookupMscoaConfig(conn, KnownAssetRegId, "Impairment Reversal", KnownFinYear, txn);
            if (mscoaConfig == null || mscoaConfig.DebitVoteId == null || mscoaConfig.CreditVoteId == null
                || mscoaConfig.ReserveVoteId == null || mscoaConfig.OffsetVoteId == null)
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = "mSCOA config (including reserve/offset votes) not found for Impairment Reversal" });
            }

            await conn.ExecuteAsync(@"
                DELETE FROM ""Asset_GeneralLedger""
                WHERE ""AssetLinkID"" = @assetLinkId AND (""Debit"" < 0 OR ""Credit"" < 0)",
                new { assetLinkId }, txn);

            var journalInfo = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ""DocumentNumber"" FROM ""Led_Journal_Asset""
                WHERE ""AssetJournal_ID"" = @assetLinkId",
                new { assetLinkId }, txn);
            string documentNumber = (string)(journalInfo?.DocumentNumber ?? "CORR");
            string itemDescription = "Asset Reversal of Impairment - Correction";
            int processingMonth = await _txnService.GetProcessingMonth(conn, 1, txn);
            var corrTranId = Guid.NewGuid();
            int corrDocTypeId = int.TryParse(documentNumber.Split('/').FirstOrDefault(), out var cdtp) && cdtp > 0 ? cdtp : journalTxnTypeId;

            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                KnownImpairmentDate, processingMonth, mscoaConfig.DebitVoteId, KnownFinYear,
                corrDocTypeId, itemDescription, documentNumber,
                debit: KnownImpairmentAmount, credit: null, matchTranGuid: corrTranId,
                journalTransactionTypeId: journalTxnTypeId, assetLinkId: assetLinkId,
                scoaFundsId: mscoaConfig.DebitScoaFundId, scoaRegionId: mscoaConfig.DebitScoaRegionId,
                scoaCostingId: mscoaConfig.DebitScoaCostingId,
                scoaProjectId: mscoaConfig.DebitPlanProjectId, scoaFunctionId: mscoaConfig.DebitScoaFunctionId,
                scoaItemId: mscoaConfig.DebitScoaItemId ?? 0, divisionId: mscoaConfig.DebitDivisionId,
                projectId: mscoaConfig.DebitPlanProjectId, planProjectItemId: mscoaConfig.DebitPlanProjectItemId);

            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                KnownImpairmentDate, processingMonth, mscoaConfig.CreditVoteId, KnownFinYear,
                corrDocTypeId, itemDescription, documentNumber,
                debit: null, credit: KnownImpairmentAmount, matchTranGuid: corrTranId,
                journalTransactionTypeId: journalTxnTypeId, assetLinkId: assetLinkId,
                scoaFundsId: mscoaConfig.CreditScoaFundId, scoaRegionId: mscoaConfig.CreditScoaRegionId,
                scoaCostingId: mscoaConfig.CreditScoaCostingId,
                scoaProjectId: mscoaConfig.CreditPlanProjectId, scoaFunctionId: mscoaConfig.CreditScoaFunctionId,
                scoaItemId: mscoaConfig.CreditScoaItemId ?? 0, divisionId: mscoaConfig.CreditDivisionId,
                projectId: mscoaConfig.CreditPlanProjectId, planProjectItemId: mscoaConfig.CreditPlanProjectItemId);

            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                KnownImpairmentDate, processingMonth, mscoaConfig.ReserveVoteId, KnownFinYear,
                corrDocTypeId, itemDescription + " Reserve", documentNumber,
                debit: null, credit: KnownToReserve, matchTranGuid: corrTranId,
                journalTransactionTypeId: journalTxnTypeId, assetLinkId: assetLinkId,
                scoaFundsId: mscoaConfig.ReserveScoaFundId, scoaRegionId: mscoaConfig.ReserveScoaRegionId,
                scoaCostingId: mscoaConfig.ReserveScoaCostingId,
                scoaProjectId: mscoaConfig.ReservePlanProjectId, scoaFunctionId: mscoaConfig.ReserveScoaFunctionId,
                scoaItemId: mscoaConfig.ReserveScoaItemId ?? 0, divisionId: mscoaConfig.ReserveDivisionId,
                projectId: mscoaConfig.ReservePlanProjectId, planProjectItemId: mscoaConfig.ReservePlanProjectItemId);

            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                KnownImpairmentDate, processingMonth, mscoaConfig.OffsetVoteId, KnownFinYear,
                corrDocTypeId, itemDescription + " Reserve", documentNumber,
                debit: KnownToReserve, credit: null, matchTranGuid: corrTranId,
                journalTransactionTypeId: journalTxnTypeId, assetLinkId: assetLinkId,
                scoaFundsId: mscoaConfig.OffsetScoaFundId, scoaRegionId: mscoaConfig.OffsetScoaRegionId,
                scoaCostingId: mscoaConfig.OffsetScoaCostingId,
                scoaProjectId: mscoaConfig.OffsetPlanProjectId, scoaFunctionId: mscoaConfig.OffsetScoaFunctionId,
                scoaItemId: mscoaConfig.OffsetScoaItemId ?? 0, divisionId: mscoaConfig.OffsetDivisionId,
                projectId: mscoaConfig.OffsetPlanProjectId, planProjectItemId: mscoaConfig.OffsetPlanProjectItemId);

            int impairmentTransTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""ReferenceData_ID"", 0) FROM ""Const_ReferenceData_sys""
                WHERE ""Description"" = 'Impairment' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
            if (impairmentTransTypeId == 0) impairmentTransTypeId = 3;

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Transactions""
                SET ""RevaluationReserveImpairmentReversal"" = @toReserve,
                    ""AccumulatedRevaluation"" = COALESCE(""AccumulatedRevaluation"", 0) + @toReserve,
                    ""ImpairmentSurplus"" = @impairmentAmount
                WHERE ""AssetRegisterItem_ID"" = @assetRegId
                  AND ""TransactionDate"" = @impairmentDate
                  AND ""TransactionTypeID"" = @impairmentTransTypeId",
                new { toReserve = KnownToReserve, impairmentAmount = KnownImpairmentAmount,
                      assetRegId = KnownAssetRegId, impairmentDate = KnownImpairmentDate,
                      impairmentTransTypeId }, txn);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items""
                SET ""RevaluationReserveClosingBalance"" = COALESCE(""RevaluationReserveClosingBalance"", 0) + @toReserve
                WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { toReserve = KnownToReserve, assetRegId = KnownAssetRegId }, txn);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_ImpairmentPostings""
                SET ""ImpairmentLostAmt"" = @toPnL,
                    ""AmountFromRevaluationReserve"" = @toReserve
                WHERE ""Impairment_ID"" = @id AND COALESCE(""IsReversal"", 0) = 1",
                new { toPnL = KnownToPnL, toReserve = KnownToReserve, id }, txn);

            await _txnService.PopulateTransactionSummarySingle(conn, txn, KnownAssetRegId, KnownFinYear, 1);

            await txn.CommitAsync();

            var verification = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT COUNT(*)::int AS ""glLegs"",
                       COALESCE(SUM(""Debit""), 0) AS ""totalDebit"",
                       COALESCE(SUM(""Credit""), 0) AS ""totalCredit""
                FROM ""Asset_GeneralLedger"" WHERE ""AssetLinkID"" = @assetLinkId",
                new { assetLinkId });

            return Ok(new
            {
                success = 1,
                message = "GL correction applied successfully",
                impairmentAmount = KnownImpairmentAmount,
                toReserve = KnownToReserve,
                toPnL = KnownToPnL,
                postState = new
                {
                    glLegs = (int)(verification?.glLegs ?? 0),
                    totalDebit = (decimal)(verification?.totalDebit ?? 0m),
                    totalCredit = (decimal)(verification?.totalCredit ?? 0m)
                }
            });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            return StatusCode(500, new { error = "GL correction failed", details = ex.Message });
        }
    }

    [HttpPost("{id:int}/reject-reversal")]
    public async Task<IActionResult> RejectReversal(int id, [FromBody] ImpairmentRejectRequest? request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var rows = await conn.ExecuteAsync(@"
            DELETE FROM ""Asset_ImpairmentPostings""
            WHERE ""Impairment_ID"" = @id
              AND COALESCE(""Approved"", 0) = 0 AND COALESCE(""IsReversal"", 0) = 1",
            new { id });

        if (rows == 0)
            return NotFound(new { error = "No unapproved reversal postings found for this impairment" });

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_Impairment""
            SET ""IsRejected"" = 1, ""Status"" = 'Rejected',
                ""RejectedBy"" = @rejectedBy, ""RejectedDate"" = GETDATE(), ""RejectionReason"" = @reason
            WHERE ""Impairment_ID"" = @id",
            new { id, rejectedBy = request?.RejectedBy ?? 0, reason = request?.Reason ?? "Reversal rejected" });

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WorkflowInstances""
            SET ""status"" = 'rejected', ""completed_at"" = GETDATE()
            WHERE ""entity_type"" = 'impairment_reversal' AND ""mssql_reference_id"" = @refId AND ""status"" IN ('pending', 'in_progress')",
            new { refId = id.ToString() });

        return Ok(new { success = 1 });
    }
}

public class ImpairmentApprovalRequest
{
    public int ApprovedBy { get; set; }
}

public class ImpairmentRejectRequest
{
    public int RejectedBy { get; set; }
    public string? Reason { get; set; }
}
