using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;

    public SettingsController(DbConnectionFactory db, TransactionService txnService)
    {
        _db = db;
        _txnService = txnService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var settings = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT
                os.*,
                COALESCE(
                    (SELECT ""KeyValue"" FROM ""AAAA_ConfigSettings"" WHERE ""KeyName"" = 'MuniName' LIMIT 1),
                    os.""municipality_name""
                ) AS ""municipality_name"",
                COALESCE(
                    (SELECT ""KeyValue"" FROM ""AAAA_ConfigSettings"" WHERE ""KeyName"" = 'ActiveFinYear' LIMIT 1),
                    os.""financial_year""
                ) AS ""financial_year"",
                COALESCE(
                    (SELECT CASE WHEN ""KeyValue"" ~ '^[0-9]+$' THEN ""KeyValue""::INTEGER END
                     FROM ""AAAA_ConfigSettings"" WHERE ""KeyName"" = 'ProcessingMonth' LIMIT 1),
                    os.""current_period_month""
                ) AS ""current_period_month""
            FROM ""Asset_OrganisationSettings"" os
            LIMIT 1");
        return Ok(settings ?? new { });
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] SettingsUpdateRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        if (!string.IsNullOrEmpty(request.MeasurementModel))
        {
            var currentModel = await conn.ExecuteScalarAsync<string>(
                @"SELECT ""measurement_model"" FROM ""Asset_OrganisationSettings"" LIMIT 1");
            var newModel = request.MeasurementModel;
            if (!string.Equals(currentModel, newModel, StringComparison.OrdinalIgnoreCase))
            {
                if (string.Equals(newModel, "Cost", StringComparison.OrdinalIgnoreCase))
                {
                    var conflictCount = await conn.ExecuteScalarAsync<int>(@"
                        SELECT COUNT(*) FROM ""Asset_Register_Items""
                        WHERE ""MeasurementType_ID"" IS NOT NULL
                          AND ""MeasurementType_ID"" IN (
                              SELECT ""AssetConfig_MeasurementType_ID""
                              FROM ""AssetConfig_MeasurementType""
                              WHERE ""Name"" ILIKE '%Revaluation%')");
                    if (conflictCount > 0)
                        return BadRequest(new { error = $"Cannot switch to Cost Model — {conflictCount} asset(s) are currently valued using Revaluation Model measurement types." });
                }
                else if (string.Equals(newModel, "Revaluation", StringComparison.OrdinalIgnoreCase))
                {
                    var conflictCount = await conn.ExecuteScalarAsync<int>(@"
                        SELECT COUNT(*) FROM ""Asset_Register_Items""
                        WHERE ""MeasurementType_ID"" IS NOT NULL
                          AND ""MeasurementType_ID"" IN (
                              SELECT ""AssetConfig_MeasurementType_ID""
                              FROM ""AssetConfig_MeasurementType""
                              WHERE ""Name"" ILIKE '%Cost%')");
                    if (conflictCount > 0)
                        return BadRequest(new { error = $"Cannot switch to Revaluation Model — {conflictCount} asset(s) are currently valued using Cost Model measurement types." });
                }
            }
        }

        var result = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            UPDATE ""Asset_OrganisationSettings""
            SET ""municipality_name"" = COALESCE(@MunicipalityName, ""municipality_name""),
                ""financial_year"" = COALESCE(@FinancialYear, ""financial_year""),
                ""financial_year_start_month"" = COALESCE(@FinancialYearStartMonth, ""financial_year_start_month""),
                ""current_period"" = COALESCE(@CurrentPeriod, ""current_period""),
                ""mscoa_enabled"" = COALESCE(@MscoaEnabled, ""mscoa_enabled""),
                ""measurement_model"" = COALESCE(@MeasurementModel, ""measurement_model""),
                ""current_period_month"" = COALESCE(@CurrentPeriodMonth, ""current_period_month""),
                ""approval_method"" = COALESCE(@ApprovalMethod, ""approval_method""),
                ""gl_use_inbox"" = COALESCE(@GlUseInbox, ""gl_use_inbox""),
                ""gl_led_target"" = COALESCE(@GlLedTarget, ""gl_led_target""),
                ""mscoa_use_dept_division"" = COALESCE(@MscoaUseDeptDivision, ""mscoa_use_dept_division""),
                ""updated_at"" = NOW()
            WHERE ""id"" = (SELECT ""id"" FROM ""Asset_OrganisationSettings"" LIMIT 1) RETURNING *", request);
        return Ok(result ?? new { });
    }
    [HttpGet("measurement-model-conflicts")]
    public async Task<IActionResult> GetMeasurementModelConflicts([FromQuery] string targetModel)
    {
        if (string.IsNullOrEmpty(targetModel))
            return BadRequest(new { error = "targetModel is required" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        string conflictFilter;
        string compatibleFilter;
        if (string.Equals(targetModel, "Cost", StringComparison.OrdinalIgnoreCase))
        {
            conflictFilter = @"mt.""Name"" ILIKE '%Revaluation%'";
            compatibleFilter = @"""Name"" NOT ILIKE '%Revaluation%'";
        }
        else if (string.Equals(targetModel, "Revaluation", StringComparison.OrdinalIgnoreCase))
        {
            conflictFilter = @"mt.""Name"" ILIKE '%Cost%'";
            compatibleFilter = @"""Name"" ILIKE '%Revaluation%'";
        }
        else
        {
            return BadRequest(new { error = "targetModel must be Cost or Revaluation" });
        }

        var conflicts = await conn.QueryAsync<dynamic>($@"
            SELECT
                a.""AssetRegisterItem_ID"" AS ""assetId"",
                a.""AssetDescription""     AS ""assetDescription"",
                a.""AssetNumber""          AS ""assetNumber"",
                a.""MeasurementType_ID""   AS ""currentMeasurementTypeId"",
                mt.""Name""               AS ""currentMeasurementTypeName""
            FROM ""Asset_Register_Items"" a
            INNER JOIN ""AssetConfig_MeasurementType"" mt
                ON mt.""AssetConfig_MeasurementType_ID"" = a.""MeasurementType_ID""
            WHERE a.""MeasurementType_ID"" IS NOT NULL
              AND {conflictFilter}
            ORDER BY a.""AssetDescription""");

        var compatibleTypes = await conn.QueryAsync<dynamic>($@"
            SELECT ""AssetConfig_MeasurementType_ID"" AS ""measurementTypeId"",
                   ""Name""                           AS ""measurementTypeDesc""
            FROM ""AssetConfig_MeasurementType""
            WHERE {compatibleFilter}
              AND COALESCE(""Enabled"", 1) = 1
            ORDER BY ""Name""");

        var conflictList = conflicts.AsList();
        return Ok(new
        {
            targetModel,
            conflictCount = conflictList.Count,
            conflicts = conflictList,
            compatibleTypes
        });
    }

    [HttpPost("bulk-reassign-measurement-type")]
    public async Task<IActionResult> BulkReassignMeasurementType([FromBody] BulkReassignRequest request)
    {
        if (request.ReplacementMeasurementTypeId <= 0)
            return BadRequest(new { error = "replacementMeasurementTypeId is required" });
        if (string.IsNullOrEmpty(request.TargetModel))
            return BadRequest(new { error = "targetModel is required" });

        string conflictFilter;
        string replacementCompatFilter;
        if (string.Equals(request.TargetModel, "Cost", StringComparison.OrdinalIgnoreCase))
        {
            conflictFilter = @"mt.""Name"" ILIKE '%Revaluation%'";
            replacementCompatFilter = "Revaluation";
        }
        else if (string.Equals(request.TargetModel, "Revaluation", StringComparison.OrdinalIgnoreCase))
        {
            conflictFilter = @"mt.""Name"" ILIKE '%Cost%'";
            replacementCompatFilter = "Cost";
        }
        else
        {
            return BadRequest(new { error = "targetModel must be Cost or Revaluation" });
        }

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var replacementType = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""AssetConfig_MeasurementType_ID"", ""Name"",
                   CAST(COALESCE(""Enabled"", 1) AS INTEGER) AS ""Enabled""
            FROM ""AssetConfig_MeasurementType""
            WHERE ""AssetConfig_MeasurementType_ID"" = @id",
            new { id = request.ReplacementMeasurementTypeId });

        if (replacementType == null)
            return BadRequest(new { error = "Replacement measurement type not found" });
        string replacementName = (string)(replacementType.Name ?? "");
        if (replacementName.Contains(replacementCompatFilter, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = $"Replacement measurement type is not compatible with the {request.TargetModel} Model." });
        if (Convert.ToInt32(replacementType.Enabled) == 0)
            return BadRequest(new { error = "Replacement measurement type is disabled." });

        await using var txn = await conn.BeginTransactionAsync();
        try
        {
            var updated = await conn.ExecuteAsync($@"
                UPDATE ""Asset_Register_Items""
                SET ""MeasurementType_ID"" = @replacementId
                WHERE ""MeasurementType_ID"" IS NOT NULL
                  AND ""MeasurementType_ID"" IN (
                      SELECT mt.""AssetConfig_MeasurementType_ID""
                      FROM ""AssetConfig_MeasurementType"" mt
                      WHERE {conflictFilter})",
                new { replacementId = request.ReplacementMeasurementTypeId }, txn);

            var remainingConflicts = await conn.ExecuteScalarAsync<int>($@"
                SELECT COUNT(*) FROM ""Asset_Register_Items""
                WHERE ""MeasurementType_ID"" IS NOT NULL
                  AND ""MeasurementType_ID"" IN (
                      SELECT mt.""AssetConfig_MeasurementType_ID""
                      FROM ""AssetConfig_MeasurementType"" mt
                      WHERE {conflictFilter})", transaction: txn);

            if (remainingConflicts > 0)
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = $"Bulk reassignment did not resolve all conflicts — {remainingConflicts} asset(s) still conflict with the {request.TargetModel} Model." });
            }

            var settings = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                UPDATE ""Asset_OrganisationSettings""
                SET ""measurement_model"" = @model, ""updated_at"" = NOW()
                WHERE ""id"" = (SELECT ""id"" FROM ""Asset_OrganisationSettings"" LIMIT 1)
                RETURNING *", new { model = request.TargetModel }, txn);

            await txn.CommitAsync();
            return Ok(new { updated, modelSwitched = true, settings });
        }
        catch
        {
            await txn.RollbackAsync();
            throw;
        }
    }

    [HttpGet("next-run-cutoff")]
    public async Task<IActionResult> GetNextRunCutoff()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var (cutoffDate, nextPeriod, nextFy) = await _txnService.GetNextRunCutoffDateAsync(conn);
        return Ok(new
        {
            cutoffDate = cutoffDate.ToString("yyyy-MM-dd"),
            nextPeriod,
            financialYear = nextFy
        });
    }

    [HttpPost("backfill-transaction-summary")]
    public async Task<IActionResult> BackfillTransactionSummary([FromQuery] string? finYear = null)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var assetIds = await conn.QueryAsync<int>(@"
            SELECT DISTINCT i.""AssetRegisterItem_ID""
            FROM ""Asset_Register_Items"" i
            WHERE i.""DateOfTakeOnBalancesImported"" IS NOT NULL OR i.""ManagedFlag"" = 1");

        var idList = assetIds.AsList();
        int processed = 0;

        await using var txn = await conn.BeginTransactionAsync();
        foreach (var assetId in idList)
        {
            await _txnService.PopulateTransactionSummarySingle(conn, txn, assetId, finYear, 1);
            processed++;
        }
        await txn.CommitAsync();

        return Ok(new { success = 1, processed, finYear });
    }
}

public class SettingsUpdateRequest
{
    public string? MunicipalityName { get; set; }
    public string? FinancialYear { get; set; }
    public int? FinancialYearStartMonth { get; set; }
    public int? CurrentPeriod { get; set; }
    public bool? MscoaEnabled { get; set; }
    public string? MeasurementModel { get; set; }
    public int? CurrentPeriodMonth { get; set; }
    public string? ApprovalMethod { get; set; }
    public bool? GlUseInbox { get; set; }
    public string? GlLedTarget { get; set; }
    public bool? MscoaUseDeptDivision { get; set; }
}

public class BulkReassignRequest
{
    public string? TargetModel { get; set; }
    public int ReplacementMeasurementTypeId { get; set; }
}
