using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/workflows")]
public class WorkflowController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;
    private readonly IServiceProvider _serviceProvider;

    public WorkflowController(DbConnectionFactory db, TransactionService txnService, IServiceProvider serviceProvider)
    {
        _db = db;
        _txnService = txnService;
        _serviceProvider = serviceProvider;
    }

    [HttpGet("definitions")]
    public async Task<IActionResult> GetDefinitions()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""Asset_WorkflowDefinitions"" WHERE ""is_active"" = TRUE ORDER BY ""name""");
        return Ok(items);
    }

    [HttpPost("definitions")]
    public async Task<IActionResult> CreateDefinition([FromBody] WorkflowDefinitionRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstAsync<dynamic>(@"
            INSERT INTO ""Asset_WorkflowDefinitions"" (""name"", ""entity_type"", ""steps"")
            VALUES (@Name, @EntityType, @Steps) RETURNING *",
            new { request.Name, request.EntityType, Steps = System.Text.Json.JsonSerializer.Serialize(request.Steps) });
        return CreatedAtAction(null, result);
    }

    [HttpPost("initiate")]
    public async Task<IActionResult> Initiate([FromBody] WorkflowInitiateRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        string entityType = request.EntityType ?? "";
        string entityId = request.EntityId ?? "";
        string mssqlRefId = request.MssqlReferenceId ?? "";

        var def = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""id"", ""name"", ""entity_type"" FROM ""Asset_WorkflowDefinitions"" WHERE ""entity_type"" = @entityType AND ""is_active"" = TRUE OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            new { entityType });
        if (def is null) return NotFound(new { error = $"No workflow definition for entity type: {entityType}" });

        int defId = (int)(def.id);
        string dataJson = System.Text.Json.JsonSerializer.Serialize(request.Data ?? new { });

        var result = await conn.QueryFirstAsync<dynamic>(@"
            INSERT INTO ""Asset_WorkflowInstances"" (""definition_id"", ""entity_type"", ""entity_id"", ""current_step"", ""status"", ""initiated_by"", ""data"", ""mssql_reference_id"")
            VALUES (@defId, @entityType, @entityId, 1, 'pending', 1, @dataJson::jsonb, @mssqlRefId) RETURNING *",
            new { defId, entityType, entityId, dataJson, mssqlRefId });
        return CreatedAtAction(null, result);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT wi.*, wd.""name"" as workflow_name, wd.""steps""
            FROM ""Asset_WorkflowInstances"" wi
            JOIN ""Asset_WorkflowDefinitions"" wd ON wi.""definition_id"" = wd.""id""
            WHERE wi.""status"" IN ('pending', 'in_progress')
            ORDER BY wi.""initiated_at"" DESC");
        return Ok(items);
    }

    [HttpGet("pending-count")]
    public async Task<IActionResult> GetPendingCount()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var depCount = await conn.QuerySingleAsync<int>(@"
            SELECT COUNT(*) FROM ""Asset_WorkflowInstances""
            WHERE ""entity_type"" = 'depreciation'
              AND ""status"" IN ('pending', 'in_progress')");

        var impCount = await conn.QuerySingleAsync<int>(@"
            SELECT COUNT(*) FROM ""Asset_Impairment""
            WHERE COALESCE(""Approved"", 0) = 0
              AND COALESCE(""IsRejected"", 0) = 0");

        var dispCount = await conn.QuerySingleAsync<int>(@"
            SELECT COUNT(*) FROM ""Asset_Disposal""
            WHERE ""Status"" IN ('Pending', 'Submitted')");

        var revalCount = await conn.QuerySingleAsync<int>(@"
            SELECT COUNT(*) FROM ""Asset_Revaluations""
            WHERE (""Approved"" IS NULL OR ""Approved"" = FALSE)
              AND ""RejectedDate"" IS NULL");

        // Asset register approvals (new acquisitions + edits pending approval)
        var assetApprovalCount = 0;
        var approvalTableExists = await conn.QuerySingleAsync<bool>(@"
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'Asset_Register_Item_Approval'
            )");
        if (approvalTableExists)
        {
            assetApprovalCount = await conn.QuerySingleAsync<int>(@"
                SELECT COUNT(*) FROM ""Asset_Register_Item_Approval""
                WHERE ""Status"" = 'Pending'");
        }

        var total = depCount + impCount + dispCount + revalCount + assetApprovalCount;
        return Ok(new
        {
            total,
            depreciation = depCount,
            impairments = impCount,
            disposals = dispCount,
            revaluations = revalCount,
            assetApprovals = assetApprovalCount
        });
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT wi.*, wd.""name"" as workflow_name, wd.""steps""
            FROM ""Asset_WorkflowInstances"" wi
            JOIN ""Asset_WorkflowDefinitions"" wd ON wi.""definition_id"" = wd.""id""
            ORDER BY wi.""initiated_at"" DESC OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY");
        return Ok(items);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var stats = await conn.QueryFirstAsync<dynamic>(@"
            SELECT
                COUNT(*) FILTER (WHERE ""status"" = 'pending') AS pending,
                COUNT(*) FILTER (WHERE ""status"" = 'in_progress') AS in_progress,
                COUNT(*) FILTER (WHERE ""status"" = 'approved' AND ""completed_at"" = CURRENT_DATE) AS approved_today,
                COUNT(*) FILTER (WHERE ""status"" = 'rejected' AND ""completed_at"" = CURRENT_DATE) AS rejected_today,
                COUNT(*) FILTER (WHERE ""status"" = 'approved') AS total_approved,
                COUNT(*) FILTER (WHERE ""status"" = 'rejected') AS total_rejected
            FROM ""Asset_WorkflowInstances""");
        return Ok(stats);
    }

    [HttpPost("submit/{id:int}")]
    public async Task<IActionResult> Submit(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_WorkflowInstances""
            SET ""status"" = 'in_progress', ""current_step"" = 2
            WHERE ""id"" = @id AND ""status"" = 'pending'", new { id });
        if (rows == 0)
            return NotFound(new { error = "Workflow not found or not in pending status" });
        var updated = await conn.QueryFirstAsync<dynamic>(@"
            SELECT wi.*, wd.""name"" as workflow_name, wd.""steps""
            FROM ""Asset_WorkflowInstances"" wi
            JOIN ""Asset_WorkflowDefinitions"" wd ON wi.""definition_id"" = wd.""id""
            WHERE wi.""id"" = @id", new { id });
        return Ok(updated);
    }

    [HttpGet("last-depreciation-date")]
    public async Task<IActionResult> GetLastDepreciationDate()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var row = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT MAX(""DepreciationDate"") as ""lastDate"" FROM ""Asset_Depreciation""
              WHERE ""Depreciation_RunType"" = 'Batch'");
        var lastDate = row?.lastDate;
        string? dateStr = null;
        if (lastDate != null)
            dateStr = ((DateTime)lastDate).ToString("yyyy-MM-dd");
        return Ok(new { lastDepreciationDate = dateStr });
    }

    [HttpGet("instance/{id:int}")]
    public async Task<IActionResult> GetInstance(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var instance = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT wi.*, wd.""name"" as workflow_name, wd.""steps""
            FROM ""Asset_WorkflowInstances"" wi
            JOIN ""Asset_WorkflowDefinitions"" wd ON wi.""definition_id"" = wd.""id""
            WHERE wi.""id"" = @id", new { id });
        if (instance is null) return NotFound(new { error = "Workflow not found" });

        var approvals = await conn.QueryAsync<dynamic>(@"
            SELECT * FROM ""Asset_WorkflowApprovals"" WHERE ""instance_id"" = @id ORDER BY ""step_number""", new { id });

        var dict = (IDictionary<string, object>)instance;
        dict["approvals"] = approvals.ToList();
        return Ok(dict);
    }

    [HttpGet("transactions/{assetId:int}")]
    public async Task<IActionResult> GetAssetTransactions(int assetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var registerTxns = await conn.QueryAsync<dynamic>(@"
            SELECT
                t.""ID""                     AS id,
                t.""AssetRegisterItem_ID""   AS asset_register_item_id,
                t.""TransactionDate""        AS transaction_date,
                t.""FinancialYear""          AS financial_year,
                t.""FinancialPeriod""        AS financial_period,
                t.""PurchaseAmount""         AS purchase_amount,
                t.""ResidualValue""          AS residual_value,
                t.""CurrentValue""           AS current_value,
                t.""UsefulLife""             AS useful_life,
                t.""RemaingUsefulLife""      AS remaining_useful_life,
                t.""DepreciationValue""      AS depreciation_value,
                t.""ImpairmentValue""        AS impairment_value,
                t.""ImpairmentReversalValue"" AS impairment_reversal_value,
                t.""RevaluationValue""       AS revaluation_value,
                t.""FairValue""              AS fair_value,
                t.""TransferFromValue""      AS transfer_from_value,
                t.""TransferToValue""        AS transfer_to_value,
                tt.""Name""                  AS transaction_type_name,
                CASE mt.""TransactionTypeID""
                    WHEN 1 THEN 'depreciation'
                    WHEN 2 THEN 'impairment'
                    WHEN 3 THEN 'impairment_reversal'
                    WHEN 4 THEN 'fair_value'
                    WHEN 5 THEN 'revaluation'
                    WHEN 6 THEN 'disposal'
                    WHEN 7 THEN 'unbundling'
                    WHEN 8 THEN 'prior_year_adjustment'
                    WHEN 9 THEN 'refurbishment'
                    ELSE 'other'
                END                          AS transaction_type
            FROM ""Asset_Register_Transactions"" t
            LEFT JOIN ""AssetConfig_mSCOA_TransactionType"" mt
                ON t.""TransactionTypeID"" = mt.""AssetConfig_mSCOA_TransactionType_ID""
            LEFT JOIN ""AssetConfig_TransactionType"" tt
                ON mt.""TransactionTypeID"" = tt.""AssetConfig_TransactionType_ID""
            WHERE t.""AssetRegisterItem_ID"" = @assetId
            ORDER BY t.""TransactionDate"" DESC, t.""ID"" DESC",
            new { assetId });

        var transferTxns = await conn.QueryAsync<dynamic>(@"
            SELECT
                tr.""AssetTransfer_ID""  AS id,
                tr.""AssetItemID""       AS asset_register_item_id,
                tr.""TransferDate""      AS transaction_date,
                NULL                     AS financial_year,
                NULL                     AS financial_period,
                NULL                     AS purchase_amount,
                NULL                     AS residual_value,
                NULL                     AS current_value,
                NULL                     AS useful_life,
                NULL                     AS remaining_useful_life,
                NULL                     AS depreciation_value,
                NULL                     AS impairment_value,
                NULL                     AS impairment_reversal_value,
                NULL                     AS revaluation_value,
                NULL                     AS fair_value,
                tr.""TransferValue""     AS transfer_from_value,
                tr.""TransferValue""     AS transfer_to_value,
                'Transfer'               AS transaction_type_name,
                'transfer'               AS transaction_type
            FROM ""Asset_Transfer_Transactions"" tr
            WHERE tr.""AssetItemID"" = @assetId
            ORDER BY tr.""TransferDate"" DESC",
            new { assetId });

        var combined = registerTxns.ToList();
        combined.AddRange(transferTxns);
        return Ok(combined);
    }

    [HttpPost("action/{id:int}")]
    public async Task<IActionResult> PerformAction(int id, [FromBody] WorkflowActionRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var instance = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT wi.*, wd.""steps"" FROM ""Asset_WorkflowInstances"" wi
            JOIN ""Asset_WorkflowDefinitions"" wd ON wi.""definition_id"" = wd.""id""
            WHERE wi.""id"" = @id", new { id });
        if (instance is null) return NotFound(new { error = "Workflow not found" });

        int currentStep = (int)instance.current_step;
        var stepsJson = instance.steps?.ToString() ?? "[]";
        var steps = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement[]>(stepsJson) ?? Array.Empty<System.Text.Json.JsonElement>();

        await conn.ExecuteAsync(@"
            INSERT INTO ""Asset_WorkflowApprovals"" (""instance_id"", ""step_number"", ""approver_id"", ""action"", ""comments"")
            VALUES (@id, @currentStep, 1, @Action, @Comments)",
            new { id, currentStep, request.Action, request.Comments });

        if (request.Action == "approve")
        {
            if (currentStep >= steps.Length)
            {
                await conn.ExecuteAsync(@"
                    UPDATE ""Asset_WorkflowInstances"" SET ""status"" = 'approved', ""completed_at"" = GETDATE(), ""current_step"" = @currentStep
                    WHERE ""id"" = @id", new { id, currentStep });

                string entityType = ((string)(instance.entity_type ?? "")).ToLower();
                string mssqlRefId = (string)(instance.mssql_reference_id ?? "");
                if (int.TryParse(mssqlRefId, out int refId) && refId > 0)
                {
                    var approvalResult = await PostApproveTransaction(entityType, refId);
                    if (approvalResult != null)
                    {
                        int restoreStep = Math.Max(currentStep - 1, 1);
                        await conn.ExecuteAsync(@"
                            UPDATE ""Asset_WorkflowInstances"" SET ""status"" = 'in_progress', ""current_step"" = @restoreStep, ""completed_at"" = NULL
                            WHERE ""id"" = @id", new { id, restoreStep });
                        return BadRequest(approvalResult);
                    }
                }
            }
            else
            {
                await conn.ExecuteAsync(@"
                    UPDATE ""Asset_WorkflowInstances"" SET ""current_step"" = @nextStep, ""status"" = 'in_progress'
                    WHERE ""id"" = @id", new { id, nextStep = currentStep + 1 });
            }
        }
        else if (request.Action == "reject")
        {
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_WorkflowInstances"" SET ""status"" = 'rejected', ""completed_at"" = GETDATE() WHERE ""id"" = @id", new { id });
        }
        else if (request.Action == "return")
        {
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_WorkflowInstances"" SET ""status"" = 'returned', ""current_step"" = 1 WHERE ""id"" = @id", new { id });
        }

        var updated = await conn.QueryFirstAsync<dynamic>(@"SELECT * FROM ""Asset_WorkflowInstances"" WHERE ""id"" = @id", new { id });
        return Ok(updated);
    }

    private async Task<object?> PostApproveTransaction(string entityType, int referenceId)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DbConnectionFactory>();
        var txnService = scope.ServiceProvider.GetRequiredService<TransactionService>();
        var lookupService = scope.ServiceProvider.GetRequiredService<LookupService>();

        await using var conn = db.CreateConnection();
        await conn.OpenAsync();

        if (entityType == "impairment")
        {
            var ctrl = new AssetImpairmentController(db, txnService, lookupService);
            ctrl.ControllerContext = new ControllerContext();
            var result = await ctrl.Approve(referenceId, new ImpairmentApprovalRequest { ApprovedBy = 1 });
            if (result is ObjectResult obj && obj.StatusCode >= 400)
            {
                Console.WriteLine($"PostApproveTransaction impairment/{referenceId} failed: {obj.StatusCode}");
                return obj.Value;
            }
        }
        else if (entityType == "disposal")
        {
            var ctrl = new DisposalController(db, txnService, lookupService);
            ctrl.ControllerContext = new ControllerContext();
            var result = await ctrl.Approve(referenceId, new DisposalApprovalRequest { ApprovedBy = 1 });
            if (result is ObjectResult obj && obj.StatusCode >= 400)
            {
                Console.WriteLine($"PostApproveTransaction disposal/{referenceId} failed: {obj.StatusCode}");
                return obj.Value;
            }
        }
        return null;
    }
}

public class WorkflowDefinitionRequest
{
    public string? Name { get; set; }
    public string? EntityType { get; set; }
    public object[]? Steps { get; set; }
}

public class WorkflowInitiateRequest
{
    [System.Text.Json.Serialization.JsonPropertyName("entity_type")]
    public string? EntityType { get; set; }
    [System.Text.Json.Serialization.JsonPropertyName("entity_id")]
    public string? EntityId { get; set; }
    [System.Text.Json.Serialization.JsonPropertyName("data")]
    public object? Data { get; set; }
    [System.Text.Json.Serialization.JsonPropertyName("mssql_reference_id")]
    public string? MssqlReferenceId { get; set; }
}

public class WorkflowActionRequest
{
    public string? Action { get; set; }
    public string? Comments { get; set; }
}
