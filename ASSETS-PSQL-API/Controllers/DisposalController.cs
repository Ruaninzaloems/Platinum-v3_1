using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data.Common;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/disposals")]
public class DisposalController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;
    private readonly LookupService _lookupService;

    public DisposalController(DbConnectionFactory db, TransactionService txnService, LookupService lookupService)
    {
        _db = db;
        _txnService = txnService;
        _lookupService = lookupService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear, [FromQuery] string? status)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""AssetDisposal_ID"", ""AssetItemID"" AS ""AssetRegisterItem_ID"", ""DisposalDate"", ""AssetDisposalMethodID"" AS ""DisposalMethod_ID"", ""SalePrice"", ""CarryingAmount"", ""AmountProfitLoss"" AS ""ProfitLoss"", ""DisposalReason"" AS ""Reason"", ""Status"", ""FinYear"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"" FROM ""Asset_Disposal"" WHERE 1=1";
        var parameters = new DynamicParameters();
        if (!string.IsNullOrEmpty(finYear))
        {
            sql += @" AND ""FinYear"" = @finYear";
            parameters.Add("finYear", finYear);
        }
        if (!string.IsNullOrEmpty(status))
        {
            sql += @" AND ""Status"" = @status";
            parameters.Add("status", status);
        }
        sql += @" ORDER BY ""AssetDisposal_ID"" DESC";
        var items = await conn.QueryAsync<AssetDisposal>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetDisposal>(
            @"SELECT ""AssetDisposal_ID"", ""AssetItemID"" AS ""AssetRegisterItem_ID"", ""DisposalDate"", ""AssetDisposalMethodID"" AS ""DisposalMethod_ID"", ""SalePrice"", ""CarryingAmount"", ""AmountProfitLoss"" AS ""ProfitLoss"", ""DisposalReason"" AS ""Reason"", ""Status"", ""FinYear"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"" FROM ""Asset_Disposal"" WHERE ""AssetDisposal_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Disposal record not found" }) : Ok(item);
    }

    [HttpGet("{id:int}/detail")]
    public async Task<IActionResult> GetDetail(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var disp = await conn.QueryFirstOrDefaultAsync<AssetDisposal>(
            @"SELECT ""AssetDisposal_ID"", ""AssetItemID"" AS ""AssetRegisterItem_ID"", ""DisposalDate"", ""AssetDisposalMethodID"" AS ""DisposalMethod_ID"", ""SalePrice"", ""CarryingAmount"", ""AmountProfitLoss"" AS ""ProfitLoss"", ""DisposalReason"" AS ""Reason"", ""Status"", ""FinYear"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"" FROM ""Asset_Disposal"" WHERE ""AssetDisposal_ID"" = @id", new { id });
        if (disp == null) return NotFound(new { error = "Disposal record not found" });

        int assetId = disp.AssetRegisterItem_ID ?? 0;
        DateTime txnDate = disp.DisposalDate ?? DateTime.Today;

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

        decimal salePrice = disp.SalePrice ?? 0m;
        decimal profitLoss = salePrice - adjustedCarrying;
        string? methodName = null;
        if (disp.DisposalMethod_ID.HasValue)
            methodName = await conn.QueryFirstOrDefaultAsync<string>(
                @"SELECT ""AssetDisposalMethodDesc"" FROM ""Const_AssetDisposalMethod"" WHERE ""AssetDisposalMethod_ID"" = @id",
                new { id = disp.DisposalMethod_ID.Value });

        return Ok(new
        {
            transaction = disp,
            asset,
            projected = new
            {
                carryingBeforeCatchUp,
                carryingAmount = adjustedCarrying,
                accumulatedDepreciation = projected.AccumulatedDepreciation,
                revalReserve = projected.RevaluationReserve,
                profitLoss,
                salePrice,
                disposalMethodName = methodName,
                catchUpDays,
                catchUpDep = catchUpDep > 0 ? (decimal?)catchUpDep : null,
                dailyRate = dailyRate > 0 ? (decimal?)dailyRate : null,
                adjustedCarrying = catchUpDep > 0 ? (decimal?)adjustedCarrying : null
            }
        });
    }

    [HttpGet("asset-last-dep-date/{assetRegId:int}")]
    public async Task<IActionResult> GetAssetLastDepDate(int assetRegId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
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
        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""InserviceDate"" FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId",
            new { assetRegId });
        string? dateStr = null;
        if (lastDepDate.HasValue)
            dateStr = lastDepDate.Value.ToString("yyyy-MM-dd");
        else if (asset?.InserviceDate != null)
            dateStr = ((DateTime)asset.InserviceDate).ToString("yyyy-MM-dd");
        return Ok(new { lastDepDate = dateStr });
    }

    [HttpGet("by-asset/{assetId:int}")]
    public async Task<IActionResult> GetByAsset(int assetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<AssetDisposal>(
            @"SELECT ""AssetDisposal_ID"", ""AssetItemID"" AS ""AssetRegisterItem_ID"", ""DisposalDate"", ""AssetDisposalMethodID"" AS ""DisposalMethod_ID"", ""SalePrice"", ""CarryingAmount"", ""AmountProfitLoss"" AS ""ProfitLoss"", ""DisposalReason"" AS ""Reason"", ""Status"", ""FinYear"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"" FROM ""Asset_Disposal"" WHERE ""AssetItemID"" = @assetId ORDER BY ""AssetDisposal_ID"" DESC",
            new { assetId });
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetDisposal model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""AssetRegisterItem_ID"", ""CarryingAmountClosingBalance"" FROM ""Asset_Register_Items""
              WHERE ""AssetRegisterItem_ID"" = @AssetRegisterItem_ID",
            new { model.AssetRegisterItem_ID });

        if (asset is null) return NotFound(new { error = "Asset not found" });

        decimal carryingAmount;
        var approvalMethod = await _txnService.GetApprovalMethod(conn);
        if (model.DisposalDate.HasValue && model.AssetRegisterItem_ID.HasValue)
        {
            if (approvalMethod == "Automated")
            {
                bool duplicate = await _txnService.HasPendingTransactionInMonth(conn, "disposal", model.AssetRegisterItem_ID.Value, model.DisposalDate.Value);
                if (duplicate)
                    return BadRequest(new { error = $"A disposal already exists for this asset in {model.DisposalDate.Value:MMMM yyyy}. Only one disposal per asset per month is allowed in Automated mode." });
            }
            else
            {
                var pendingType = await _txnService.GetPendingTransactionTypeForAsset(conn, model.AssetRegisterItem_ID.Value, model.DisposalDate.Value);
                if (pendingType != null)
                    return BadRequest(new { error = $"There is an unapproved {pendingType} for this asset in {model.DisposalDate.Value:MMMM yyyy}. Please approve or reject it before capturing a new transaction." });
            }

            // Cutoff validation — after duplicate checks, transaction must be on or before the next scheduled run's month-end date
            var (dispCutoffDate, _, _) = await _txnService.GetNextRunCutoffDateAsync(conn);
            if (model.DisposalDate.Value.Date > dispCutoffDate.Date)
                return BadRequest(new { error = $"Transaction date {model.DisposalDate.Value:dd MMM yyyy} exceeds the next scheduled run's month-end date of {dispCutoffDate:dd MMM yyyy}. Please capture a date on or before this cutoff." });

            var projValues = await _txnService.GetEffectiveAssetValues(conn, model.AssetRegisterItem_ID.Value, model.DisposalDate.Value);
            carryingAmount = projValues.CarryingAmount;
        }
        else
        {
            carryingAmount = (decimal)(asset.CarryingAmountClosingBalance ?? 0m);
        }

        decimal salePrice = model.SalePrice ?? 0m;
        decimal profitLoss = salePrice - carryingAmount;

        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_Disposal"" (""AssetItemID"", ""DisposalDate"", ""AssetDisposalMethodID"",
                ""SalePrice"", ""CarryingAmount"", ""AmountProfitLoss"", ""DisposalReason"", ""Status"", ""FinYear"",
                ""DateCaptured"", ""CapturerID"")
            VALUES (@AssetRegisterItem_ID, @DisposalDate, @DisposalMethod_ID,
                @SalePrice, @carryingAmount, @profitLoss, @Reason, 'Pending', @FinYear, GETDATE(), 1)
            RETURNING ""AssetDisposal_ID""",
            new { model.AssetRegisterItem_ID, model.DisposalDate, model.DisposalMethod_ID,
                  model.SalePrice, carryingAmount, profitLoss, model.Reason, model.FinYear });
        model.AssetDisposal_ID = id;
        model.CarryingAmount = carryingAmount;
        model.ProfitLoss = profitLoss;
        model.Status = "Pending";

        if (approvalMethod == "Automated" && model.AssetRegisterItem_ID.HasValue && model.DisposalDate.HasValue)
            await _txnService.RecalculatePendingAfterDate(conn, model.AssetRegisterItem_ID.Value, model.DisposalDate.Value, model.FinYear);

        var defId = await conn.QueryFirstOrDefaultAsync<int?>(@"
            SELECT ""id"" FROM ""Asset_WorkflowDefinitions"" WHERE ""entity_type"" = 'disposal' AND ""is_active"" = TRUE OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY");
        if (defId.HasValue)
        {
            var wfData = System.Text.Json.JsonSerializer.Serialize(new { assetId = model.AssetRegisterItem_ID, salePrice = model.SalePrice, carryingAmount, profitLoss, disposalDate = model.DisposalDate?.ToString("yyyy-MM-dd"), reason = model.Reason });
            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_WorkflowInstances"" (""definition_id"", ""entity_type"", ""entity_id"", ""current_step"", ""status"", ""initiated_by"", ""data"", ""mssql_reference_id"")
                VALUES (@defId, 'disposal', @entityId, 1, 'pending', 1, @wfData::jsonb, @refId)",
                new { defId = defId.Value, entityId = id.ToString(), wfData, refId = id.ToString() });
        }

        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetDisposal model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_Disposal""
            SET ""DisposalDate"" = @DisposalDate, ""AssetDisposalMethodID"" = @DisposalMethod_ID,
                ""SalePrice"" = @SalePrice, ""DisposalReason"" = @Reason, ""FinYear"" = @FinYear,
                ""DateModified"" = GETDATE()
            WHERE ""AssetDisposal_ID"" = @id AND ""Status"" = 'Pending'",
            new { model.DisposalDate, model.DisposalMethod_ID, model.SalePrice, model.Reason, model.FinYear, id });
        return rows == 0 ? NotFound(new { error = "Disposal not found or already processed" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"DELETE FROM ""Asset_Disposal"" WHERE ""AssetDisposal_ID"" = @id AND ""Status"" = 'Pending'", new { id });
        return rows == 0 ? NotFound(new { error = "Disposal not found or already processed" }) : Ok(new { success = 1 });
    }

    [HttpPost("{id:int}/submit-for-approval")]
    public async Task<IActionResult> SubmitForApproval(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_Disposal"" SET ""Status"" = 'Submitted', ""DateModified"" = GETDATE()
            WHERE ""AssetDisposal_ID"" = @id AND ""Status"" = 'Pending'", new { id });
        if (rows == 0) return NotFound(new { error = "Disposal not found or not in pending status" });

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WorkflowInstances""
            SET ""status"" = 'in_progress', ""current_step"" = 2
            WHERE ""entity_type"" = 'disposal' AND ""mssql_reference_id"" = @refId AND ""status"" = 'pending'",
            new { refId = id.ToString() });

        return Ok(new { success = 1 });
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] DisposalApprovalRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var disposal = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""AssetDisposal_ID"", ""AssetItemID"" AS ""AssetRegisterItem_ID"", ""DisposalDate"", ""SalePrice"", ""FinYear"", ""Status"", ""Approved"", ""ApprovedDate"", ""ApprovedBy"" FROM ""Asset_Disposal"" WHERE ""AssetDisposal_ID"" = @id", new { id });
        if (disposal is null) return NotFound(new { error = "Disposal not found" });

        if ((int)(disposal.Approved ?? 0) == 1)
            return Ok(new { success = 1, alreadyApproved = 1, message = "Disposal already approved" });

        int assetRegId = (int)(disposal.AssetRegisterItem_ID ?? 0);
        string finYear = (string)(disposal.FinYear ?? _txnService.GetCurrentFinancialPeriod().year);
        DateTime disposalDate = disposal.DisposalDate != null ? (DateTime)disposal.DisposalDate : DateTime.Now;
        decimal salePrice = (decimal)(disposal.SalePrice ?? 0m);

        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ""AssetRegisterItem_ID"", ""PurchaseAmount"",
                       COALESCE(""AccumulatedDepreciationClosingBalance"", 0) AS ""AccDepreciation"",
                       COALESCE(""AccumulatedImpairmentClosingBalance"", 0) AS ""AccImpairment"",
                       COALESCE(""RevaluationReserveClosingBalance"", COALESCE(""RevaluationOpeningBalance"", 0)) AS ""RevaluationReserve"",
                       COALESCE(""CurrentReplacementCostCRC"", 0) AS ""CRC"",
                       COALESCE(""CurrentAmount"", ""CarryingAmountClosingBalance"", 0) AS ""CarryingValue"",
                       COALESCE(""RevaluationValue"", 0) AS ""RevaluationValue"",
                       ""RemainingUsefulLife"", ""UsefulLifeMonthComponent"", ""ResidualValue"", ""InserviceDate"",
                       COALESCE(""AssetType_ID"", 0) AS ""AssetType_ID"",
                       COALESCE(""AssetCategory_ID"", 0) AS ""AssetCategory_ID"",
                       COALESCE(""Asset_SubCategory_ID"", 0) AS ""Asset_SubCategory_ID"",
                       COALESCE(""MeasurementType_ID"", 0) AS ""MeasurementType_ID"",
                       COALESCE(""AssetStatus_ID"", 0) AS ""AssetStatus_ID""
                FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { assetRegId }, txn);

            if (asset is null)
            {
                await txn.RollbackAsync();
                return NotFound(new { error = "Asset not found" });
            }

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

            DateTime depFromDate;
            if (lastDepDate.HasValue)
                depFromDate = lastDepDate.Value;
            else if (asset.InserviceDate != null)
                depFromDate = (DateTime)asset.InserviceDate;
            else
                depFromDate = DateTime.Parse("2024-07-01");

            decimal remainingUsefulLifeMonths = (decimal)(asset.RemainingUsefulLife ?? asset.UsefulLifeMonthComponent ?? 0m);
            int catchUpDays = (int)(disposalDate - depFromDate).TotalDays;
            if (catchUpDays < 0) catchUpDays = 0;
            decimal catchUpDepreciation = 0m;

            if (catchUpDays > 0 && remainingUsefulLifeMonths > 0)
            {
                decimal currentValue = (decimal)(asset.CarryingValue ?? 0m);
                decimal residual = (decimal)(asset.ResidualValue ?? 0m);
                decimal depreciableAmount = currentValue - residual;
                if (depreciableAmount < 0) depreciableAmount = 0;

                int maxDepDays = (int)(remainingUsefulLifeMonths * 30.44m);
                if (catchUpDays > maxDepDays) catchUpDays = maxDepDays;

                catchUpDepreciation = Math.Round(depreciableAmount * 12m / remainingUsefulLifeMonths / 365m * catchUpDays, 2);
                if (catchUpDepreciation > depreciableAmount) catchUpDepreciation = depreciableAmount;
            }

            Guid? catchUpGlOutboxId = null;
            if (catchUpDepreciation > 0)
            {
                catchUpGlOutboxId = await PostCatchUpDepreciationForDisposal(conn, txn, assetRegId, catchUpDepreciation, disposalDate, finYear, catchUpDays, asset);
            }

            decimal purchaseAmount = (decimal)(asset.PurchaseAmount ?? 0m);
            decimal accDepreciation = (decimal)(await conn.QueryFirstOrDefaultAsync<decimal?>(
                @"SELECT COALESCE(""AccumulatedDepreciationClosingBalance"", 0) FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { assetRegId }, txn) ?? 0m);
            decimal accImpairment = (decimal)(await conn.QueryFirstOrDefaultAsync<decimal?>(
                @"SELECT COALESCE(""AccumulatedImpairmentClosingBalance"", 0) FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { assetRegId }, txn) ?? 0m);
            decimal revaluationReserve = (decimal)(await conn.QueryFirstOrDefaultAsync<decimal?>(
                @"SELECT COALESCE(""RevaluationReserveClosingBalance"", COALESCE(""RevaluationOpeningBalance"", 0)) FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { assetRegId }, txn) ?? 0m);
            decimal carryingValue = (decimal)(await conn.QueryFirstOrDefaultAsync<decimal?>(
                @"SELECT COALESCE(""CurrentAmount"", ""CarryingAmountClosingBalance"", 0) FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { assetRegId }, txn) ?? 0m);
            decimal costPlusRevaluation = accDepreciation + accImpairment + carryingValue;

            decimal profitLoss = salePrice - carryingValue;

            var mscoaConfig = await _txnService.LookupMscoaConfig(conn, assetRegId, "Disposal", finYear, txn);
            var configErrors = _txnService.ValidateMscoaConfig(mscoaConfig, "Disposal", assetRegId);
            if (configErrors.Count > 0)
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = "GL posting configuration incomplete", details = configErrors });
            }

            int journalTransactionTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""AssetJournalTransactionType_ID"", 0) FROM ""Const_AssetJournalTransactionType_Sys""
                WHERE ""AssetJournalTransactionDesc"" = 'Asset Disposal' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
            if (journalTransactionTypeId == 0) journalTransactionTypeId = 26;

            int documentTypeId = await _lookupService.GetDocumentTypeIdAsync(conn, "Asset Disposal", txn);
            if (documentTypeId == 0) documentTypeId = 306;

            string documentNumber = await _txnService.GenerateDocumentNumber(conn, documentTypeId, txn);
            int intDocNumber = int.TryParse(documentNumber.Split('/').LastOrDefault(), out var dn) ? dn : 1;

            var transactionId = Guid.NewGuid();
            int processingMonth = await _txnService.GetProcessingMonth(conn, 1, txn);
            var (fyYear, fyPeriod) = _txnService.GetFinancialPeriodForDate(disposalDate);

            int journalId = await _txnService.InsertJournalAsset(conn, txn,
                finYear, processingMonth, transactionId, journalTransactionTypeId,
                disposalDate, mscoaConfig?.DebitVoteId, mscoaConfig?.CreditVoteId,
                salePrice, documentNumber, intDocNumber, assetRegId,
                scoaFundsId: mscoaConfig?.DebitScoaFundId,
                scoaRegionId: mscoaConfig?.DebitScoaRegionId,
                scoaCostingId: mscoaConfig?.DebitScoaCostingId,
                scoaFunctionId: mscoaConfig?.DebitScoaFunctionId,
                scoaItemId: mscoaConfig?.DebitScoaItemId,
                divisionId: mscoaConfig?.DebitDivisionId,
                itemDescription: "Asset Disposal");

            decimal disposalGainAmount = 0m;
            decimal disposalLossAmount = Math.Abs(profitLoss);
            if (salePrice > carryingValue)
            {
                disposalGainAmount = disposalLossAmount;
                disposalLossAmount = 0m;
            }

            var disposalOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
                conn, txn, "ASSET_DISPOSAL", documentNumber);

            if (accDepreciation > 0 && mscoaConfig?.DebitVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    disposalDate, processingMonth, mscoaConfig.DebitVoteId, finYear,
                    journalTransactionTypeId, "Asset Disposal - AccumulatedDepreciation", documentNumber,
                    debit: accDepreciation, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.DebitScoaFundId, scoaRegionId: mscoaConfig.DebitScoaRegionId,
                    scoaCostingId: mscoaConfig.DebitScoaCostingId,
                    scoaProjectId: mscoaConfig.DebitPlanProjectId, scoaFunctionId: mscoaConfig.DebitScoaFunctionId,
                    scoaItemId: mscoaConfig.DebitScoaItemId ?? 0,
                    divisionId: mscoaConfig.DebitDivisionId,
                    projectId: mscoaConfig.DebitPlanProjectId, planProjectItemId: mscoaConfig.DebitPlanProjectItemId,
                        outboxId: disposalOutboxId);
            }

            if (accImpairment > 0 && mscoaConfig?.DebitVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    disposalDate, processingMonth, mscoaConfig.DebitVoteId, finYear,
                    journalTransactionTypeId, "Asset Disposal - AccumulatedImpairment", documentNumber,
                    debit: accImpairment, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.DebitScoaFundId, scoaRegionId: mscoaConfig.DebitScoaRegionId,
                    scoaCostingId: mscoaConfig.DebitScoaCostingId,
                    scoaProjectId: mscoaConfig.DebitPlanProjectId, scoaFunctionId: mscoaConfig.DebitScoaFunctionId,
                    scoaItemId: mscoaConfig.DebitScoaItemId ?? 0,
                    divisionId: mscoaConfig.DebitDivisionId,
                    projectId: mscoaConfig.DebitPlanProjectId, planProjectItemId: mscoaConfig.DebitPlanProjectItemId,
                        outboxId: disposalOutboxId);
            }

            if (disposalLossAmount > 0 && disposalGainAmount == 0 && mscoaConfig?.DebitVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    disposalDate, processingMonth, mscoaConfig.DebitVoteId, finYear,
                    journalTransactionTypeId, "Asset Disposal - DisposalLoss", documentNumber,
                    debit: disposalLossAmount, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.DebitScoaFundId, scoaRegionId: mscoaConfig.DebitScoaRegionId,
                    scoaCostingId: mscoaConfig.DebitScoaCostingId,
                    scoaProjectId: mscoaConfig.DebitPlanProjectId, scoaFunctionId: mscoaConfig.DebitScoaFunctionId,
                    scoaItemId: mscoaConfig.DebitScoaItemId ?? 0,
                    divisionId: mscoaConfig.DebitDivisionId,
                    projectId: mscoaConfig.DebitPlanProjectId, planProjectItemId: mscoaConfig.DebitPlanProjectItemId,
                        outboxId: disposalOutboxId);
            }

            if (disposalGainAmount > 0 && mscoaConfig?.CreditVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    disposalDate, processingMonth, mscoaConfig.CreditVoteId, finYear,
                    journalTransactionTypeId, "Asset Disposal - DisposalGain", documentNumber,
                    debit: null, credit: disposalGainAmount, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.CreditScoaFundId, scoaRegionId: mscoaConfig.CreditScoaRegionId,
                    scoaCostingId: mscoaConfig.CreditScoaCostingId,
                    scoaProjectId: mscoaConfig.CreditPlanProjectId, scoaFunctionId: mscoaConfig.CreditScoaFunctionId,
                    scoaItemId: mscoaConfig.CreditScoaItemId ?? 0,
                    divisionId: mscoaConfig.CreditDivisionId,
                    projectId: mscoaConfig.CreditPlanProjectId, planProjectItemId: mscoaConfig.CreditPlanProjectItemId,
                        outboxId: disposalOutboxId);
            }

            if (salePrice > 0 && mscoaConfig?.DebitVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    disposalDate, processingMonth, mscoaConfig.DebitVoteId, finYear,
                    journalTransactionTypeId, "Asset Disposal - DisposalProceeds", documentNumber,
                    debit: salePrice, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.DebitScoaFundId, scoaRegionId: mscoaConfig.DebitScoaRegionId,
                    scoaCostingId: mscoaConfig.DebitScoaCostingId,
                    scoaProjectId: mscoaConfig.DebitPlanProjectId, scoaFunctionId: mscoaConfig.DebitScoaFunctionId,
                    scoaItemId: mscoaConfig.DebitScoaItemId ?? 0,
                    divisionId: mscoaConfig.DebitDivisionId,
                    projectId: mscoaConfig.DebitPlanProjectId, planProjectItemId: mscoaConfig.DebitPlanProjectItemId,
                        outboxId: disposalOutboxId);
            }

            if (mscoaConfig?.CreditVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    disposalDate, processingMonth, mscoaConfig.CreditVoteId, finYear,
                    journalTransactionTypeId, "Asset Disposal - Cost", documentNumber,
                    debit: null, credit: costPlusRevaluation, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.CreditScoaFundId, scoaRegionId: mscoaConfig.CreditScoaRegionId,
                    scoaCostingId: mscoaConfig.CreditScoaCostingId,
                    scoaProjectId: mscoaConfig.CreditPlanProjectId, scoaFunctionId: mscoaConfig.CreditScoaFunctionId,
                    scoaItemId: mscoaConfig.CreditScoaItemId ?? 0,
                    divisionId: mscoaConfig.CreditDivisionId,
                    projectId: mscoaConfig.CreditPlanProjectId, planProjectItemId: mscoaConfig.CreditPlanProjectItemId,
                        outboxId: disposalOutboxId);
            }

            if (revaluationReserve > 0 && mscoaConfig?.DebitVoteId != null && mscoaConfig?.CreditVoteId != null)
            {
                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    disposalDate, processingMonth, mscoaConfig.DebitVoteId, finYear,
                    journalTransactionTypeId, "Asset Disposal - RevaluationReserve", documentNumber,
                    debit: revaluationReserve, credit: null, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.DebitScoaFundId, scoaRegionId: mscoaConfig.DebitScoaRegionId,
                    scoaCostingId: mscoaConfig.DebitScoaCostingId,
                    scoaProjectId: mscoaConfig.DebitPlanProjectId, scoaFunctionId: mscoaConfig.DebitScoaFunctionId,
                    scoaItemId: mscoaConfig.DebitScoaItemId ?? 0,
                    divisionId: mscoaConfig.DebitDivisionId,
                    projectId: mscoaConfig.DebitPlanProjectId, planProjectItemId: mscoaConfig.DebitPlanProjectItemId,
                        outboxId: disposalOutboxId);

                await _txnService.InsertGeneralLedgerEntry(conn, txn,
                    disposalDate, processingMonth, mscoaConfig.CreditVoteId, finYear,
                    journalTransactionTypeId, "Asset Disposal - Accumulated Surplus", documentNumber,
                    debit: null, credit: revaluationReserve, matchTranGuid: transactionId,
                    journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                    scoaFundsId: mscoaConfig.CreditScoaFundId, scoaRegionId: mscoaConfig.CreditScoaRegionId,
                    scoaCostingId: mscoaConfig.CreditScoaCostingId,
                    scoaProjectId: mscoaConfig.CreditPlanProjectId, scoaFunctionId: mscoaConfig.CreditScoaFunctionId,
                    scoaItemId: mscoaConfig.CreditScoaItemId ?? 0,
                    divisionId: mscoaConfig.CreditDivisionId,
                    projectId: mscoaConfig.CreditPlanProjectId, planProjectItemId: mscoaConfig.CreditPlanProjectItemId,
                        outboxId: disposalOutboxId);
            }

            int disposalTransTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""ReferenceData_ID"", 0) FROM ""Const_ReferenceData_sys""
                WHERE ""Description"" = 'Disposal' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
            if (disposalTransTypeId == 0) disposalTransTypeId = 5;

            await _txnService.UpsertAssetRegisterTransaction(conn, txn,
                assetRegId, disposalTransTypeId, disposalDate,
                fyYear, fyPeriod, transactionId, documentTypeId,
                purchaseAmount: purchaseAmount,
                currentValue: carryingValue,
                disposalValue: salePrice,
                disposalLossValue: profitLoss,
                disposalTotalValue: costPlusRevaluation,
                accumulatedDepreciation: accDepreciation,
                accumulatedImpairment: accImpairment,
                revaluationReserveDisposal: revaluationReserve);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items""
                SET ""DisposalAmountCost"" = @salePrice,
                    ""DisposalProceeds"" = @salePrice,
                    ""DateOfDisposal"" = @disposalDate,
                    ""ProfitOrLossOnDisposal"" = @profitLoss,
                    ""AccumulatedDepreciationDisposal"" = @accDepreciation,
                    ""DisposalImpairmentAmount"" = @accImpairment,
                    ""CurrentAmount"" = CASE WHEN @carryingValue < 0 THEN 0 ELSE @carryingValue END,
                    ""CarryingAmountClosingBalance"" = 0,
                    ""RevaluationReserveClosingBalance"" = ""RevaluationReserveClosingBalance"" - @revaluationReserve,
                    ""DateModified"" = GETDATE()
                WHERE ""AssetRegisterItem_ID"" = @assetRegId",
                new { salePrice, disposalDate, profitLoss, accDepreciation, accImpairment, revaluationReserve, carryingValue, assetRegId }, txn);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Disposal"" SET ""Status"" = 'Approved', ""DateModified"" = GETDATE(),
                    ""Approved"" = 1, ""ApprovedDate"" = GETDATE(), ""ApprovedBy"" = @approvedBy
                WHERE ""AssetDisposal_ID"" = @id", new { id, approvedBy = request.ApprovedBy }, txn);

            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_Disposal_Approval"" (""AssetDisposal_ID"", ""AssetItemID"", ""ApprovalDate"", ""ApprovedByID"",
                    ""Status"", ""Comments"", ""IsApprove"", ""ApprovedBy"", ""ApprovedDate"", ""DateCaptured"", ""CapturerID"")
                VALUES (@id, @assetRegId, GETDATE(), @approvedBy, 'Approved', @comments, 1, @approvedBy, GETDATE(), GETDATE(), 1)
                ON CONFLICT DO NOTHING",
                new { id, assetRegId, approvedBy = request.ApprovedBy, comments = request.Comments ?? "" }, txn);

            await txn.CommitAsync();

            if (catchUpGlOutboxId.HasValue)
                await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(disposalOutboxId, catchUpGlOutboxId.Value);
            else
                await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(disposalOutboxId);

            try
            {
                await _txnService.PopulateTransactionSummarySingle(assetRegId, finYear, 1);
            }
            catch (Exception atsEx)
            {
                Console.WriteLine($"ATS rebuild failed for asset {assetRegId}: {atsEx.Message}");
            }

            bool isGain = disposalGainAmount > 0;

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_WorkflowInstances""
                SET ""status"" = 'approved', ""completed_at"" = GETDATE()
                WHERE ""entity_type"" = 'disposal' AND ""mssql_reference_id"" = @refId AND ""status"" IN ('pending', 'in_progress')",
                new { refId = id.ToString() });

            return Ok(new { success = 1, journalId, documentNumber, transactionId, profitLoss, isGain });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            Console.Error.WriteLine($"[DISPOSAL APPROVAL ERROR] id={id}: {ex}");
            return StatusCode(500, new { error = "Disposal approval failed", details = ex.Message });
        }
    }

    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] DisposalRejectRequest? request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var disposal = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""AssetDisposal_ID"", ""AssetItemID"" AS ""AssetRegisterItem_ID"", ""Status"", COALESCE(""Approved"", 0) AS ""Approved""
              FROM ""Asset_Disposal"" WHERE ""AssetDisposal_ID"" = @id", new { id });

        if (disposal is null)
            return NotFound(new { error = "Disposal not found" });

        if ((int)(disposal.Approved ?? 0) == 1)
            return BadRequest(new { error = "Disposal already approved, cannot reject" });

        string currentStatus = (string)(disposal.Status ?? "");
        if (currentStatus == "Rejected")
            return Ok(new { success = 1, alreadyRejected = 1, message = "Disposal already rejected" });

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_Disposal""
            SET ""Status"" = 'Rejected', ""DateModified"" = GETDATE(),
                ""RejectedBy"" = @rejectedBy, ""RejectedDate"" = GETDATE(), ""RejectionReason"" = @reason
            WHERE ""AssetDisposal_ID"" = @id",
            new { id, rejectedBy = request?.RejectedBy ?? 0, reason = request?.Reason ?? "" });

        int assetRegId = (int)(disposal.AssetRegisterItem_ID ?? 0);
        if (assetRegId > 0)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_Disposal_Approval"" (""AssetDisposal_ID"", ""AssetItemID"", ""ApprovalDate"", ""ApprovedByID"",
                    ""Status"", ""Comments"", ""IsApprove"", ""DateCaptured"", ""CapturerID"")
                VALUES (@id, @assetRegId, GETDATE(), @rejectedBy, 'Rejected', @reason, 0, GETDATE(), 1)
                ON CONFLICT DO NOTHING",
                new { id, assetRegId, rejectedBy = request?.RejectedBy ?? 0, reason = request?.Reason ?? "" });
        }

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WorkflowInstances""
            SET ""status"" = 'rejected', ""completed_at"" = GETDATE()
            WHERE ""entity_type"" = 'disposal' AND ""mssql_reference_id"" = @refId AND ""status"" IN ('pending', 'in_progress')",
            new { refId = id.ToString() });

        return Ok(new { success = 1 });
    }

    private async Task<Guid> PostCatchUpDepreciationForDisposal(DbConnection conn, DbTransaction txn,
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
            itemDescription: "Asset Depreciation - Catch-up to Disposal Date",
            depRunType: "CatchUp");

        var catchUpOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
            conn, txn, "ASSET_DEPRECIATION", depDocNumber);

        if (mscoaConfig?.DebitVoteId != null)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, mscoaConfig.DebitVoteId, finYear,
                depJournalTypeId, "Asset Depreciation - Catch-up to Disposal Date", depDocNumber,
                debit: catchUpAmount, credit: null, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: mscoaConfig.DebitScoaFundId, scoaRegionId: mscoaConfig.DebitScoaRegionId,
                scoaCostingId: mscoaConfig.DebitScoaCostingId,
                scoaProjectId: mscoaConfig.DebitPlanProjectId, scoaFunctionId: mscoaConfig.DebitScoaFunctionId,
                scoaItemId: mscoaConfig.DebitScoaItemId ?? 0,
                divisionId: mscoaConfig.DebitDivisionId,
                projectId: mscoaConfig.DebitPlanProjectId, planProjectItemId: mscoaConfig.DebitPlanProjectItemId,
                    outboxId: catchUpOutboxId);
        }

        if (mscoaConfig?.CreditVoteId != null)
        {
            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, mscoaConfig.CreditVoteId, finYear,
                depJournalTypeId, "Asset Depreciation - Catch-up to Disposal Date", depDocNumber,
                debit: null, credit: catchUpAmount, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: mscoaConfig.CreditScoaFundId, scoaRegionId: mscoaConfig.CreditScoaRegionId,
                scoaCostingId: mscoaConfig.CreditScoaCostingId,
                scoaProjectId: mscoaConfig.CreditPlanProjectId, scoaFunctionId: mscoaConfig.CreditScoaFunctionId,
                scoaItemId: mscoaConfig.CreditScoaItemId ?? 0,
                divisionId: mscoaConfig.CreditDivisionId,
                projectId: mscoaConfig.CreditPlanProjectId, planProjectItemId: mscoaConfig.CreditPlanProjectItemId,
                    outboxId: catchUpOutboxId);
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
                depJournalTypeId, "Asset Depreciation Offset - Catch-up", depDocNumber,
                debit: postedOffset, credit: null, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: mscoaConfig.ReserveScoaFundId, scoaRegionId: mscoaConfig.ReserveScoaRegionId,
                scoaCostingId: mscoaConfig.ReserveScoaCostingId,
                scoaProjectId: mscoaConfig.ReservePlanProjectId, scoaFunctionId: mscoaConfig.ReserveScoaFunctionId,
                scoaItemId: mscoaConfig.ReserveScoaItemId ?? 0,
                divisionId: mscoaConfig.ReserveDivisionId,
                projectId: mscoaConfig.ReservePlanProjectId, planProjectItemId: mscoaConfig.ReservePlanProjectItemId,
                    outboxId: catchUpOutboxId);

            await _txnService.InsertGeneralLedgerEntry(conn, txn,
                transactionDate, processingMonth, mscoaConfig.OffsetVoteId, finYear,
                depJournalTypeId, "Asset Depreciation Offset - Catch-up", depDocNumber,
                debit: null, credit: postedOffset, matchTranGuid: depTxnId,
                journalTransactionTypeId: depJournalTypeId, assetLinkId: depJournalId,
                scoaFundsId: mscoaConfig.OffsetScoaFundId, scoaRegionId: mscoaConfig.OffsetScoaRegionId,
                scoaCostingId: mscoaConfig.OffsetScoaCostingId,
                scoaProjectId: mscoaConfig.OffsetPlanProjectId, scoaFunctionId: mscoaConfig.OffsetScoaFunctionId,
                scoaItemId: mscoaConfig.OffsetScoaItemId ?? 0,
                divisionId: mscoaConfig.OffsetDivisionId,
                projectId: mscoaConfig.OffsetPlanProjectId, planProjectItemId: mscoaConfig.OffsetPlanProjectItemId,
                    outboxId: catchUpOutboxId);
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

        return catchUpOutboxId;
    }
}

public class DisposalApprovalRequest
{
    public int ApprovedBy { get; set; }
    public string? Comments { get; set; }
}

public class DisposalRejectRequest
{
    public int RejectedBy { get; set; }
    public string? Reason { get; set; }
}
