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
        var settings = await conn.QueryFirstOrDefaultAsync<dynamic>(@"SELECT * FROM ""Asset_OrganisationSettings"" OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY");
        return Ok(settings ?? new { });
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] SettingsUpdateRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
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
                ""updated_at"" = GETDATE()
            WHERE ""id"" = (SELECT ""id"" FROM ""Asset_OrganisationSettings"" OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY) RETURNING *", request);
        return Ok(result ?? new { });
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
}
