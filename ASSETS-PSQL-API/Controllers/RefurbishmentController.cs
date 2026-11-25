using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data.Common;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/refurbishments")]
public class RefurbishmentController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;
    private readonly LookupService _lookupService;
    private readonly InternalApiClient _internalApi;
    private readonly EmailService _emailService;

    public RefurbishmentController(DbConnectionFactory db, TransactionService txnService, LookupService lookupService, InternalApiClient internalApi, EmailService emailService)
    {
        _db = db;
        _txnService = txnService;
        _lookupService = lookupService;
        _internalApi = internalApi;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear, [FromQuery] string? status,
        [FromQuery] int? assetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Asset_RefurbID"", ""AssetRegisterID"", ""FinancialPeriod"", ""FinancialYear"",
            ""RefurbDate"", ""Refurb_DT"", ""Refurb_CT"", ""Refurb_Depreciation"", ""Refurb_Revaluation"",
            ""Refurb_Impairment"",
            ""isApproved"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"",
            ""DebitPlanProjectItemId"", ""CreditPlanProjectItemId""
            FROM ""Asset_Refurb"" WHERE 1=1";
        var parameters = new DynamicParameters();
        if (!string.IsNullOrEmpty(finYear))
        {
            sql += @" AND ""FinancialYear"" = @finYear";
            parameters.Add("finYear", finYear);
        }
        if (assetId.HasValue)
        {
            sql += @" AND ""AssetRegisterID"" = @assetId";
            parameters.Add("assetId", assetId.Value);
        }
        if (!string.IsNullOrEmpty(status))
        {
            if (status == "Pending")
                sql += @" AND (""isApproved"" IS NULL OR ""isApproved"" = FALSE)";
            else if (status == "Approved")
                sql += @" AND ""isApproved"" = TRUE";
            else if (status == "Rejected")
                sql += @" AND ""isApproved"" = FALSE";
        }
        sql += @" ORDER BY ""Asset_RefurbID"" DESC";
        var items = await conn.QueryAsync<AssetRefurbishment>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetRefurbishment>(
            @"SELECT ""Asset_RefurbID"", ""AssetRegisterID"", ""FinancialPeriod"", ""FinancialYear"",
                ""RefurbDate"", ""Refurb_DT"", ""Refurb_CT"", ""Refurb_Depreciation"", ""Refurb_Revaluation"",
                ""Refurb_Impairment"",
                ""isApproved"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"",
                ""DebitPlanProjectItemId"", ""CreditPlanProjectItemId""
            FROM ""Asset_Refurb"" WHERE ""Asset_RefurbID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Refurbishment record not found" }) : Ok(item);
    }

    [HttpGet("{id:int}/detail")]
    public async Task<IActionResult> GetDetail(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var refurb = await conn.QueryFirstOrDefaultAsync<AssetRefurbishment>(
            @"SELECT ""Asset_RefurbID"", ""AssetRegisterID"", ""FinancialPeriod"", ""FinancialYear"",
                ""RefurbDate"", ""Refurb_DT"", ""Refurb_CT"", ""Refurb_Depreciation"", ""Refurb_Revaluation"",
                ""Refurb_Impairment"",
                ""isApproved"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"",
                ""DebitPlanProjectItemId"", ""CreditPlanProjectItemId""
            FROM ""Asset_Refurb"" WHERE ""Asset_RefurbID"" = @id", new { id });
        if (refurb == null) return NotFound(new { error = "Refurbishment record not found" });

        int assetId = refurb.AssetRegisterID ?? 0;
        DateTime txnDate = refurb.RefurbDate ?? DateTime.Today;

        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT a.""AssetRegisterItem_ID"", a.""Description"", a.""PurchaseAmount"",
                     a.""AccumulatedDepreciationClosingBalance"", a.""CarryingAmountClosingBalance"",
                     a.""RemainingUsefulLife"", a.""ResidualValue"", a.""InserviceDate"",
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

        var lastDepDate = await conn.QueryFirstOrDefaultAsync<DateTime?>(
            @"SELECT MAX(latest) FROM (
                SELECT MAX(""DepreciationDate"") AS latest FROM ""Asset_Depreciation""
                  WHERE ""AssetRegisterItem_ID"" = @assetId
                UNION ALL
                SELECT MAX(""TransactionDate"") AS latest FROM ""Asset_Register_Transactions""
                  WHERE ""AssetRegisterItem_ID"" = @assetId
                    AND ""TransactionTypeID"" IN (
                      SELECT ""ReferenceData_ID"" FROM ""Const_ReferenceData_sys""
                      WHERE ""Description"" IN ('Depreciation', 'Impairment')
                    )
              ) sub", new { assetId });

        DateTime depFromDate;
        if (lastDepDate.HasValue)
            depFromDate = lastDepDate.Value;
        else if (asset?.InserviceDate != null)
            depFromDate = (DateTime)asset.InserviceDate;
        else
            depFromDate = txnDate;

        int catchUpDays = (int)(txnDate - depFromDate).TotalDays;
        if (catchUpDays < 0) catchUpDays = 0;

        decimal carryingBeforeCatchUp = projected.CarryingAmount;
        decimal catchUpDep = 0m;
        decimal dailyRate = 0m;
        decimal adjustedCarrying = projected.CarryingAmount;

        decimal remainingUsefulLifeMonths = (decimal)(asset?.RemainingUsefulLife ?? 0m);
        if (catchUpDays > 0 && remainingUsefulLifeMonths > 0)
        {
            decimal residual = (decimal)(asset?.ResidualValue ?? 0m);
            decimal depreciableAmount = Math.Max(0, carryingBeforeCatchUp - residual);
            int maxDepDays = (int)(remainingUsefulLifeMonths * 30.44m);
            if (catchUpDays > maxDepDays) catchUpDays = maxDepDays;
            catchUpDep = Math.Round(depreciableAmount * 12m / remainingUsefulLifeMonths / 365m * catchUpDays, 2);
            if (catchUpDep > depreciableAmount) catchUpDep = depreciableAmount;
            adjustedCarrying = Math.Max(0, carryingBeforeCatchUp - catchUpDep);
            if (catchUpDays > 0 && catchUpDep > 0) dailyRate = Math.Round(catchUpDep / catchUpDays, 2);
        }

        return Ok(new
        {
            transaction = refurb,
            asset,
            projected = new
            {
                carryingBeforeCatchUp,
                carryingAmount = adjustedCarrying,
                accumulatedDepreciation = projected.AccumulatedDepreciation,
                revalReserve = projected.RevaluationReserve,
                catchUpDays,
                catchUpDep = catchUpDep > 0 ? (decimal?)catchUpDep : null,
                dailyRate = dailyRate > 0 ? (decimal?)dailyRate : null,
                adjustedCarrying = catchUpDep > 0 ? (decimal?)adjustedCarrying : null
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetRefurbishment model)
    {
        if (!model.AssetRegisterID.HasValue || model.AssetRegisterID.Value <= 0)
            return BadRequest(new { error = "AssetRegisterID is required" });
        if (!model.RefurbDate.HasValue)
            return BadRequest(new { error = "RefurbDate is required" });
        decimal dt = model.Refurb_DT ?? 0m;
        decimal ct = model.Refurb_CT ?? 0m;
        if (dt <= 0 && ct <= 0)
            return BadRequest(new { error = "At least one of Refurb_DT or Refurb_CT must be greater than zero" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""AssetRegisterItem_ID"", ""CarryingAmountClosingBalance"" FROM ""Asset_Register_Items""
              WHERE ""AssetRegisterItem_ID"" = @AssetRegisterID",
            new { model.AssetRegisterID });

        if (asset is null) return NotFound(new { error = "Asset not found" });

        var approvalMethod = await _txnService.GetApprovalMethod(conn);
        if (approvalMethod == "Automated")
        {
            bool duplicate = await _txnService.HasPendingTransactionInMonth(conn, "refurbishment", model.AssetRegisterID.Value, model.RefurbDate.Value);
            if (duplicate)
                return BadRequest(new { error = $"A refurbishment already exists for this asset in {model.RefurbDate.Value:MMMM yyyy}. Only one refurbishment per asset per month is allowed in Automated mode." });
        }
        else
        {
            var pendingType = await _txnService.GetPendingTransactionTypeForAsset(conn, model.AssetRegisterID.Value, model.RefurbDate.Value);
            if (pendingType != null)
                return BadRequest(new { error = $"There is an unapproved {pendingType} for this asset in {model.RefurbDate.Value:MMMM yyyy}. Please approve or reject it before capturing a new transaction." });
        }

        var (fyYear, fyPeriod) = _txnService.GetFinancialPeriodForDate(model.RefurbDate.Value);
        model.FinancialYear = fyYear;
        model.FinancialPeriod = fyPeriod;

        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_Refurb"" (""AssetRegisterID"", ""FinancialPeriod"", ""FinancialYear"",
                ""RefurbDate"", ""Refurb_DT"", ""Refurb_CT"", ""Refurb_Depreciation"", ""Refurb_Revaluation"",
                ""Refurb_Impairment"",
                ""DebitPlanProjectItemId"", ""CreditPlanProjectItemId"",
                ""DateCaptured"", ""CapturerID"")
            VALUES (@AssetRegisterID, @FinancialPeriod, @FinancialYear,
                @RefurbDate, @Refurb_DT, @Refurb_CT, @Refurb_Depreciation, @Refurb_Revaluation,
                @Refurb_Impairment,
                @DebitPlanProjectItemId, @CreditPlanProjectItemId,
                NOW(), 1)
            RETURNING ""Asset_RefurbID""",
            new { model.AssetRegisterID, model.FinancialPeriod, model.FinancialYear,
                  model.RefurbDate, model.Refurb_DT, model.Refurb_CT, model.Refurb_Depreciation, model.Refurb_Revaluation,
                  Refurb_Impairment = model.Refurb_Impairment ?? 0m,
                  model.DebitPlanProjectItemId, model.CreditPlanProjectItemId });
        model.Asset_RefurbID = id;

        await _txnService.PopulateTransactionSummarySingle(model.AssetRegisterID.Value, fyYear, fyPeriod);

        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] RefurbApprovalRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var refurb = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""Asset_RefurbID"", ""AssetRegisterID"", ""RefurbDate"", ""FinancialYear"", ""FinancialPeriod"",
                   ""Refurb_DT"", ""Refurb_CT"", ""Refurb_Depreciation"", ""Refurb_Revaluation"",
                   ""Refurb_Impairment"",
                   ""isApproved"", ""DebitPlanProjectItemId"", ""CreditPlanProjectItemId""
            FROM ""Asset_Refurb"" WHERE ""Asset_RefurbID"" = @id", new { id });

        if (refurb is null) return NotFound(new { error = "Refurbishment not found" });

        if (refurb.isApproved == true)
            return Ok(new { success = 1, alreadyApproved = 1, message = "Refurbishment already approved" });

        int assetRegId = (int)(refurb.AssetRegisterID ?? 0);
        string finYear = (string)(refurb.FinancialYear ?? _txnService.GetCurrentFinancialPeriod().year);
        DateTime refurbDate = refurb.RefurbDate != null ? (DateTime)refurb.RefurbDate : DateTime.Now;
        decimal refurbDT = (decimal)(refurb.Refurb_DT ?? 0m);
        decimal refurbCT = (decimal)(refurb.Refurb_CT ?? 0m);
        decimal refurbDepreciation = (decimal)(refurb.Refurb_Depreciation ?? 0m);
        decimal refurbRevaluation = (decimal)(refurb.Refurb_Revaluation ?? 0m);
        decimal refurbImpairment = (decimal)(refurb.Refurb_Impairment ?? 0m);
        int? debitPlanProjectItemId = refurb.DebitPlanProjectItemId != null ? (int?)refurb.DebitPlanProjectItemId : null;
        int? creditPlanProjectItemId = refurb.CreditPlanProjectItemId != null ? (int?)refurb.CreditPlanProjectItemId : null;

        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            var effective = await _txnService.GetEffectiveAssetValues(conn, assetRegId, refurbDate.AddSeconds(-1));

            decimal remainingUsefulLifeMonths = 0m;
            decimal residualValue = 0m;
            DateTime depFromDate = refurbDate;

            var assetInfo = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ""RemainingUsefulLife"", ""UsefulLifeMonthComponent"", ""ResidualValue"", ""InserviceDate""
                FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { assetRegId }, txn);

            if (assetInfo != null)
            {
                remainingUsefulLifeMonths = (decimal)(assetInfo.RemainingUsefulLife ?? assetInfo.UsefulLifeMonthComponent ?? 0m);
                residualValue = (decimal)(assetInfo.ResidualValue ?? 0m);

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
                      ) sub", new { assetRegId }, txn);

                if (lastDepDate.HasValue)
                    depFromDate = lastDepDate.Value;
                else if (assetInfo.InserviceDate != null)
                    depFromDate = (DateTime)assetInfo.InserviceDate;
            }

            int catchUpDays = (int)(refurbDate - depFromDate).TotalDays;
            if (catchUpDays < 0) catchUpDays = 0;
            decimal catchUpDepreciation = 0m;

            if (catchUpDays > 0 && remainingUsefulLifeMonths > 0)
            {
                decimal depreciableAmount = Math.Max(0, effective.CarryingAmount - residualValue);
                int maxDepDays = (int)(remainingUsefulLifeMonths * 30.44m);
                if (catchUpDays > maxDepDays) catchUpDays = maxDepDays;
                catchUpDepreciation = Math.Round(depreciableAmount * 12m / remainingUsefulLifeMonths / 365m * catchUpDays, 2);
                if (catchUpDepreciation > depreciableAmount) catchUpDepreciation = depreciableAmount;
            }

            Guid? catchUpGlOutboxId = null;
            if (catchUpDepreciation > 0)
            {
                catchUpGlOutboxId = await PostCatchUpDepreciationForRefurbishment(conn, txn,
                    assetRegId, catchUpDepreciation, refurbDate, finYear, catchUpDays,
                    effective, remainingUsefulLifeMonths);
            }

            int refurbTransTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""ReferenceData_ID"", 0) FROM ""Const_ReferenceData_sys""
                WHERE ""Description"" = 'Asset Refurbishment' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
            if (refurbTransTypeId == 0) refurbTransTypeId = 37;

            var (fyYear, fyPeriod) = _txnService.GetFinancialPeriodForDate(refurbDate);
            var transactionId = Guid.NewGuid();

            int documentTypeId = await _lookupService.GetDocumentTypeIdAsync(conn, "Asset Refurbishment", txn);

            decimal postCatchUpAccDep = effective.AccumulatedDepreciation + catchUpDepreciation;
            decimal newAccDep = postCatchUpAccDep - refurbDepreciation;
            decimal newAccRevl = effective.RevaluationReserve - refurbRevaluation;

            decimal existingAccImpairment = await conn.QueryFirstOrDefaultAsync<decimal>(
                @"SELECT COALESCE(""AccumulatedImpairmentClosingBalance"", 0) FROM ""Asset_Register_Items""
                  WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { assetRegId }, txn);
            decimal newAccImpairment = existingAccImpairment - refurbImpairment;
            if (newAccImpairment < 0) newAccImpairment = 0;

            await _txnService.UpsertAssetRegisterTransaction(conn, txn,
                assetRegId, refurbTransTypeId, refurbDate,
                fyYear, fyPeriod, transactionId, documentTypeId > 0 ? documentTypeId : (int?)null,
                refurbDTValue: refurbDT,
                refurbCTValue: refurbCT,
                refurbDepreciationValue: refurbDepreciation,
                refurbRevaluationValue: refurbRevaluation,
                refurbImpairmentValue: refurbImpairment > 0 ? refurbImpairment : (decimal?)null,
                accumulatedDepreciation: newAccDep,
                accumulatedRevaluation: newAccRevl,
                accumulatedImpairment: refurbImpairment > 0 ? newAccImpairment : (decimal?)null);

            var mscoaConfig = await _txnService.LookupMscoaConfig(conn, assetRegId, "Disposal", finYear, txn);
            var configErrors = _txnService.ValidateMscoaConfig(mscoaConfig, "Disposal", assetRegId);
            if (configErrors.Count > 0)
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = "GL posting configuration incomplete", details = configErrors });
            }

            int? userDebitVoteId = null;
            int? userDebitPPIId = null;
            int? userDebitScoaItemId = null;
            int? userDebitPlanProjectId = null;
            int? userDebitScoaFundId = null;
            int? userDebitScoaRegionId = null;
            int? userDebitScoaCostingId = null;
            int? userDebitScoaFunctionId = null;
            int? userDebitDivisionId = null;
            if (debitPlanProjectItemId.HasValue)
            {
                var dtVote = await _internalApi.GetPpiVoteDataAsync(debitPlanProjectItemId.Value, finYear);
                if (dtVote != null && dtVote.VoteId != null)
                {
                    userDebitVoteId = dtVote.VoteId;
                    userDebitPPIId = dtVote.PlanProjectItem_ID;
                    userDebitScoaItemId = dtVote.SCOAItemID;
                    userDebitPlanProjectId = dtVote.ProjectID;
                    userDebitScoaFundId = dtVote.SCOAFundId;
                    userDebitScoaRegionId = dtVote.SCOARegionId;
                    userDebitScoaCostingId = dtVote.SCOACostingID;
                    userDebitScoaFunctionId = dtVote.SCOAFunctionId;
                    userDebitDivisionId = dtVote.DivisionId;
                }
            }

            int? userCreditVoteId = null;
            int? userCreditPPIId = null;
            int? userCreditScoaItemId = null;
            int? userCreditPlanProjectId = null;
            int? userCreditScoaFundId = null;
            int? userCreditScoaRegionId = null;
            int? userCreditScoaCostingId = null;
            int? userCreditScoaFunctionId = null;
            int? userCreditDivisionId = null;
            if (creditPlanProjectItemId.HasValue)
            {
                var ctVote = await _internalApi.GetPpiVoteDataAsync(creditPlanProjectItemId.Value, finYear);
                if (ctVote != null && ctVote.VoteId != null)
                {
                    userCreditVoteId = ctVote.VoteId;
                    userCreditPPIId = ctVote.PlanProjectItem_ID;
                    userCreditScoaItemId = ctVote.SCOAItemID;
                    userCreditPlanProjectId = ctVote.ProjectID;
                    userCreditScoaFundId = ctVote.SCOAFundId;
                    userCreditScoaRegionId = ctVote.SCOARegionId;
                    userCreditScoaCostingId = ctVote.SCOACostingID;
                    userCreditScoaFunctionId = ctVote.SCOAFunctionId;
                    userCreditDivisionId = ctVote.DivisionId;
                }
            }

            var effDebitVoteId = userDebitVoteId ?? mscoaConfig?.DebitVoteId;
            var effDebitPPIId = userDebitPPIId ?? mscoaConfig?.DebitPlanProjectItemId;
            var effDebitScoaItemId = userDebitScoaItemId ?? mscoaConfig?.DebitScoaItemId;
            var effDebitPlanProjectId = userDebitPlanProjectId ?? mscoaConfig?.DebitPlanProjectId;
            var effDebitScoaFundId = userDebitScoaFundId ?? mscoaConfig?.DebitScoaFundId;
            var effDebitScoaRegionId = userDebitScoaRegionId ?? mscoaConfig?.DebitScoaRegionId;
            var effDebitScoaCostingId = userDebitScoaCostingId ?? mscoaConfig?.DebitScoaCostingId;
            var effDebitScoaFunctionId = userDebitScoaFunctionId ?? mscoaConfig?.DebitScoaFunctionId;
            var effDebitDivisionId = userDebitDivisionId ?? mscoaConfig?.DebitDivisionId;

            var effCreditVoteId = userCreditVoteId ?? mscoaConfig?.CreditVoteId;
            var effCreditPPIId = userCreditPPIId ?? mscoaConfig?.CreditPlanProjectItemId;
            var effCreditScoaItemId = userCreditScoaItemId ?? mscoaConfig?.CreditScoaItemId;
            var effCreditPlanProjectId = userCreditPlanProjectId ?? mscoaConfig?.CreditPlanProjectId;
            var effCreditScoaFundId = userCreditScoaFundId ?? mscoaConfig?.CreditScoaFundId;
            var effCreditScoaRegionId = userCreditScoaRegionId ?? mscoaConfig?.CreditScoaRegionId;
            var effCreditScoaCostingId = userCreditScoaCostingId ?? mscoaConfig?.CreditScoaCostingId;
            var effCreditScoaFunctionId = userCreditScoaFunctionId ?? mscoaConfig?.CreditScoaFunctionId;
            var effCreditDivisionId = userCreditDivisionId ?? mscoaConfig?.CreditDivisionId;

            int journalTransactionTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""AssetJournalTransactionType_ID"", 0) FROM ""Const_AssetJournalTransactionType_Sys""
                WHERE ""AssetJournalTransactionDesc"" = 'Asset Refurbishment' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
            if (journalTransactionTypeId == 0) journalTransactionTypeId = 37;

            int glDocumentTypeId = await _lookupService.GetDocumentTypeIdAsync(conn, "Asset Refurbishment", txn);
            if (glDocumentTypeId == 0) glDocumentTypeId = 2316167;

            string documentNumber = await _txnService.GenerateDocumentNumber(conn, glDocumentTypeId, txn);
            int intDocNumber = int.TryParse(documentNumber.Split('/').LastOrDefault(), out var dn) ? dn : 1;
            int processingMonth = await _txnService.GetProcessingMonth(conn, 1, txn);

            decimal glAmount = refurbDT - refurbCT;
            int journalId = await _txnService.InsertJournalAsset(conn, txn,
                finYear, processingMonth, transactionId, journalTransactionTypeId,
                refurbDate, effDebitVoteId, effCreditVoteId,
                glAmount, documentNumber, intDocNumber, assetRegId,
                scoaFundsId: effDebitScoaFundId,
                scoaRegionId: effDebitScoaRegionId,
                scoaCostingId: effDebitScoaCostingId,
                scoaFunctionId: effDebitScoaFunctionId,
                scoaItemId: effDebitScoaItemId,
                divisionId: effDebitDivisionId,
                itemDescription: "Asset Refurbishment");

            var refurbOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
                conn, txn, "ASSET_REVALUATION", documentNumber);

            if (refurbDT > 0 && effDebitVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    refurbDate, processingMonth, effDebitVoteId, finYear,
                    journalTransactionTypeId, "Asset Refurbishment - Acquisition", documentNumber,
                    debit: refurbDT, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: effDebitScoaFundId, scoaRegionId: effDebitScoaRegionId,
                    scoaCostingId: effDebitScoaCostingId,
                    scoaProjectId: effDebitPlanProjectId, scoaFunctionId: effDebitScoaFunctionId,
                    scoaItemId: effDebitScoaItemId ?? 0,
                    divisionId: effDebitDivisionId,
                    projectId: effDebitPlanProjectId, planProjectItemId: effDebitPPIId,
                        outboxId: refurbOutboxId);
            }

            if (refurbDT > 0 && effCreditVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    refurbDate, processingMonth, effCreditVoteId, finYear,
                    journalTransactionTypeId, "Asset Refurbishment - Acquisition Offset", documentNumber,
                    debit: null, credit: refurbDT, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: effCreditScoaFundId, scoaRegionId: effCreditScoaRegionId,
                    scoaCostingId: effCreditScoaCostingId,
                    scoaProjectId: effCreditPlanProjectId, scoaFunctionId: effCreditScoaFunctionId,
                    scoaItemId: effCreditScoaItemId ?? 0,
                    divisionId: effCreditDivisionId,
                    projectId: effCreditPlanProjectId, planProjectItemId: effCreditPPIId,
                        outboxId: refurbOutboxId);
            }

            decimal costCreditAmount = refurbDepreciation + refurbCT + refurbImpairment;
            if (costCreditAmount > 0 && effCreditVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    refurbDate, processingMonth, effCreditVoteId, finYear,
                    journalTransactionTypeId, "Asset Refurbishment - Cost", documentNumber,
                    debit: null, credit: costCreditAmount, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: effCreditScoaFundId, scoaRegionId: effCreditScoaRegionId,
                    scoaCostingId: effCreditScoaCostingId,
                    scoaProjectId: effCreditPlanProjectId, scoaFunctionId: effCreditScoaFunctionId,
                    scoaItemId: effCreditScoaItemId ?? 0,
                    divisionId: effCreditDivisionId,
                    projectId: effCreditPlanProjectId, planProjectItemId: effCreditPPIId,
                        outboxId: refurbOutboxId);
            }

            if (refurbDepreciation > 0 && effDebitVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    refurbDate, processingMonth, effDebitVoteId, finYear,
                    journalTransactionTypeId, "Asset Refurbishment - AccumulatedDepreciation", documentNumber,
                    debit: refurbDepreciation, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: effDebitScoaFundId, scoaRegionId: effDebitScoaRegionId,
                    scoaCostingId: effDebitScoaCostingId,
                    scoaProjectId: effDebitPlanProjectId, scoaFunctionId: effDebitScoaFunctionId,
                    scoaItemId: effDebitScoaItemId ?? 0,
                    divisionId: effDebitDivisionId,
                    projectId: effDebitPlanProjectId, planProjectItemId: effDebitPPIId,
                        outboxId: refurbOutboxId);
            }

            if (refurbCT > 0 && effDebitVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    refurbDate, processingMonth, effDebitVoteId, finYear,
                    journalTransactionTypeId, "Asset Refurbishment - DisposalLoss", documentNumber,
                    debit: refurbCT, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: effDebitScoaFundId, scoaRegionId: effDebitScoaRegionId,
                    scoaCostingId: effDebitScoaCostingId,
                    scoaProjectId: effDebitPlanProjectId, scoaFunctionId: effDebitScoaFunctionId,
                    scoaItemId: effDebitScoaItemId ?? 0,
                    divisionId: effDebitDivisionId,
                    projectId: effDebitPlanProjectId, planProjectItemId: effDebitPPIId,
                        outboxId: refurbOutboxId);
            }

            if (refurbRevaluation > 0 && effDebitVoteId != null && effCreditVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    refurbDate, processingMonth, effDebitVoteId, finYear,
                    journalTransactionTypeId, "Asset Refurbishment - RevaluationReserve", documentNumber,
                    debit: refurbRevaluation, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: effDebitScoaFundId, scoaRegionId: effDebitScoaRegionId,
                    scoaCostingId: effDebitScoaCostingId,
                    scoaProjectId: effDebitPlanProjectId, scoaFunctionId: effDebitScoaFunctionId,
                    scoaItemId: effDebitScoaItemId ?? 0,
                    divisionId: effDebitDivisionId,
                    projectId: effDebitPlanProjectId, planProjectItemId: effDebitPPIId,
                        outboxId: refurbOutboxId);

                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    refurbDate, processingMonth, effCreditVoteId, finYear,
                    journalTransactionTypeId, "Asset Refurbishment - Accumulated Surplus", documentNumber,
                    debit: null, credit: refurbRevaluation, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: effCreditScoaFundId, scoaRegionId: effCreditScoaRegionId,
                    scoaCostingId: effCreditScoaCostingId,
                    scoaProjectId: effCreditPlanProjectId, scoaFunctionId: effCreditScoaFunctionId,
                    scoaItemId: effCreditScoaItemId ?? 0,
                    divisionId: effCreditDivisionId,
                    projectId: effCreditPlanProjectId, planProjectItemId: effCreditPPIId,
                        outboxId: refurbOutboxId);
            }

            if (refurbImpairment > 0 && effDebitVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    refurbDate, processingMonth, effDebitVoteId, finYear,
                    journalTransactionTypeId, "Asset Refurbishment - AccumulatedImpairment", documentNumber,
                    debit: refurbImpairment, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: effDebitScoaFundId, scoaRegionId: effDebitScoaRegionId,
                    scoaCostingId: effDebitScoaCostingId,
                    scoaProjectId: effDebitPlanProjectId, scoaFunctionId: effDebitScoaFunctionId,
                    scoaItemId: effDebitScoaItemId ?? 0,
                    divisionId: effDebitDivisionId,
                    projectId: effDebitPlanProjectId, planProjectItemId: effDebitPPIId,
                        outboxId: refurbOutboxId);
            }

            decimal netRefurbCost = refurbDT - refurbCT;
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items""
                SET ""PurchaseAmount"" = COALESCE(""PurchaseAmount"", 0) + @netRefurbCost,
                    ""AccumulatedDepreciationClosingBalance"" = COALESCE(""AccumulatedDepreciationClosingBalance"", 0) - @refurbDepreciation,
                    ""AccumulatedImpairmentClosingBalance"" = GREATEST(0, COALESCE(""AccumulatedImpairmentClosingBalance"", 0) - @refurbImpairment),
                    ""RevaluationReserveClosingBalance"" = COALESCE(""RevaluationReserveClosingBalance"", 0) - @refurbRevaluation,
                    ""CarryingAmountClosingBalance"" = COALESCE(""CarryingAmountClosingBalance"", 0) + @netRefurbCost + @refurbDepreciation + @refurbImpairment,
                    ""CurrentAmount"" = COALESCE(""CurrentAmount"", ""CarryingAmountClosingBalance"", 0) + @netRefurbCost + @refurbDepreciation + @refurbImpairment,
                    ""DateModified"" = NOW()
                WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { netRefurbCost, refurbDepreciation, refurbRevaluation, refurbImpairment, assetRegId }, txn);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Refurb""
                SET ""isApproved"" = TRUE, ""DateModified"" = NOW(), ""ModifierID"" = @approvedBy
                WHERE ""Asset_RefurbID"" = @id",
                new { approvedBy = request.ApprovedBy, id }, txn);

            await _txnService.PopulateTransactionSummarySingle(conn, txn, assetRegId, finYear, fyPeriod);

            await txn.CommitAsync();

            if (catchUpGlOutboxId.HasValue)
                await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(refurbOutboxId, catchUpGlOutboxId.Value);
            else
                await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(refurbOutboxId);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_WorkflowInstances""
                SET ""status"" = 'approved', ""completed_at"" = NOW()
                WHERE ""entity_type"" = 'refurbishment' AND ""mssql_reference_id"" = @refId AND ""status"" IN ('pending', 'in_progress')",
                new { refId = id.ToString() });

            var refurbTokens = await _emailService.BuildAssetBaseTokensAsync(conn, assetRegId);
            refurbTokens["RefurbishmentDate"]      = refurbDate.ToString("dd MMM yyyy");
            refurbTokens["RefurbishmentDebit"]     = refurbDT.ToString("N2");
            refurbTokens["RefurbishmentCredit"]    = refurbCT.ToString("N2");
            refurbTokens["DepreciationAdjustment"] = refurbDepreciation.ToString("N2");
            refurbTokens["RevaluationAdjustment"]  = refurbRevaluation.ToString("N2");
            refurbTokens["ImpairmentAdjustment"]   = refurbImpairment.ToString("N2");
            refurbTokens["DebitProject"]  = effDebitPPIId?.ToString() ?? "";
            refurbTokens["CreditProject"] = effCreditPPIId?.ToString() ?? "";
            var debitScoaDesc = "";
            var creditScoaDesc = "";
            try
            {
                if (effDebitScoaItemId.HasValue)
                {
                    var sRow = await conn.QueryFirstOrDefaultAsync<dynamic>(
                        @"SELECT COALESCE(""ScoaShortDesc"", '') AS desc FROM ""Const_SCOA_Structure"" WHERE ""ScoaID"" = @sId",
                        new { sId = effDebitScoaItemId.Value });
                    debitScoaDesc = (string?)(sRow?.desc) ?? "";
                }
                if (effCreditScoaItemId.HasValue)
                {
                    var sRow = await conn.QueryFirstOrDefaultAsync<dynamic>(
                        @"SELECT COALESCE(""ScoaShortDesc"", '') AS desc FROM ""Const_SCOA_Structure"" WHERE ""ScoaID"" = @sId",
                        new { sId = effCreditScoaItemId.Value });
                    creditScoaDesc = (string?)(sRow?.desc) ?? "";
                }
            }
            catch { }
            refurbTokens["DebitScoaItem"]  = debitScoaDesc;
            refurbTokens["CreditScoaItem"] = creditScoaDesc;
            refurbTokens["FinancialYear"]          = finYear;
            _ = _emailService.SendTransactionEmailsAsync("Refurbishment", refurbTokens);
            return Ok(new { success = 1, transactionId, catchUpDepreciation });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            Console.Error.WriteLine($"[REFURBISHMENT APPROVAL ERROR] id={id}: {ex}");
            return StatusCode(500, new { error = "Approval failed", details = ex.Message });
        }
    }

    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] RefurbRejectRequest? request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var existing = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""Asset_RefurbID"", ""AssetRegisterID"", ""FinancialYear"", ""FinancialPeriod"", ""isApproved"" FROM ""Asset_Refurb""
            WHERE ""Asset_RefurbID"" = @id", new { id });
        if (existing is null) return NotFound(new { error = "Refurbishment not found" });
        if (existing.isApproved == true) return BadRequest(new { error = "Cannot reject an already approved refurbishment" });

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WorkflowInstances""
            SET ""status"" = 'rejected', ""completed_at"" = NOW()
            WHERE ""entity_type"" = 'refurbishment' AND ""mssql_reference_id"" = @refId AND ""status"" IN ('pending', 'in_progress')",
            new { refId = id.ToString() });

        int assetRegId = (int)(existing.AssetRegisterID ?? 0);
        string finYear = (string)(existing.FinancialYear ?? "");
        int finPeriod = (int)(existing.FinancialPeriod ?? 1);
        if (assetRegId > 0 && !string.IsNullOrEmpty(finYear))
            await _txnService.PopulateTransactionSummarySingle(assetRegId, finYear, finPeriod);

        return Ok(new { success = 1 });
    }

    private async Task<Guid> PostCatchUpDepreciationForRefurbishment(DbConnection conn, DbTransaction txn,
        int assetRegId, decimal catchUpAmount, DateTime transactionDate, string finYear, int catchUpDays,
        dynamic effective, decimal remainingUsefulLifeMonths)
    {
        var depMscoaConfig = await _txnService.LookupMscoaConfig(conn, assetRegId, "Depreciation", finYear, txn);
        var depConfigErrors = _txnService.ValidateMscoaConfig(depMscoaConfig, "Depreciation", assetRegId);
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
            transactionDate, depMscoaConfig?.DebitVoteId, depMscoaConfig?.CreditVoteId, catchUpAmount,
            depDocNumber, depIntDocNum, assetRegId,
            scoaFundsId: depMscoaConfig?.DebitScoaFundId,
            scoaRegionId: depMscoaConfig?.DebitScoaRegionId,
            scoaCostingId: depMscoaConfig?.DebitScoaCostingId,
            scoaFunctionId: depMscoaConfig?.DebitScoaFunctionId,
            scoaItemId: depMscoaConfig?.DebitScoaItemId,
            divisionId: depMscoaConfig?.DebitDivisionId,
            itemDescription: "Asset Depreciation - Catch-up to Refurbishment Date",
            depRunType: "CatchUp");

        var refurbCatchUpOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
            conn, txn, "ASSET_DEPRECIATION", depDocNumber);

        if (depMscoaConfig?.DebitVoteId != null)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, depMscoaConfig.DebitVoteId, finYear,
                depJournalTypeId, "Asset Depreciation - Catch-up to Refurbishment Date", depDocNumber,
                debit: catchUpAmount, credit: null, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: depMscoaConfig.DebitScoaFundId, scoaRegionId: depMscoaConfig.DebitScoaRegionId,
                scoaCostingId: depMscoaConfig.DebitScoaCostingId,
                scoaProjectId: depMscoaConfig.DebitPlanProjectId, scoaFunctionId: depMscoaConfig.DebitScoaFunctionId,
                scoaItemId: depMscoaConfig.DebitScoaItemId ?? 0,
                divisionId: depMscoaConfig.DebitDivisionId,
                projectId: depMscoaConfig.DebitPlanProjectId, planProjectItemId: depMscoaConfig.DebitPlanProjectItemId,
                    outboxId: refurbCatchUpOutboxId);
        }

        if (depMscoaConfig?.CreditVoteId != null)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, depMscoaConfig.CreditVoteId, finYear,
                depJournalTypeId, "Asset Depreciation - Catch-up to Refurbishment Date", depDocNumber,
                debit: null, credit: catchUpAmount, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: depMscoaConfig.CreditScoaFundId, scoaRegionId: depMscoaConfig.CreditScoaRegionId,
                scoaCostingId: depMscoaConfig.CreditScoaCostingId,
                scoaProjectId: depMscoaConfig.CreditPlanProjectId, scoaFunctionId: depMscoaConfig.CreditScoaFunctionId,
                scoaItemId: depMscoaConfig.CreditScoaItemId ?? 0,
                divisionId: depMscoaConfig.CreditDivisionId,
                projectId: depMscoaConfig.CreditPlanProjectId, planProjectItemId: depMscoaConfig.CreditPlanProjectItemId,
                    outboxId: refurbCatchUpOutboxId);
        }

        decimal revaluationReserve = (decimal)effective.RevaluationReserve;
        decimal depreciationOffset = 0m;
        if (revaluationReserve > 0 && remainingUsefulLifeMonths > 0)
        {
            decimal totalRemainingDays = remainingUsefulLifeMonths / 12m * 365m;
            if (totalRemainingDays > 0)
            {
                depreciationOffset = Math.Round(revaluationReserve / totalRemainingDays * catchUpDays, 2);
                if (depreciationOffset > revaluationReserve) depreciationOffset = revaluationReserve;
            }
        }

        decimal postedOffset = 0m;
        if (depreciationOffset > 0 && depMscoaConfig?.OffsetVoteId != null && depMscoaConfig?.ReserveVoteId != null)
        {
            postedOffset = depreciationOffset;

            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, depMscoaConfig.ReserveVoteId, finYear,
                depJournalTypeId, "Asset Depreciation Offset - Catch-up", depDocNumber,
                debit: postedOffset, credit: null, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: depMscoaConfig.ReserveScoaFundId, scoaRegionId: depMscoaConfig.ReserveScoaRegionId,
                scoaCostingId: depMscoaConfig.ReserveScoaCostingId,
                scoaProjectId: depMscoaConfig.ReservePlanProjectId, scoaFunctionId: depMscoaConfig.ReserveScoaFunctionId,
                scoaItemId: depMscoaConfig.ReserveScoaItemId ?? 0,
                divisionId: depMscoaConfig.ReserveDivisionId,
                projectId: depMscoaConfig.ReservePlanProjectId, planProjectItemId: depMscoaConfig.ReservePlanProjectItemId,
                    outboxId: refurbCatchUpOutboxId);

            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, depMscoaConfig.OffsetVoteId, finYear,
                depJournalTypeId, "Asset Depreciation Offset - Catch-up", depDocNumber,
                debit: null, credit: postedOffset, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: depMscoaConfig.OffsetScoaFundId, scoaRegionId: depMscoaConfig.OffsetScoaRegionId,
                scoaCostingId: depMscoaConfig.OffsetScoaCostingId,
                scoaProjectId: depMscoaConfig.OffsetPlanProjectId, scoaFunctionId: depMscoaConfig.OffsetScoaFunctionId,
                scoaItemId: depMscoaConfig.OffsetScoaItemId ?? 0,
                divisionId: depMscoaConfig.OffsetDivisionId,
                projectId: depMscoaConfig.OffsetPlanProjectId, planProjectItemId: depMscoaConfig.OffsetPlanProjectItemId,
                    outboxId: refurbCatchUpOutboxId);
        }

        int depTransTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
            SELECT COALESCE(""ReferenceData_ID"", 0) FROM ""Const_ReferenceData_sys""
            WHERE ""Description"" = 'Depreciation' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
        if (depTransTypeId == 0) depTransTypeId = 1;

        decimal currentAccDep = (decimal)effective.AccumulatedDepreciation;
        decimal newAccDep = currentAccDep + catchUpAmount;
        decimal currentCarrying = (decimal)effective.CarryingAmount;
        decimal newCarrying = currentCarrying - catchUpAmount;

        var assetData = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""UsefulLifeMonthComponent"",
                   COALESCE(""AssetType_ID"", 0) AS ""AssetType_ID"",
                   COALESCE(""AssetCategory_ID"", 0) AS ""AssetCategory_ID"",
                   COALESCE(""Asset_SubCategory_ID"", 0) AS ""Asset_SubCategory_ID"",
                   COALESCE(""MeasurementType_ID"", 0) AS ""MeasurementType_ID"",
                   COALESCE(""AssetStatus_ID"", 0) AS ""AssetStatus_ID""
            FROM ""Asset_Register_Items""
            WHERE ""AssetRegisterItem_ID"" = @assetRegId", new { assetRegId }, txn);

        decimal? origUsefulLife = assetData?.UsefulLifeMonthComponent;
        decimal monthsConsumed = catchUpDays > 0 ? Math.Round((decimal)catchUpDays / 30.44m, 8) : 0m;
        decimal adjustedRul = remainingUsefulLifeMonths - monthsConsumed;
        if (adjustedRul < 0) adjustedRul = 0;

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
            VALUES (@finYear, NOW(), 2, 2, NOW(), 1, @transactionDate, 2, 1)
            ON CONFLICT (""FinYear"") DO UPDATE SET ""RunDate"" = NOW()
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
                assetTypeId = (int)(assetData?.AssetType_ID ?? 0),
                assetCategoryId = (int)(assetData?.AssetCategory_ID ?? 0),
                assetSubCategoryId = (int)(assetData?.Asset_SubCategory_ID ?? 0),
                measurementTypeId = (int)(assetData?.MeasurementType_ID ?? 0),
                assetStatusId = (int)(assetData?.AssetStatus_ID ?? 0),
                fyPeriod, finYear
            }, txn);

        await conn.ExecuteAsync(@"
            INSERT INTO ""Asset_Depreciation"" (""AssetRegisterItem_ID"", ""DepreciationDate"",
                ""DepreciationAmount"", ""AccumulatedDepreciation"", ""CarryingAmount"",
                ""RunType_ID"", ""RunStatus_ID"", ""FinYear"", ""MonthID"",
                ""Depreciation_ScheduledItemID"", ""DaysFromLastRun"", ""DateCaptured"", ""CapturerID"", ""IsApproved"")
            VALUES (@assetRegId, @transactionDate, @catchUpAmount, @newAccDep, @newCarrying,
                2, 2, @finYear, @fyPeriod, @scheduleItemId, @catchUpDays, NOW(), 1, 1)",
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

        return refurbCatchUpOutboxId;
    }
}

public class RefurbApprovalRequest
{
    public int ApprovedBy { get; set; }
}

public class RefurbRejectRequest
{
    public string? Reason { get; set; }
}
