using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Helpers;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/wip-register-items")]
public class WipRegisterController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;
    private readonly LookupService _lookup;
    private readonly ScmInvoiceService _scmInvoice;
    private readonly ScmUnbundlingService _scmUnbundling;
    private readonly EmailService _emailService;

    public WipRegisterController(DbConnectionFactory db, TransactionService txnService, LookupService lookup,
        ScmInvoiceService scmInvoice, ScmUnbundlingService scmUnbundling, EmailService emailService)
    {
        _db = db;
        _txnService = txnService;
        _lookup = lookup;
        _scmInvoice = scmInvoice;
        _scmUnbundling = scmUnbundling;
        _emailService = emailService;
    }

    private static string BaseSelect => @"
        SELECT
            w.""WIPRegister_ID""          AS ""wipRegisterId"",
            w.""ProjectName""             AS ""projectName"",
            w.""ProjectNo""               AS ""projectNo"",
            w.""ProjectNumber""           AS ""projectNumber"",
            w.""ContractNumber""          AS ""contractNumber"",
            w.""ContractStartDate""       AS ""contractStartDate"",
            w.""ContractEndDate""         AS ""contractEndDate"",
            w.""ContractValue""           AS ""contractValue"",
            w.""TotalBudget""             AS ""totalBudget"",
            w.""TotalExpenditure""        AS ""totalExpenditure"",
            w.""WIPOpeningBalance""       AS ""wipOpeningBalance"",
            w.""WIPClosingBalance""       AS ""wipClosingBalance"",
            w.""RestatedOpeningBalance""  AS ""restatedOpeningBalance"",
            COALESCE(w.""Additions"", 0)         AS ""additions"",
            COALESCE(w.""TransferOfAssets"", 0)  AS ""transferOfAssets"",
            COALESCE(w.""WriteOff"", 0)          AS ""writeOff"",
            COALESCE(w.""Impairment"", 0)        AS ""impairment"",
            COALESCE(w.""PriorYearAdjustment"", 0) AS ""priorYearAdjustment"",
            COALESCE(w.""FinancialProgress"", 0) AS ""financialProgress"",
            w.""FinYear""                AS ""finYear"",
            w.""StartDate""              AS ""startDate"",
            w.""ExpectedEndDate""         AS ""expectedEndDate"",
            w.""ActualEndDate""           AS ""actualEndDate"",
            w.""CompletionDate""          AS ""completionDate"",
            w.""Status""                 AS ""status"",
            w.""ProjectStatusID""         AS ""statusId"",
            COALESCE(ps.""StatusDesc"", '') AS ""statusDesc"",
            w.""DepartmentID""            AS ""departmentId"",
            w.""DivisionID""             AS ""divisionId"",
            w.""CustodianID""            AS ""custodianId"",
            w.""IsApproved""             AS ""isApproved"",
            w.""BudgetProjectID""         AS ""budgetProjectId"",
            w.""BudgetProjectItemID""     AS ""budgetProjectItemId"",
            w.""Latitude""               AS ""latitude"",
            w.""Longitude""              AS ""longitude"",
            COALESCE(w.""UnbundlingStatus"", 'Draft') AS ""unbundlingStatus"",
            COALESCE(w.""ProjectComplete"", 0)        AS ""projectComplete"",
            w.""UnbundlingComment""      AS ""unbundlingComment"",
            w.""ApproverID""             AS ""approverId"",
            w.""UnbundlingApprovedDate"" AS ""unbundlingApprovedDate"",
            w.""ActualSurvey""           AS ""actualSurvey"",
            w.""MainAssetDescription""   AS ""mainAssetDescription"",
            w.""ScmContractID""          AS ""scmContractId"",
            w.""DateCaptured""           AS ""dateCaptured"",
            w.""DateModified""           AS ""dateModified"",
            '' AS ""planningProjectName"",
            NULL::INT AS ""scoaProjectId"",
            '' AS ""scoaItemDesc"",
            '' AS ""scoaCode"",
            '' AS ""scoaShortDesc""
        FROM ""Asset_WIP_Register"" w
        LEFT JOIN ""Const_AssetProjectStatus"" ps ON w.""ProjectStatusID"" = ps.""AssetProjectStatus_ID""";

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear, [FromQuery] string? status)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = BaseSelect + " WHERE 1=1";
        var parameters = new DynamicParameters();
        if (!string.IsNullOrEmpty(finYear)) { sql += @" AND w.""FinYear"" = @finYear"; parameters.Add("finYear", finYear); }
        if (!string.IsNullOrEmpty(status)) { sql += @" AND w.""Status"" = @status"; parameters.Add("status", status); }
        sql += @" ORDER BY w.""WIPRegister_ID"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            BaseSelect + @" WHERE w.""WIPRegister_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "WIP register not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> model)
    {
        // Helper to extract typed values from the model
        T? Get<T>(string key)
        {
            if (!model.TryGetValue(key, out var v) || v is null) return default;
            var s = v.ToString();
            if (string.IsNullOrWhiteSpace(s)) return default;
            try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); }
            catch { return default; }
        }

        // Pre-fetch invoice data before the transaction (HTTP call to ScmInvoiceController)
        var contractId = Get<int?>("contractId");
        IEnumerable<ScmInvoiceWipRow>? preloadedInvoices = null;
        if (contractId.HasValue)
            preloadedInvoices = await _scmInvoice.GetInvoicesForWipInsertionAsync(contractId.Value);

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        // 1. Insert WIP Register (financial progress computed server-side)
        var createParams = BuildParams(model);
        var createClosing  = Get<decimal?>("wipClosingBalance") ?? 0m;
        var createContract = Get<decimal?>("contractValue") ?? 0m;
        var createProgress = createContract > 0 ? Math.Round(createClosing / createContract * 100, 1) : 0m;
        createParams.Add("financialProgress", createProgress);

        var wipId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_WIP_Register"" (
                ""ProjectName"", ""ProjectNo"", ""ProjectNumber"", ""ContractNumber"",
                ""ContractStartDate"", ""ContractEndDate"", ""ContractValue"",
                ""TotalBudget"", ""TotalExpenditure"", ""FinYear"", ""Status"",
                ""ProjectStatusID"", ""FundingTypeID"", ""DepartmentID"", ""DivisionID"",
                ""StartDate"", ""ExpectedEndDate"",
                ""WIPOpeningBalance"", ""WIPClosingBalance"",
                ""Additions"", ""TransferOfAssets"", ""WriteOff"", ""Impairment"",
                ""PriorYearAdjustment"", ""FinancialProgress"",
                ""BudgetProjectID"",
                ""UnbundlingStatus"", ""ProjectComplete"",
                ""ActualSurvey"", ""MainAssetDescription"",
                ""ScmContractID"", ""ContractID"",
                ""Latitude"", ""Longitude"", ""DateCaptured"", ""CapturerID"")
            VALUES (
                @projectName, @projectNo, @projectNumber, @contractNumber,
                @contractStartDate, @contractEndDate, @contractValue,
                @totalBudget, COALESCE(@totalExpenditure,0), @finYear, COALESCE(@status,'Active'),
                @statusId, @fundingTypeId, @departmentId, @divisionId,
                @startDate, @expectedEndDate,
                COALESCE(@wipOpeningBalance,0), COALESCE(@wipClosingBalance,0),
                COALESCE(@additions,0), COALESCE(@transferOfAssets,0), COALESCE(@writeOff,0), COALESCE(@impairment,0),
                COALESCE(@priorYearAdjustment,0), @financialProgress,
                @budgetProjectId,
                'Draft', 0,
                @actualSurvey, @mainAssetDescription,
                @scmContractId, @contractId,
                @latitude, @longitude, NOW(), 1)
            RETURNING ""WIPRegister_ID""",
            createParams, txn);

        // 2. Extract values needed for the linked asset
        var projectName      = Get<string>("projectName");
        var projectNo        = Get<string>("projectNo");
        var departmentId     = Get<int?>("departmentId");
        var divisionId       = Get<int?>("divisionId");
        var latitude         = Get<decimal?>("latitude");
        var longitude        = Get<decimal?>("longitude");
        var wipClosing       = Get<decimal?>("wipClosingBalance") ?? 0m;
        var contractStart    = Get<DateTime?>("contractStartDate");

        // 3. Create the linked Asset Register Item
        var assetId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_Register_Items"" (
                ""Description"", ""MainAssetDescription"", ""MainAssetID"",
                ""MunicipalDepartment_ID"", ""DivisionID"",
                ""latitude"", ""longitude"",
                ""CurrentAmount"", ""PurchaseAmount"",
                ""CurrentReplacementCostCRC"", ""DepreciatedReplacementCostDRC"",
                ""ReadyForUse"", ""CommisioningDate"", ""InserviceDate"",
                ""AssetType_ID"",
                ""ManagedFlag"",
                ""DateCaptured"", ""Capturer_ID"")
            VALUES (
                @description, @mainAssetDescription, @mainAssetId,
                @department, @divisionId,
                @latitude, @longitude,
                @currentAmount, @purchaseAmount,
                @currentReplacementCostCRC, @depreciatedReplacementCostDRC,
                @readyForUse, @commisioningDate, @inserviceDate,
                6,
                1,
                NOW(), 1)
            RETURNING ""AssetRegisterItem_ID""",
            new
            {
                description                  = projectName,
                mainAssetDescription         = projectName,
                mainAssetId                  = projectNo,
                department                   = departmentId?.ToString(),
                divisionId,
                latitude,
                longitude,
                currentAmount                = wipClosing,
                purchaseAmount               = wipClosing,
                currentReplacementCostCRC    = wipClosing,
                depreciatedReplacementCostDRC = wipClosing,
                readyForUse                  = contractStart,
                commisioningDate             = contractStart,
                inserviceDate                = contractStart
            }, txn);

        // 4. Link the asset back to the WIP register
        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register""
            SET ""AssetRegisterItem_ID"" = @assetId
            WHERE ""WIPRegister_ID"" = @wipId",
            new { assetId, wipId }, txn);

        // 5. If created from an SCM contract, bulk-insert using pre-fetched invoice data
        if (contractId.HasValue && preloadedInvoices != null)
            await _scmInvoice.InsertWipDetailsFromPreFetchedAsync(conn, wipId, preloadedInvoices, txn);

        await txn.CommitAsync();

        // 6. Recalculate WIP totals if invoice details were imported
        if (contractId.HasValue)
        {
            await RecalculateWipTotals(conn, wipId);
            await RebuildWipAssetSummary(conn, wipId);
        }

        // 7. Rebuild the asset transaction summary for the new asset
        var finYear = Get<string>("finYear") ?? DateTime.UtcNow.Year.ToString();
        try
        {
            await _txnService.PopulateTransactionSummarySingle(assetId, finYear, 1);
        }
        catch (Exception atsEx)
        {
            Console.WriteLine($"ATS rebuild failed for WIP asset {assetId}: {atsEx.Message}");
        }

        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            BaseSelect + @" WHERE w.""WIPRegister_ID"" = @id", new { id = wipId });
        return CreatedAtAction(nameof(GetById), new { id = wipId }, created);
    }

    [HttpPatch("{id:int}/main-description")]
    public async Task<IActionResult> PatchMainDescription(int id, [FromBody] System.Text.Json.JsonElement body)
    {
        string? desc = null;
        if (body.TryGetProperty("mainAssetDescription", out var dp) && dp.ValueKind != System.Text.Json.JsonValueKind.Null)
            desc = dp.GetString();
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register""
            SET ""MainAssetDescription"" = @desc, ""DateModified"" = NOW()
            WHERE ""WIPRegister_ID"" = @id", new { id, desc });
        if (rows == 0) return NotFound(new { error = "WIP register not found" });
        return Ok(new { success = true });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var p = BuildParams(model);
        p.Add("id", id);
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register"" SET
                ""ProjectName""          = @projectName,
                ""ProjectNo""            = @projectNo,
                ""ProjectNumber""        = @projectNumber,
                ""ContractNumber""       = @contractNumber,
                ""ContractStartDate""    = @contractStartDate,
                ""ContractEndDate""      = @contractEndDate,
                ""ContractValue""        = @contractValue,
                ""TotalBudget""          = @totalBudget,
                ""FinYear""              = @finYear,
                ""Status""               = @status,
                ""ProjectStatusID""      = @statusId,
                ""FundingTypeID""        = @fundingTypeId,
                ""DepartmentID""         = @departmentId,
                ""DivisionID""           = @divisionId,
                ""StartDate""            = @startDate,
                ""ExpectedEndDate""      = @expectedEndDate,
                ""ActualEndDate""        = @actualEndDate,
                ""CompletionDate""       = @completionDate,
                ""WIPOpeningBalance""    = @wipOpeningBalance,
                ""TransferOfAssets""     = @transferOfAssets,
                ""WriteOff""            = @writeOff,
                ""Impairment""          = @impairment,
                ""PriorYearAdjustment"" = @priorYearAdjustment,
                ""BudgetProjectID""      = @budgetProjectId,
                ""ActualSurvey""         = @actualSurvey,
                ""MainAssetDescription"" = @mainAssetDescription,
                ""ScmContractID""        = @scmContractId,
                ""Latitude""            = @latitude,
                ""Longitude""           = @longitude,
                ""DateModified""        = NOW()
            WHERE ""WIPRegister_ID"" = @id", p);
        if (rows == 0) return NotFound(new { error = "WIP register not found" });

        // Recalculate WIPClosingBalance and FinancialProgress from final-approved SCM invoices
        var updScmContractId = await conn.QuerySingleOrDefaultAsync<int?>(
            @"SELECT ""ScmContractID"" FROM ""Asset_WIP_Register"" WHERE ""WIPRegister_ID"" = @id",
            new { id });
        decimal totalExpenditure = 0m;
        if (updScmContractId.HasValue && updScmContractId.Value > 0)
            totalExpenditure = await _scmInvoice.GetContractTotalExpenditureAsync(updScmContractId.Value);
        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register"" SET
                ""TotalExpenditure"" = @totalExpenditure,
                ""Additions""        = @totalExpenditure,
                ""WIPClosingBalance"" = COALESCE(""WIPOpeningBalance"", 0) + @totalExpenditure
                    - COALESCE(""TransferOfAssets"", 0)
                    - COALESCE(""WriteOff"", 0)
                    - COALESCE(""Impairment"", 0)
                    + COALESCE(""PriorYearAdjustment"", 0),
                ""FinancialProgress"" = CASE
                    WHEN COALESCE(""ContractValue"", 0) > 0 THEN ROUND((
                        COALESCE(""WIPOpeningBalance"", 0) + @totalExpenditure
                        - COALESCE(""TransferOfAssets"", 0)
                        - COALESCE(""WriteOff"", 0)
                        - COALESCE(""Impairment"", 0)
                        + COALESCE(""PriorYearAdjustment"", 0)
                    ) / ""ContractValue"" * 100, 1)
                    ELSE 0
                END
            WHERE ""WIPRegister_ID"" = @id", new { id, totalExpenditure });

        // Sync the linked Asset Register Item using the freshly recalculated DB values
        var wip = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""AssetRegisterItem_ID"", ""WIPClosingBalance"", ""FinYear"",
                   ""ProjectName"", ""ProjectNo"", ""DepartmentID"", ""DivisionID"",
                   ""Latitude"", ""Longitude"", ""ContractStartDate""
            FROM ""Asset_WIP_Register""
            WHERE ""WIPRegister_ID"" = @id", new { id });

        if (wip != null && wip.AssetRegisterItem_ID != null)
        {
            int assetId      = (int)wip.AssetRegisterItem_ID;
            decimal wipClosing = (decimal)(wip.WIPClosingBalance ?? 0m);
            string finYear   = (string)(wip.FinYear ?? DateTime.UtcNow.Year.ToString());

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items"" SET
                    ""Description""                  = @description,
                    ""MainAssetDescription""          = @description,
                    ""MainAssetID""                   = @mainAssetId,
                    ""MunicipalDepartment_ID""        = @department,
                    ""DivisionID""                    = @divisionId,
                    ""latitude""                      = @latitude,
                    ""longitude""                     = @longitude,
                    ""CurrentAmount""                 = @wipClosing,
                    ""PurchaseAmount""                = @wipClosing,
                    ""CurrentReplacementCostCRC""     = @wipClosing,
                    ""DepreciatedReplacementCostDRC"" = @wipClosing,
                    ""ReadyForUse""                   = @contractStart,
                    ""CommisioningDate""              = @contractStart,
                    ""InserviceDate""                 = @contractStart,
                    ""DateModified""                  = NOW()
                WHERE ""AssetRegisterItem_ID"" = @assetId",
                new {
                    description   = (string?)wip.ProjectName,
                    mainAssetId   = (string?)wip.ProjectNo,
                    department    = ((int?)wip.DepartmentID)?.ToString(),
                    divisionId    = (int?)wip.DivisionID,
                    latitude      = (decimal?)wip.Latitude,
                    longitude     = (decimal?)wip.Longitude,
                    contractStart = (DateTime?)wip.ContractStartDate,
                    wipClosing,
                    assetId
                });

            try
            {
                await _txnService.PopulateTransactionSummarySingle(assetId, finYear, 1);
            }
            catch (Exception atsEx)
            {
                Console.WriteLine($"ATS rebuild failed for WIP asset {assetId}: {atsEx.Message}");
            }
        }

        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(
            BaseSelect + @" WHERE w.""WIPRegister_ID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // Get linked asset ID before deleting
        var assetId = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT ""AssetRegisterItem_ID"" FROM ""Asset_WIP_Register"" WHERE ""WIPRegister_ID"" = @id",
            new { id });

        if (assetId == null)
            return NotFound(new { error = "WIP register not found" });

        await using var txn = await conn.BeginTransactionAsync();

        // Delete all child records first
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_WIPApprovalItems"" WHERE ""WIPRegister_ID"" = @id", new { id }, txn);
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_WIP_Register_Items"" WHERE ""WIPRegister_ID"" = @id", new { id }, txn);
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_WIP_Register_Funding"" WHERE ""WIPRegister_ID"" = @id", new { id }, txn);
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_WIP_Register_Details"" WHERE ""WIPRegister_ID"" = @id", new { id }, txn);

        // Delete the WIP register itself
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_WIP_Register"" WHERE ""WIPRegister_ID"" = @id", new { id }, txn);

        // Delete the linked asset register item and its child records if it exists
        if (assetId.HasValue)
        {
            await conn.ExecuteAsync(@"DELETE FROM ""Asset_Register_Transactions"" WHERE ""AssetRegisterItem_ID"" = @assetId", new { assetId }, txn);
            await conn.ExecuteAsync(@"DELETE FROM ""Asset_Transaction_Summary"" WHERE ""AssetRegisterItem_ID"" = @assetId", new { assetId }, txn);
            await conn.ExecuteAsync(@"DELETE FROM ""Asset_VerificationRegisterItem"" WHERE ""AssetRegisterItem_ID"" = @assetId", new { assetId }, txn);
            await conn.ExecuteAsync(@"DELETE FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetId", new { assetId }, txn);
        }

        await txn.CommitAsync();

        return Ok(new { success = 1 });
    }

    // ===== Approval Workflow Endpoints =====

    [HttpPost("{id:int}/submit-for-approval")]
    public async Task<IActionResult> SubmitForApproval(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register""
            SET ""UnbundlingStatus"" = 'Submitted', ""DateModified"" = NOW()
            WHERE ""WIPRegister_ID"" = @id", new { id });
        if (rows == 0) return NotFound(new { error = "WIP register not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(BaseSelect + @" WHERE w.""WIPRegister_ID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] System.Text.Json.JsonElement body)
    {
        string? comment = null;
        int approverId = 1;
        string? surveyJson = null;
        try
        {
            if (body.TryGetProperty("comment", out var cp) && cp.ValueKind != System.Text.Json.JsonValueKind.Null)
                comment = cp.GetString();
            if (body.TryGetProperty("approverId", out var ap) && ap.ValueKind == System.Text.Json.JsonValueKind.Number)
                approverId = ap.GetInt32();
            if (body.TryGetProperty("actualSurvey", out var sp) && sp.ValueKind != System.Text.Json.JsonValueKind.Null)
                surveyJson = sp.GetRawText();
        }
        catch { }
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        if (!string.IsNullOrWhiteSpace(surveyJson))
        {
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_WIP_Register""
                SET ""ActualSurvey"" = @surveyJson, ""DateModified"" = NOW()
                WHERE ""WIPRegister_ID"" = @id", new { id, surveyJson });
        }
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register""
            SET ""UnbundlingStatus"" = 'Approved',
                ""UnbundlingComment"" = @comment,
                ""ApproverID"" = @approverId,
                ""UnbundlingApprovedDate"" = NOW(),
                ""DateModified"" = NOW()
            WHERE ""WIPRegister_ID"" = @id", new { id, comment, approverId });
        if (rows == 0) return NotFound(new { error = "WIP register not found" });
        try
        {
            _ = _emailService.SendTransactionEmailsAsync("Unbundling", new Dictionary<string, string>
            {
                ["WipReference"] = id.ToString(),
                ["Comment"]      = comment ?? "",
                ["ApprovalDate"] = DateTime.Now.ToString("dd MMM yyyy")
            });
        }
        catch (Exception ex) { Console.Error.WriteLine($"[WipRegisterController] Email dispatch failed for Unbundling approval {id}: {ex.Message}"); }
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(BaseSelect + @" WHERE w.""WIPRegister_ID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpPost("{id:int}/decline")]
    public async Task<IActionResult> Decline(int id, [FromBody] Dictionary<string, object?> body)
    {
        T? Get<T>(string key) { if (!body.TryGetValue(key, out var v) || v is null) return default; var s = v.ToString(); if (string.IsNullOrWhiteSpace(s)) return default; try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); } catch { return default; } }
        var comment = Get<string>("comment");
        if (string.IsNullOrWhiteSpace(comment))
            return BadRequest(new { error = "A comment is required when declining" });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register""
            SET ""UnbundlingStatus"" = 'Declined',
                ""UnbundlingComment"" = @comment,
                ""DateModified"" = NOW()
            WHERE ""WIPRegister_ID"" = @id", new { id, comment });
        if (rows == 0) return NotFound(new { error = "WIP register not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(BaseSelect + @" WHERE w.""WIPRegister_ID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpPost("{id:int}/generate-asset-list")]
    public async Task<IActionResult> GenerateAssetList(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // Load ActualSurvey for unit-cost computation (same logic as Commission endpoint)
        var surveyJson = await conn.QueryFirstOrDefaultAsync<string?>(@"
            SELECT ""ActualSurvey"" FROM ""Asset_WIP_Register"" WHERE ""WIPRegister_ID"" = @id",
            new { id });
        var surveyData = new Dictionary<string, decimal>();
        if (!string.IsNullOrWhiteSpace(surveyJson))
        {
            try { surveyData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, decimal>>(surveyJson) ?? new(); }
            catch { }
        }

        // Compute general cost distribution
        var allItems = await conn.QueryAsync<dynamic>(@"
            SELECT COALESCE(""IsAssetItem"", 0) AS ""isAssetItem"",
                   COALESCE(""Amount"", 0)      AS ""amount"",
                   ""CIDMSSubComponentTypeID""  AS ""cidmsSubComponentTypeId""
            FROM ""Asset_WIP_Register_Items""
            WHERE ""WIPRegister_ID"" = @id", new { id });

        decimal generalCost = 0m;
        var cidmsGroups = new Dictionary<int, decimal>();
        var allList = allItems.ToList();
        for (int i = 0; i < allList.Count; i++)
        {
            var row = allList[i];
            bool isAsset = ((int?)row.isAssetItem ?? 0) == 1;
            decimal amt = (decimal)(row.amount ?? 0m);
            if (!isAsset || row.cidmsSubComponentTypeId == null) { generalCost += amt; }
            else
            {
                int ckey = (int)row.cidmsSubComponentTypeId;
                cidmsGroups[ckey] = (cidmsGroups.ContainsKey(ckey) ? cidmsGroups[ckey] : 0m) + amt;
            }
        }
        decimal totalCidmsCost = 0m;
        foreach (var v in cidmsGroups.Values) totalCidmsCost += v;

        var assetItemRows = await conn.QueryAsync<dynamic>(@"
            SELECT ""WIPRegistrationItem_Id"", ""AssetDescription"", ""Amount"",
                   ""AssetTypeID"", ""AssetCategoryID"", ""AssetSubCategoryID"",
                   ""MeasurementTypeID"", ""AssetStatusID"",
                   ""CIDMSSubComponentTypeID""
            FROM ""Asset_WIP_Register_Items""
            WHERE ""WIPRegister_ID"" = @id AND COALESCE(""IsAssetItem"", 0) = 1", new { id });

        var assetItems = assetItemRows.ToList();
        var count = 0;
        foreach (var item in assetItems)
        {
            decimal unitCost = 0m;
            if (item.cidmsSubComponentTypeID != null)
            {
                int cKey = (int)item.cidmsSubComponentTypeID;
                if (cidmsGroups.ContainsKey(cKey))
                {
                    decimal groupCost = cidmsGroups[cKey];
                    decimal genDist = totalCidmsCost > 0 ? groupCost / totalCidmsCost * generalCost : 0m;
                    decimal totalBoq = groupCost + genDist;
                    string sKey = cKey.ToString();
                    decimal survey = surveyData.ContainsKey(sKey) ? surveyData[sKey] : 1m;
                    unitCost = survey > 0 ? Math.Round(totalBoq / survey, 2) : 0m;
                }
            }
            if (unitCost == 0m) unitCost = (decimal?)item.amount ?? 0m;

            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_Register_Items""
                    (""Description"", ""AssetType_ID"", ""AssetCategory_ID"", ""AssetClass_ID"",
                     ""AssetStatus_ID"", ""MeasurementType_ID"",
                     ""CurrentAmount"", ""CrossReferenceOfUnbundledProject"",
                     ""DateCaptured"", ""Capturer_ID"")
                VALUES
                    (@description, @assetTypeId, @assetCategoryId, @assetSubCategoryId,
                     @assetStatusId, @measurementTypeId,
                     @amount, @wipRef,
                     NOW(), 1)",
                new
                {
                    description = (string?)item.assetDescription ?? (string?)item.description ?? "",
                    assetTypeId = (int?)item.assetTypeID,
                    assetCategoryId = (int?)item.assetCategoryID,
                    assetSubCategoryId = (int?)item.assetSubCategoryID,
                    assetStatusId = (int?)item.assetStatusID,
                    measurementTypeId = (int?)item.measurementTypeID,
                    amount = unitCost,
                    wipRef = id.ToString()
                });
            count++;
        }

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register""
            SET ""ProjectComplete"" = 1, ""UnbundlingStatus"" = 'Complete', ""DateModified"" = NOW()
            WHERE ""WIPRegister_ID"" = @id", new { id });

        return Ok(new { assetsCreated = count, message = $"{count} asset(s) added to the Asset Register" });
    }

    // ===== Document Endpoints =====

    [HttpGet("{id:int}/documents")]
    public async Task<IActionResult> GetDocuments(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var docs = await conn.QueryAsync(@"
            SELECT ""WIPDocument_ID"" AS ""id"",
                   ""WIPRegister_ID"" AS ""wipRegisterId"",
                   ""DocumentType""  AS ""documentType"",
                   ""DocumentName""  AS ""documentName"",
                   ""MimeType""      AS ""mimeType"",
                   ""FileSizeKB""    AS ""fileSizeKB"",
                   ""DateCaptured""  AS ""dateCaptured""
            FROM ""Asset_WIP_Documents""
            WHERE ""WIPRegister_ID"" = @id
            ORDER BY ""WIPDocument_ID""", new { id });
        return Ok(docs);
    }

    [HttpPost("{id:int}/documents")]
    public async Task<IActionResult> UploadDocument(int id, [FromBody] Dictionary<string, object?> body)
    {
        T? GetB<T>(string key) { if (!body.TryGetValue(key, out var v) || v is null) return default; var s = v.ToString(); if (string.IsNullOrWhiteSpace(s)) return default; try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); } catch { return default; } }
        var docType  = GetB<string>("documentType") ?? "Other";
        var docName  = GetB<string>("documentName");
        var fileData = GetB<string>("fileDataBase64");
        var mimeType = GetB<string>("mimeType");
        var sizeKB   = GetB<int?>("fileSizeKB");
        if (string.IsNullOrWhiteSpace(docName) || string.IsNullOrWhiteSpace(fileData))
            return BadRequest(new { error = "documentName and fileDataBase64 are required" });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var docId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_WIP_Documents""
                (""WIPRegister_ID"", ""DocumentType"", ""DocumentName"", ""FileData"", ""MimeType"", ""FileSizeKB"", ""DateCaptured"", ""CapturerID"")
            VALUES (@id, @docType, @docName, @fileData, @mimeType, @sizeKB, NOW(), 1)
            RETURNING ""WIPDocument_ID""",
            new { id, docType, docName, fileData, mimeType, sizeKB });
        return Ok(new { id = docId, wipRegisterId = id, documentType = docType, documentName = docName, mimeType, fileSizeKB = sizeKB });
    }

    [HttpGet("{id:int}/documents/{docId:int}/download")]
    public async Task<IActionResult> DownloadDocument(int id, int docId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var doc = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""DocumentName"", ""FileData"", ""MimeType""
            FROM ""Asset_WIP_Documents""
            WHERE ""WIPDocument_ID"" = @docId AND ""WIPRegister_ID"" = @id",
            new { id, docId });
        if (doc is null) return NotFound(new { error = "Document not found" });
        byte[] bytes;
        try { bytes = Convert.FromBase64String((string)doc.FileData); }
        catch { return BadRequest(new { error = "Stored file data is not valid base64" }); }
        var mime = (string?)doc.MimeType ?? "application/octet-stream";
        return File(bytes, mime, (string)doc.DocumentName);
    }

    [HttpDelete("{id:int}/documents/{docId:int}")]
    public async Task<IActionResult> DeleteDocument(int id, int docId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            DELETE FROM ""Asset_WIP_Documents""
            WHERE ""WIPDocument_ID"" = @docId AND ""WIPRegister_ID"" = @id",
            new { id, docId });
        return rows == 0 ? NotFound(new { error = "Document not found" }) : Ok(new { success = 1 });
    }

    // ===== Cost Distribution =====

    [HttpGet("{id:int}/cost-distribution")]
    public async Task<IActionResult> GetCostDistribution(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var items = await conn.QueryAsync<dynamic>(@"
            SELECT COALESCE(i.""IsAssetItem"", 0)          AS ""isAssetItem"",
                   COALESCE(i.""Amount"", 0)               AS ""amount"",
                   i.""CIDMSSubComponentTypeID""           AS ""cidmsSubComponentTypeId"",
                   s.""AssetCIDMSSubComponentTypeDesc""    AS ""cidmsSubComponentTypeDesc"",
                   i.""AssetTypeID""                       AS ""assetTypeId"",
                   i.""AssetCategoryID""                   AS ""assetCategoryId"",
                   i.""AssetSubCategoryID""                AS ""assetSubCategoryId""
            FROM ""Asset_WIP_Register_Items"" i
            LEFT JOIN ""Const_Asset_CIDMS_SubComponent_Type"" s
                ON s.""AssetCIDMSSubComponentTypeID"" = i.""CIDMSSubComponentTypeID""
            WHERE i.""WIPRegister_ID"" = @id", new { id });

        var finScmContractId = await conn.QuerySingleOrDefaultAsync<int?>(
            @"SELECT ""ScmContractID"" FROM ""Asset_WIP_Register"" WHERE ""WIPRegister_ID"" = @id",
            new { id });
        decimal actualExpenditure = 0m;
        if (finScmContractId.HasValue && finScmContractId.Value > 0)
            actualExpenditure = await _scmInvoice.GetContractTotalExpenditureAsync(finScmContractId.Value);

        var actualSurveyJson = await conn.QueryFirstOrDefaultAsync<string?>(@"
            SELECT ""ActualSurvey"" FROM ""Asset_WIP_Register"" WHERE ""WIPRegister_ID"" = @id",
            new { id });

        var surveyData = new Dictionary<string, decimal>();
        if (!string.IsNullOrWhiteSpace(actualSurveyJson))
        {
            try { surveyData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, decimal>>(actualSurveyJson) ?? new(); }
            catch { }
        }

        decimal generalCost = 0m;
        var cidmsGroups = new Dictionary<string, (decimal total, string desc, int? assetTypeId, int? assetCategoryId, int? assetSubCategoryId)>();

        var itemList = items.ToList();
        for (int i = 0; i < itemList.Count; i++)
        {
            var item = itemList[i];
            bool isAsset = ((int?)item.isAssetItem ?? 0) == 1;
            decimal amount = (decimal)(item.amount ?? 0m);
            if (!isAsset || item.cidmsSubComponentTypeId == null)
            {
                generalCost += amount;
            }
            else
            {
                string key = item.cidmsSubComponentTypeId.ToString()!;
                if (!cidmsGroups.ContainsKey(key))
                    cidmsGroups[key] = (0m, (string?)item.cidmsSubComponentTypeDesc ?? key, (int?)item.assetTypeId, (int?)item.assetCategoryId, (int?)item.assetSubCategoryId);
                var g = cidmsGroups[key];
                cidmsGroups[key] = (g.total + amount, g.desc, g.assetTypeId, g.assetCategoryId, g.assetSubCategoryId);
            }
        }

        decimal totalCidmsCost = 0m;
        foreach (var g in cidmsGroups.Values) totalCidmsCost += g.total;

        var rows = new List<object>();
        rows.Add(new {
            cidmsSubComponentTypeId = (int?)null,
            description = "General Cost",
            totalCost = Math.Round(generalCost, 2),
            generalCostDistribution = 0m,
            totalBoq = Math.Round(generalCost, 2),
            actualSurvey = (decimal?)null,
            unitCost = (decimal?)null
        });

        foreach (var kvp in cidmsGroups)
        {
            decimal totalCost = kvp.Value.total;
            decimal genDist = totalCidmsCost > 0 ? totalCost / totalCidmsCost * generalCost : 0m;
            decimal totalBoq = totalCost + genDist;
            decimal? survey = surveyData.TryGetValue(kvp.Key, out var sv) ? sv : null;
            decimal? unitCost = survey.HasValue && survey.Value > 0 ? Math.Round(totalBoq / survey.Value, 2) : null;
            rows.Add(new {
                cidmsSubComponentTypeId = int.Parse(kvp.Key),
                description = kvp.Value.desc,
                totalCost = Math.Round(totalCost, 2),
                generalCostDistribution = Math.Round(genDist, 2),
                totalBoq = Math.Round(totalBoq, 2),
                actualSurvey = survey,
                unitCost
            });
        }

        decimal totalProjectCost = generalCost + totalCidmsCost;
        return Ok(new {
            rows,
            totalProjectCost = Math.Round(totalProjectCost, 2),
            actualExpenditure = Math.Round(actualExpenditure, 2),
            difference = Math.Round(totalProjectCost - actualExpenditure, 2)
        });
    }

    // ===== Save Actual Survey =====

    [HttpPost("{id:int}/save-actual-survey")]
    public async Task<IActionResult> SaveActualSurvey(int id, [FromBody] System.Text.Json.JsonElement body)
    {
        string surveyJson = "{}";
        try
        {
            if (body.TryGetProperty("surveyData", out var sd))
                surveyJson = sd.GetRawText();
        }
        catch { }
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register""
            SET ""ActualSurvey"" = @surveyJson, ""DateModified"" = NOW()
            WHERE ""WIPRegister_ID"" = @id", new { id, surveyJson });
        if (rows == 0) return NotFound(new { error = "WIP register not found" });
        return Ok(new { success = 1 });
    }

    // ===== Commission =====

    [HttpPost("{id:int}/commission")]
    public async Task<IActionResult> Commission(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var surveyJson = await conn.QueryFirstOrDefaultAsync<string?>(@"
            SELECT ""ActualSurvey"" FROM ""Asset_WIP_Register"" WHERE ""WIPRegister_ID"" = @id",
            new { id });

        var surveyData = new Dictionary<string, decimal>();
        if (!string.IsNullOrWhiteSpace(surveyJson))
        {
            try { surveyData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, decimal>>(surveyJson) ?? new(); }
            catch { }
        }

        var allItems = await conn.QueryAsync<dynamic>(@"
            SELECT COALESCE(""IsAssetItem"", 0) AS ""isAssetItem"",
                   COALESCE(""Amount"", 0)      AS ""amount"",
                   ""CIDMSSubComponentTypeID""  AS ""cidmsSubComponentTypeId"",
                   ""BoqGroupId""              AS ""boqGroupId"",
                   ""AssetDescription""        AS ""assetDescription"",
                   ""AssetTypeID""             AS ""assetTypeId"",
                   ""AssetCategoryID""         AS ""assetCategoryId"",
                   ""AssetSubCategoryID""      AS ""assetSubCategoryId"",
                   ""MeasurementTypeID""       AS ""measurementTypeId"",
                   ""AssetStatusID""           AS ""assetStatusId""
            FROM ""Asset_WIP_Register_Items""
            WHERE ""WIPRegister_ID"" = @id", new { id });

        decimal generalCost = 0m;
        var cidmsGroups = new Dictionary<int, decimal>();
        var boqGroupItems = new Dictionary<int, List<dynamic>>();
        var allList = allItems.ToList();
        for (int i = 0; i < allList.Count; i++)
        {
            var item = allList[i];
            int? bgId = (int?)item.boqGroupId;
            if (bgId.HasValue)
            {
                if (!boqGroupItems.ContainsKey(bgId.Value)) boqGroupItems[bgId.Value] = new List<dynamic>();
                boqGroupItems[bgId.Value].Add(item);
                continue;
            }
            bool isAsset = ((int?)item.isAssetItem ?? 0) == 1;
            decimal amt = (decimal)(item.amount ?? 0m);
            if (!isAsset || item.cidmsSubComponentTypeId == null) { generalCost += amt; }
            else
            {
                int ckey = (int)item.cidmsSubComponentTypeId;
                cidmsGroups[ckey] = (cidmsGroups.ContainsKey(ckey) ? cidmsGroups[ckey] : 0m) + amt;
            }
        }

        decimal totalCidmsCost = 0m;
        foreach (var v in cidmsGroups.Values) totalCidmsCost += v;

        var assetItems = await conn.QueryAsync<dynamic>(@"
            SELECT ""WIPRegistrationItem_Id""       AS ""wipItemId"",
                   ""AssetDescription""             AS ""assetDescription"",
                   COALESCE(""Amount"", 0)          AS ""amount"",
                   ""AssetTypeID""                  AS ""assetTypeId"",
                   ""AssetCategoryID""              AS ""assetCategoryId"",
                   ""AssetSubCategoryID""           AS ""assetSubCategoryId"",
                   ""MeasurementTypeID""            AS ""measurementTypeId"",
                   ""AssetStatusID""                AS ""assetStatusId"",
                   ""CIDMSSubComponentTypeID""      AS ""cidmsSubComponentTypeId""
            FROM ""Asset_WIP_Register_Items""
            WHERE ""WIPRegister_ID"" = @id AND COALESCE(""IsAssetItem"", 0) = 1
              AND ""BoqGroupId"" IS NULL", new { id });

        // Group by (CIDMS, AssetType, AssetCategory, AssetSubCategory) — proportional to BOQ amount
        var comboGroups = new Dictionary<string, (int cidmsKey, int? atId, int? acId, int? asId, int? mtId, int? statusId, string desc, decimal totalBOQ)>();
        var cidmsBOQTotals = new Dictionary<int, decimal>();
        foreach (var item in assetItems)
        {
            if (item.cidmsSubComponentTypeId == null) continue;
            int cKey = (int)item.cidmsSubComponentTypeId;
            decimal amt = (decimal)(item.amount ?? 0m);
            int? atId = (int?)item.assetTypeId;
            int? acId = (int?)item.assetCategoryId;
            int? asId = (int?)item.assetSubCategoryId;
            string comboKey = $"{cKey}_{atId ?? 0}_{acId ?? 0}_{asId ?? 0}";
            if (!comboGroups.ContainsKey(comboKey))
                comboGroups[comboKey] = (cKey, atId, acId, asId, (int?)item.measurementTypeId, (int?)item.assetStatusId, (string?)item.assetDescription ?? "", 0m);
            var existing = comboGroups[comboKey];
            comboGroups[comboKey] = (existing.cidmsKey, existing.atId, existing.acId, existing.asId, existing.mtId, existing.statusId, existing.desc, existing.totalBOQ + amt);
            cidmsBOQTotals[cKey] = (cidmsBOQTotals.ContainsKey(cKey) ? cidmsBOQTotals[cKey] : 0m) + amt;
        }

        // Track (assetId, unitCost) for transfer processing
        var createdAssets = new List<(int assetId, decimal unitCost)>();
        int count = 0;
        foreach (var kvp in comboGroups)
        {
            var combo = kvp.Value;
            int cKey = combo.cidmsKey;
            string sKey = cKey.ToString();

            decimal groupCost = cidmsGroups.ContainsKey(cKey) ? cidmsGroups[cKey] : 0m;
            decimal genDist = totalCidmsCost > 0 ? groupCost / totalCidmsCost * generalCost : 0m;
            decimal totalBoq = groupCost + genDist;
            decimal survey = surveyData.ContainsKey(sKey) ? surveyData[sKey] : 1m;
            decimal unitCost = survey > 0 ? Math.Round(totalBoq / survey, 2) : 0m;

            // Split survey count proportionally among combos within this CIDMS group
            decimal cidmsTotalBOQ = cidmsBOQTotals.ContainsKey(cKey) ? cidmsBOQTotals[cKey] : 1m;
            double proportion = cidmsTotalBOQ > 0 ? (double)(combo.totalBOQ / cidmsTotalBOQ) : 1.0;

            // Count combos in this CIDMS group to correctly split
            int combosInGroup = 0;
            foreach (var k in comboGroups.Keys) { if (comboGroups[k].cidmsKey == cKey) combosInGroup++; }
            int assetCount = combosInGroup == 1 ? (int)Math.Max(1, survey) : (int)Math.Max(1, Math.Round((double)survey * proportion));
            // Safety cap: never create more than 500 assets per combo to prevent flooding
            if (assetCount > 500) assetCount = 500;

            for (int n = 0; n < assetCount; n++)
            {
                var newAssetId = await conn.ExecuteScalarAsync<int>(@"
                    INSERT INTO ""Asset_Register_Items""
                        (""Description"", ""AssetType_ID"", ""AssetCategory_ID"", ""AssetClass_ID"",
                         ""AssetStatus_ID"", ""MeasurementType_ID"",
                         ""CurrentAmount"", ""CrossReferenceOfUnbundledProject"",
                         ""DateCaptured"", ""Capturer_ID"")
                    VALUES
                        (@description, @assetTypeId, @assetCategoryId, @assetSubCategoryId,
                         @assetStatusId, @measurementTypeId,
                         @amount, @wipRef,
                         NOW(), 1)
                    RETURNING ""AssetRegisterItem_ID""",
                    new {
                        description = combo.desc,
                        assetTypeId = combo.atId,
                        assetCategoryId = combo.acId,
                        assetSubCategoryId = combo.asId,
                        assetStatusId = combo.statusId,
                        measurementTypeId = combo.mtId,
                        amount = unitCost,
                        wipRef = id.ToString()
                    });
                createdAssets.Add((newAssetId, unitCost));
                count++;
            }
        }

        // === BOQ-group based assets (grouped lines) ===
        foreach (var kvpGroup in boqGroupItems)
        {
            decimal totalGroupAmt = 0m;
            dynamic? assetLine = null;
            var groupLines = kvpGroup.Value;
            for (int gi = 0; gi < groupLines.Count; gi++)
            {
                totalGroupAmt += (decimal)(groupLines[gi].amount ?? 0m);
                if (((int?)groupLines[gi].isAssetItem ?? 0) == 1) assetLine = groupLines[gi];
            }
            if (assetLine == null) continue;

            var groupAssetId = await conn.ExecuteScalarAsync<int>(@"
                INSERT INTO ""Asset_Register_Items""
                    (""Description"", ""AssetType_ID"", ""AssetCategory_ID"", ""AssetClass_ID"",
                     ""AssetStatus_ID"", ""MeasurementType_ID"",
                     ""CurrentAmount"", ""CrossReferenceOfUnbundledProject"",
                     ""DateCaptured"", ""Capturer_ID"")
                VALUES
                    (@description, @assetTypeId, @assetCategoryId, @assetSubCategoryId,
                     @assetStatusId, @measurementTypeId,
                     @amount, @wipRef,
                     NOW(), 1)
                RETURNING ""AssetRegisterItem_ID""",
                new {
                    description = (string?)assetLine.assetDescription ?? "",
                    assetTypeId = (int?)assetLine.assetTypeId,
                    assetCategoryId = (int?)assetLine.assetCategoryId,
                    assetSubCategoryId = (int?)assetLine.assetSubCategoryId,
                    assetStatusId = (int?)assetLine.assetStatusId,
                    measurementTypeId = (int?)assetLine.measurementTypeId,
                    amount = totalGroupAmt,
                    wipRef = id.ToString()
                });
            createdAssets.Add((groupAssetId, totalGroupAmt));
            count++;
        }

        // === Transfer records and approval (no GL) ===
        // Get the main asset being unbundled
        var mainAssetId = await conn.QueryFirstOrDefaultAsync<int?>(@"
            SELECT ""AssetRegisterItem_ID"" FROM ""Asset_WIP_Register"" WHERE ""WIPRegister_ID"" = @id",
            new { id });

        var transferDate = DateTime.UtcNow;
        int GetTxnPeriod(DateTime dt) => dt.Month <= 6 ? dt.Month + 6 : dt.Month - 6;
        string GetTxnFinYear(DateTime dt) => dt.Month <= 6
            ? (dt.Year - 1) + "/" + dt.Year
            : dt.Year + "/" + (dt.Year + 1);

        var txnPeriod = GetTxnPeriod(transferDate);
        var txnFinYear = GetTxnFinYear(transferDate);

        var transferTxnTypeId = await conn.QueryFirstOrDefaultAsync<int?>(@"
            SELECT d.""ReferenceData_ID""
            FROM ""Const_ReferenceData_sys"" d
            INNER JOIN ""Const_ReferenceType_sys"" t ON t.""ReferenceType_ID"" = d.""ReferenceTypeID""
            WHERE t.""Name"" = 'AssetTransactionTypes' AND d.""Description"" = 'Asset Transfer'") ?? 0;

        var documentTypeId = await _lookup.GetDocumentTypeIdAsync(conn, "Asset Transfer");

        var transferIds = new List<int>();
        foreach (var (assetId, unitCost) in createdAssets)
        {
            var transferId = await conn.ExecuteScalarAsync<int>(@"
                INSERT INTO ""Asset_Transfer_Transactions""
                    (""AssetItemID"", ""TransferDate"", ""TransferValue"", ""MainAssetID"",
                     ""DateCaptured"", ""CapturerID"", ""IsApproved"")
                VALUES
                    (@AssetItemID, @TransferDate, @TransferValue, @MainAssetID,
                     NOW(), 1, 0)
                RETURNING ""AssetTransfer_ID""",
                new {
                    AssetItemID = assetId,
                    TransferDate = transferDate,
                    TransferValue = unitCost,
                    MainAssetID = mainAssetId
                });
            transferIds.Add(transferId);
        }

        // Create Asset_Register_Transactions for each new asset (TransferTo)
        var glGuid = Guid.NewGuid().ToString();
        for (int i = 0; i < createdAssets.Count; i++)
        {
            var (assetId, unitCost) = createdAssets[i];
            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_Register_Transactions""
                    (""AssetRegisterItem_ID"", ""TransactionTypeID"", ""TransactionDate"",
                     ""PurchaseAmount"", ""ResidualValue"", ""CurrentValue"", ""UsefulLife"", ""RemaingUsefulLife"",
                     ""DepreciationValue"", ""ImpairmentValue"", ""RevaluationValue"", ""FairValue"",
                     ""DisposalValue"", ""DisposalLossValue"", ""DisposalTotalValue"",
                     ""AccumulatedDepreciation"", ""AccumulatedImpairment"", ""AccumulatedFairValue"", ""AccumulatedRevaluation"",
                     ""FinancialPeriod"", ""FinancialYear"", ""DocumentType_ID"", ""GLGUID_ID"",
                     ""DateModified"", ""Modifier"",
                     ""ImpairmentReversalValue"", ""AccumulatedImpairmentReversal"", ""ImpairmentSurplus"",
                     ""MovementInRevaluationReserve"", ""DepreciationOffset"",
                     ""RevaluationReserveImpairment"", ""RevaluationReserveImpairmentReversal"",
                     ""RevaluationReserveRevaluation"", ""RevaluationReserveDisposal"", ""DepreciationAdjustment"",
                     ""TransferFromValue"", ""TransferToValue"")
                VALUES
                    (@AssetId, @TxnTypeId, @TxnDate,
                     0, 0, @CurrentValue, 0, 0,
                     0, 0, 0, 0,
                     0, 0, 0,
                     0, 0, 0, 0,
                     @FinPeriod, @FinYear, @DocTypeId, @GlGuid,
                     NOW(), 1,
                     0, 0, 0,
                     0, 0,
                     0, 0,
                     0, 0, 0,
                     0, @TransferToValue)",
                new {
                    AssetId = assetId,
                    TxnTypeId = transferTxnTypeId,
                    TxnDate = transferDate,
                    CurrentValue = unitCost,
                    FinPeriod = txnPeriod,
                    FinYear = txnFinYear,
                    DocTypeId = documentTypeId,
                    GlGuid = glGuid,
                    TransferToValue = unitCost
                });

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items"" SET ""TransferToAmount"" = @v WHERE ""AssetRegisterItem_ID"" = @id",
                new { v = unitCost, id = assetId });
        }

        // Create Asset_Register_Transactions for the main asset (TransferFrom)
        if (mainAssetId.HasValue && createdAssets.Count > 0)
        {
            decimal totalTransferred = 0m;
            for (int i = 0; i < createdAssets.Count; i++) totalTransferred += createdAssets[i].unitCost;

            var mainCurrentValue = await conn.QueryFirstOrDefaultAsync<decimal?>(@"
                SELECT COALESCE(""CurrentAmount"", 0) FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @id",
                new { id = mainAssetId.Value }) ?? 0m;
            var newMainValue = mainCurrentValue - totalTransferred;

            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_Register_Transactions""
                    (""AssetRegisterItem_ID"", ""TransactionTypeID"", ""TransactionDate"",
                     ""PurchaseAmount"", ""ResidualValue"", ""CurrentValue"", ""UsefulLife"", ""RemaingUsefulLife"",
                     ""DepreciationValue"", ""ImpairmentValue"", ""RevaluationValue"", ""FairValue"",
                     ""DisposalValue"", ""DisposalLossValue"", ""DisposalTotalValue"",
                     ""AccumulatedDepreciation"", ""AccumulatedImpairment"", ""AccumulatedFairValue"", ""AccumulatedRevaluation"",
                     ""FinancialPeriod"", ""FinancialYear"", ""DocumentType_ID"", ""GLGUID_ID"",
                     ""DateModified"", ""Modifier"",
                     ""ImpairmentReversalValue"", ""AccumulatedImpairmentReversal"", ""ImpairmentSurplus"",
                     ""MovementInRevaluationReserve"", ""DepreciationOffset"",
                     ""RevaluationReserveImpairment"", ""RevaluationReserveImpairmentReversal"",
                     ""RevaluationReserveRevaluation"", ""RevaluationReserveDisposal"", ""DepreciationAdjustment"",
                     ""TransferFromValue"", ""TransferToValue"")
                VALUES
                    (@AssetId, @TxnTypeId, @TxnDate,
                     0, 0, @CurrentValue, 0, 0,
                     0, 0, 0, 0,
                     0, 0, 0,
                     0, 0, 0, 0,
                     @FinPeriod, @FinYear, @DocTypeId, @GlGuid,
                     NOW(), 1,
                     0, 0, 0,
                     0, 0,
                     0, 0,
                     0, 0, 0,
                     @TransferFromValue, 0)",
                new {
                    AssetId = mainAssetId.Value,
                    TxnTypeId = transferTxnTypeId,
                    TxnDate = transferDate,
                    CurrentValue = newMainValue,
                    FinPeriod = txnPeriod,
                    FinYear = txnFinYear,
                    DocTypeId = documentTypeId,
                    GlGuid = glGuid,
                    TransferFromValue = totalTransferred
                });

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items"" SET ""CurrentAmount"" = @v WHERE ""AssetRegisterItem_ID"" = @id",
                new { v = newMainValue, id = mainAssetId.Value });
        }

        // Mark all transfer records as approved
        if (transferIds.Count > 0)
        {
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Transfer_Transactions""
                SET ""IsApproved"" = 1, ""DateModified"" = NOW(), ""ModifierID"" = @modifierId
                WHERE ""AssetTransfer_ID"" = ANY(@ids)",
                new { ids = transferIds.ToArray(), modifierId = this.GetCapturerId() });
        }

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register""
            SET ""ProjectComplete"" = 1, ""UnbundlingStatus"" = 'Complete', ""DateModified"" = NOW()
            WHERE ""WIPRegister_ID"" = @id", new { id });

        // Rebuild transaction summary for all new assets, then the main asset
        var wipFinYear = await conn.QueryFirstOrDefaultAsync<string?>(@"
            SELECT ""FinYear"" FROM ""Asset_WIP_Register"" WHERE ""WIPRegister_ID"" = @id", new { id });
        var finYear = wipFinYear ?? DateTime.UtcNow.Year.ToString();
        foreach (var (assetId, _) in createdAssets)
        {
            try { await _txnService.PopulateTransactionSummarySingle(assetId, finYear, 1); }
            catch (Exception ex) { Console.WriteLine($"ATS rebuild failed for commissioned asset {assetId}: {ex.Message}"); }
        }
        if (mainAssetId.HasValue)
        {
            try { await _txnService.PopulateTransactionSummarySingle(mainAssetId.Value, finYear, 1); }
            catch (Exception ex) { Console.WriteLine($"ATS rebuild failed for main asset {mainAssetId.Value}: {ex.Message}"); }
        }

        return Ok(new { assetsCreated = count, message = $"{count} asset(s) commissioned to the Asset Register" });
    }

    [HttpPost("{id:int}/decline-commission")]
    public async Task<IActionResult> DeclineCommission(int id, [FromBody] Dictionary<string, object?> body)
    {
        T? GetDC<T>(string key) { if (!body.TryGetValue(key, out var v) || v is null) return default; var s = v.ToString(); if (string.IsNullOrWhiteSpace(s)) return default; try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); } catch { return default; } }
        var comment = GetDC<string>("comment");
        if (string.IsNullOrWhiteSpace(comment))
            return BadRequest(new { error = "A comment is required when declining" });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register""
            SET ""UnbundlingStatus"" = 'Approved',
                ""UnbundlingComment"" = @comment,
                ""DateModified"" = NOW()
            WHERE ""WIPRegister_ID"" = @id", new { id, comment });
        if (rows == 0) return NotFound(new { error = "WIP register not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(BaseSelect + @" WHERE w.""WIPRegister_ID"" = @id", new { id });
        return Ok(updated);
    }

    // ===== Generated Assets =====

    [HttpGet("{id:int}/generated-assets")]
    public async Task<IActionResult> GetGeneratedAssets(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var assets = await conn.QueryAsync(@"
            SELECT a.""AssetRegisterItem_ID""  AS ""assetRegisterItemId"",
                   a.""Description""           AS ""description"",
                   a.""AssetType_ID""          AS ""assetTypeId"",
                   t.""AssetTypeDesc""         AS ""assetTypeDesc"",
                   a.""AssetCategory_ID""      AS ""assetCategoryId"",
                   c.""AssetCategoryDesc""     AS ""assetCategoryDesc"",
                   a.""AssetClass_ID""         AS ""assetSubCategoryId"",
                   sub.""Asset_SubCategoryDescription"" AS ""assetSubCategoryDesc"",
                   a.""AssetStatus_ID""        AS ""assetStatusId"",
                   s.""AssetStatusDesc""       AS ""assetStatusDesc"",
                   a.""MeasurementType_ID""    AS ""measurementTypeId"",
                   mt.""Name""                 AS ""measurementTypeDesc"",
                   COALESCE(a.""CurrentAmount"", 0) AS ""currentAmount"",
                   a.""DateCaptured""          AS ""dateCaptured""
            FROM ""Asset_Register_Items"" a
            LEFT JOIN ""Const_AssetType_Sys"" t ON t.""AssetType_ID"" = a.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" c ON c.""AssetCategoryID"" = a.""AssetCategory_ID""
            LEFT JOIN ""Const_Asset_SubCategory"" sub ON sub.""Asset_SubCategory_ID"" = a.""AssetClass_ID""
            LEFT JOIN ""Const_AssetStatus_Sys"" s ON s.""AssetStatus_ID"" = a.""AssetStatus_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON mt.""AssetConfig_MeasurementType_ID"" = a.""MeasurementType_ID""
            WHERE a.""CrossReferenceOfUnbundledProject"" = @wipRef
            ORDER BY a.""AssetRegisterItem_ID""",
            new { wipRef = id.ToString() });
        return Ok(assets);
    }

    [HttpPost("{id:int}/upload-asset-list")]
    public async Task<IActionResult> UploadAssetList(int id, [FromBody] List<Dictionary<string, object?>> rows)
    {
        if (rows == null || rows.Count == 0)
            return Ok(new { updated = 0, skipped = 0, errors = new List<string>() });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var errors = new List<string>();
        int updated = 0;
        int skipped = 0;
        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            string? GetStr(string key) { if (!row.TryGetValue(key, out var v) || v is null) return null; var s = v.ToString(); return string.IsNullOrWhiteSpace(s) ? null : s; }

            var rawId = GetStr("assetRegisterItemId");
            if (string.IsNullOrWhiteSpace(rawId)) { errors.Add($"Row {i + 1}: missing assetRegisterItemId"); skipped++; continue; }
            if (!int.TryParse(rawId, out int assetId)) { errors.Add($"Row {i + 1}: assetRegisterItemId '{rawId}' is not a valid integer"); skipped++; continue; }

            // Validate currentAmount if provided
            var rawAmount = GetStr("currentAmount");
            decimal? currentAmount = null;
            if (!string.IsNullOrWhiteSpace(rawAmount))
            {
                if (!decimal.TryParse(rawAmount, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal parsedAmt))
                { errors.Add($"Row {i + 1}: currentAmount '{rawAmount}' is not a valid number"); skipped++; continue; }
                currentAmount = parsedAmt;
            }

            var description = GetStr("description");

            // Validate integer ID fields if provided
            int? assetTypeId = null, assetCategoryId = null, assetSubCategoryId = null, assetStatusId = null, measurementTypeId = null;
            var rawAssetTypeId = GetStr("assetTypeId");
            if (!string.IsNullOrWhiteSpace(rawAssetTypeId)) { if (!int.TryParse(rawAssetTypeId, out var v)) { errors.Add($"Row {i + 1}: assetTypeId '{rawAssetTypeId}' must be an integer"); skipped++; continue; } else assetTypeId = v; }
            var rawCategoryId = GetStr("assetCategoryId");
            if (!string.IsNullOrWhiteSpace(rawCategoryId)) { if (!int.TryParse(rawCategoryId, out var v)) { errors.Add($"Row {i + 1}: assetCategoryId '{rawCategoryId}' must be an integer"); skipped++; continue; } else assetCategoryId = v; }
            var rawSubCategoryId = GetStr("assetSubCategoryId");
            if (!string.IsNullOrWhiteSpace(rawSubCategoryId)) { if (!int.TryParse(rawSubCategoryId, out var v)) { errors.Add($"Row {i + 1}: assetSubCategoryId '{rawSubCategoryId}' must be an integer"); skipped++; continue; } else assetSubCategoryId = v; }
            var rawStatusId = GetStr("assetStatusId");
            if (!string.IsNullOrWhiteSpace(rawStatusId)) { if (!int.TryParse(rawStatusId, out var v)) { errors.Add($"Row {i + 1}: assetStatusId '{rawStatusId}' must be an integer"); skipped++; continue; } else assetStatusId = v; }
            var rawMeasureId = GetStr("measurementTypeId");
            if (!string.IsNullOrWhiteSpace(rawMeasureId)) { if (!int.TryParse(rawMeasureId, out var v)) { errors.Add($"Row {i + 1}: measurementTypeId '{rawMeasureId}' must be an integer"); skipped++; continue; } else measurementTypeId = v; }

            var affected = await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items""
                SET ""Description"" = COALESCE(@description, ""Description""),
                    ""CurrentAmount"" = COALESCE(@currentAmount, ""CurrentAmount""),
                    ""AssetType_ID"" = COALESCE(@assetTypeId, ""AssetType_ID""),
                    ""AssetCategory_ID"" = COALESCE(@assetCategoryId, ""AssetCategory_ID""),
                    ""AssetClass_ID"" = COALESCE(@assetSubCategoryId, ""AssetClass_ID""),
                    ""AssetStatus_ID"" = COALESCE(@assetStatusId, ""AssetStatus_ID""),
                    ""MeasurementType_ID"" = COALESCE(@measurementTypeId, ""MeasurementType_ID""),
                    ""DateModified"" = NOW()
                WHERE ""AssetRegisterItem_ID"" = @assetId
                  AND ""CrossReferenceOfUnbundledProject"" = @wipRef",
                new { description, currentAmount, assetTypeId, assetCategoryId, assetSubCategoryId,
                      assetStatusId, measurementTypeId, assetId, wipRef = id.ToString() });

            if (affected == 0)
            { errors.Add($"Row {i + 1}: asset ID {assetId} not found for this WIP project"); skipped++; }
            else
            { updated++; }
        }

        return Ok(new { updated, skipped, errors });
    }

    private static DynamicParameters BuildParams(Dictionary<string, object?> m)
    {
        T? Get<T>(string key)
        {
            if (!m.TryGetValue(key, out var v) || v is null) return default;
            var s = v.ToString();
            if (string.IsNullOrWhiteSpace(s)) return default;
            try
            {
                var underlying = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T);
                return (T)Convert.ChangeType(s, underlying);
            }
            catch { return default; }
        }
        var p = new DynamicParameters();
        p.Add("projectName", Get<string>("projectName"));
        p.Add("projectNo", Get<string>("projectNo"));
        p.Add("projectNumber", Get<string>("projectNumber"));
        p.Add("contractNumber", Get<string>("contractNumber"));
        p.Add("contractStartDate", Get<DateTime?>("contractStartDate"));
        p.Add("contractEndDate", Get<DateTime?>("contractEndDate"));
        p.Add("contractValue", Get<decimal?>("contractValue"));
        p.Add("totalBudget", Get<decimal?>("totalBudget"));
        p.Add("totalExpenditure", Get<decimal?>("totalExpenditure"));
        p.Add("finYear", Get<string>("finYear"));
        p.Add("status", Get<string>("status"));
        p.Add("statusId", Get<int?>("statusId"));
        p.Add("fundingTypeId", Get<int?>("fundingTypeId"));
        p.Add("departmentId", Get<int?>("departmentId"));
        p.Add("divisionId", Get<int?>("divisionId"));
        p.Add("startDate", Get<DateTime?>("startDate"));
        p.Add("expectedEndDate", Get<DateTime?>("expectedEndDate"));
        p.Add("actualEndDate", Get<DateTime?>("actualEndDate"));
        p.Add("completionDate", Get<DateTime?>("completionDate"));
        p.Add("wipOpeningBalance", Get<decimal?>("wipOpeningBalance"));
        p.Add("wipClosingBalance", Get<decimal?>("wipClosingBalance"));
        p.Add("additions", Get<decimal?>("additions"));
        p.Add("transferOfAssets", Get<decimal?>("transferOfAssets"));
        p.Add("writeOff", Get<decimal?>("writeOff"));
        p.Add("impairment", Get<decimal?>("impairment"));
        p.Add("priorYearAdjustment", Get<decimal?>("priorYearAdjustment"));
        p.Add("financialProgress", Get<decimal?>("financialProgress"));
        p.Add("budgetProjectId", Get<int?>("budgetProjectId"));
        p.Add("actualSurvey", Get<string>("actualSurvey"));
        p.Add("mainAssetDescription", Get<string>("mainAssetDescription"));
        p.Add("scmContractId", Get<int?>("scmContractId"));
        p.Add("contractId", Get<int?>("contractId"));
        p.Add("latitude", Get<decimal?>("latitude"));
        p.Add("longitude", Get<decimal?>("longitude"));
        return p;
    }

    // ─── SCM sync ────────────────────────────────────────────────────────────

    [HttpPost("sync-scm")]
    public async Task<IActionResult> SyncScm()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var wipProjects = await conn.QueryAsync<dynamic>(@"
            SELECT ""WIPRegister_ID"" AS ""wipRegisterId"", ""ContractID"" AS ""contractId""
            FROM ""Asset_WIP_Register""
            WHERE ""ContractID"" IS NOT NULL");

        int syncedProjects = 0;
        int totalNewDetails = 0;

        for (int i = 0; i < wipProjects.AsList().Count; i++)
        {
            var wip = wipProjects.AsList()[i];
            int wipId = (int)wip.wipRegisterId;
            int contractId = (int)wip.contractId;

            int countBefore = await conn.QuerySingleAsync<int>(
                @"SELECT COUNT(*) FROM ""Asset_WIP_Register_Details"" WHERE ""WIPRegister_ID"" = @wipId",
                new { wipId });
            var wipInvoices = await _scmInvoice.GetInvoicesForWipInsertionAsync(contractId);
            await _scmInvoice.InsertWipDetailsFromPreFetchedAsync(conn, wipId, wipInvoices);
            int countAfter = await conn.QuerySingleAsync<int>(
                @"SELECT COUNT(*) FROM ""Asset_WIP_Register_Details"" WHERE ""WIPRegister_ID"" = @wipId",
                new { wipId });
            int inserted = countAfter - countBefore;

            if (inserted > 0)
            {
                totalNewDetails += inserted;
                syncedProjects++;
                await RecalculateWipTotals(conn, wipId);
                await RebuildWipAssetSummary(conn, wipId);
            }
        }

        return Ok(new { synced = syncedProjects, newDetails = totalNewDetails });
    }

    private async System.Threading.Tasks.Task RecalculateWipTotals(System.Data.Common.DbConnection conn, int wipId)
    {
        var scmContractId = await conn.QuerySingleOrDefaultAsync<int?>(
            @"SELECT ""ScmContractID"" FROM ""Asset_WIP_Register"" WHERE ""WIPRegister_ID"" = @wipId",
            new { wipId });
        decimal totalExpenditure = 0m;
        if (scmContractId.HasValue && scmContractId.Value > 0)
            totalExpenditure = await _scmInvoice.GetContractTotalExpenditureAsync(scmContractId.Value);
        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register"" SET
                ""TotalExpenditure"" = @totalExpenditure,
                ""Additions""        = @totalExpenditure,
                ""WIPClosingBalance"" = COALESCE(""WIPOpeningBalance"", 0) + @totalExpenditure
                    - COALESCE(""TransferOfAssets"", 0)
                    - COALESCE(""WriteOff"", 0)
                    - COALESCE(""Impairment"", 0)
                    + COALESCE(""PriorYearAdjustment"", 0),
                ""FinancialProgress"" = CASE
                    WHEN COALESCE(""ContractValue"", 0) > 0 THEN ROUND((
                        COALESCE(""WIPOpeningBalance"", 0) + @totalExpenditure
                        - COALESCE(""TransferOfAssets"", 0)
                        - COALESCE(""WriteOff"", 0)
                        - COALESCE(""Impairment"", 0)
                        + COALESCE(""PriorYearAdjustment"", 0)
                    ) / ""ContractValue"" * 100, 1)
                    ELSE 0
                END,
                ""DateModified"" = NOW()
            WHERE ""WIPRegister_ID"" = @wipId",
            new { wipId, totalExpenditure });
    }

    private async System.Threading.Tasks.Task RebuildWipAssetSummary(System.Data.Common.DbConnection conn, int wipId)
    {
        var wip = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""AssetRegisterItem_ID"", ""FinYear"", ""WIPClosingBalance""
            FROM ""Asset_WIP_Register""
            WHERE ""WIPRegister_ID"" = @wipId AND ""AssetRegisterItem_ID"" IS NOT NULL",
            new { wipId });

        if (wip == null) return;

        int assetId = (int)wip.AssetRegisterItem_ID;
        decimal wipClosing = (decimal)(wip.WIPClosingBalance ?? 0m);
        string finYear = (string)(wip.FinYear ?? DateTime.UtcNow.Year.ToString());

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_Register_Items"" SET
                ""CurrentAmount""                 = @wipClosing,
                ""PurchaseAmount""                = @wipClosing,
                ""CurrentReplacementCostCRC""     = @wipClosing,
                ""DepreciatedReplacementCostDRC"" = @wipClosing,
                ""DateModified""                  = NOW()
            WHERE ""AssetRegisterItem_ID"" = @assetId",
            new { wipClosing, assetId });

        try
        {
            await _txnService.PopulateTransactionSummarySingle(assetId, finYear, 1);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ATS rebuild failed for WIP asset {assetId}: {ex.Message}");
        }
    }

    [HttpGet("{id:int}/scm-boq-seed")]
    public async Task<IActionResult> GetScmBoqSeed(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var scmContractId = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT ""ScmContractID"" FROM ""Asset_WIP_Register"" WHERE ""WIPRegister_ID"" = @id",
            new { id });

        if (scmContractId == null || scmContractId == 0)
            return Ok(new List<object>());

        var rows = await _scmUnbundling.GetDetailsByContractAsync(scmContractId.Value);
        return Ok(rows);
    }
}
