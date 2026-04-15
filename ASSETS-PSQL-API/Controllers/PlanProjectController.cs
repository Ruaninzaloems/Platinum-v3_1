using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
public class PlanProjectController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly LookupService _lookup;

    public PlanProjectController(DbConnectionFactory db, LookupService lookup)
    {
        _db = db;
        _lookup = lookup;
    }

    [HttpGet("api/plan-projects")]
    public async Task<IActionResult> GetProjects([FromQuery] string? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"
            SELECT ""Project_ID"" AS ""projectId"",
                   ""ProjectCode"" AS ""projectCode"",
                   ""ProjectName"" AS ""projectName"",
                   ""ProjectDesc"" AS ""projectDesc"",
                   ""FinYear"" AS ""finYear"",
                   ""ScoaProjectID"" AS ""scoaProjectId""
            FROM ""Plan_Project""
            WHERE ""IsDeleted"" IS DISTINCT FROM 1";
        var parameters = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(finYear))
        {
            sql += @" AND ""FinYear"" = @finYear";
            parameters.Add("finYear", finYear);
        }
        sql += @" ORDER BY ""ProjectCode""::TEXT";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("api/plan-project-items")]
    public async Task<IActionResult> GetProjectItems([FromQuery] int? projectId, [FromQuery] string? finYear = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ppi.""PlanProjectItem_ID"" AS ""planProjectItemId"",
                           ppi.""ProjectID"" AS ""projectId"",
                           ppi.""SCOAItemID"" AS ""scoaItemId"",
                           ppi.""FinYear"" AS ""finYear"",
                           COALESCE(ppi.""BudgetAmount"", 0) AS ""budgetAmount"",
                           ppi.""SCOAFunctionId"" AS ""scoaFunctionId"",
                           ppi.""SCOARegionId"" AS ""scoaRegionId"",
                           ppi.""DivisionId"" AS ""divisionId""
                    FROM ""Plan_ProjectItem"" ppi
                    WHERE 1=1";
        var parameters = new DynamicParameters();
        if (projectId.HasValue)
        {
            sql += @" AND ppi.""ProjectID"" = @projectId";
            parameters.Add("projectId", projectId.Value);
        }
        if (!string.IsNullOrEmpty(finYear))
        {
            sql += @" AND ppi.""FinYear"" = @finYear";
            parameters.Add("finYear", finYear);
        }
        sql += @" ORDER BY ppi.""PlanProjectItem_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("api/plan-project-items/scoa")]
    public async Task<IActionResult> GetProjectItemsWithScoa([FromQuery] int? projectId, [FromQuery] string? finYear = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ppi.""PlanProjectItem_ID"" AS ""planProjectItemId"",
                           ppi.""ProjectID"" AS ""projectId"",
                           ppi.""SCOAItemID"" AS ""scoaItemId"",
                           ppi.""FinYear"" AS ""finYear"",
                           COALESCE(ppi.""BudgetAmount"", 0) AS ""budgetAmount"",
                           ppi.""SCOAFunctionId"" AS ""scoaFunctionId"",
                           ppi.""SCOARegionId"" AS ""scoaRegionId"",
                           ppi.""DivisionId"" AS ""divisionId"",
                           css.""ScoaCode"" AS ""scoaCode"",
                           css.""ScoaShortDesc"" AS ""scoaShortDesc"",
                           CONCAT(ppi.""PlanProjectItem_ID"", ' | ', css.""ScoaCode"", ' | ', css.""ScoaShortDesc"") AS ""scoaDesc""
                    FROM ""Plan_ProjectItem"" ppi
                    LEFT JOIN ""Const_SCOA_Structure"" css ON ppi.""SCOAItemID"" = css.""ScoaID""
                    WHERE 1=1";
        var parameters = new DynamicParameters();
        if (projectId.HasValue)
        {
            sql += @" AND ppi.""ProjectID"" = @projectId";
            parameters.Add("projectId", projectId.Value);
        }
        if (!string.IsNullOrEmpty(finYear))
        {
            sql += @" AND ppi.""FinYear"" = @finYear";
            parameters.Add("finYear", finYear);
        }
        sql += @" ORDER BY css.""ScoaCode"", ppi.""PlanProjectItem_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("api/plan-project-financial-years")]
    public async Task<IActionResult> GetFinancialYears()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var years = await _lookup.GetPlanProjectFinancialYearsAsync(conn);
        return Ok(years);
    }

    [HttpGet("api/plan-project-items/{id:int}/vote-data")]
    public async Task<IActionResult> GetVoteData(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var row = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ppi.""PlanProjectItem_ID"" AS ""PlanProjectItem_ID"",
                   ppi.""SCOAItemID""          AS ""SCOAItemID"",
                   ppi.""ProjectID""           AS ""ProjectID"",
                   ppi.""SCOAFundId""          AS ""SCOAFundId"",
                   ppi.""SCOARegionId""        AS ""SCOARegionId"",
                   ppi.""SCOACostingID""       AS ""SCOACostingID"",
                   ppi.""SCOAFunctionId""      AS ""SCOAFunctionId"",
                   ppi.""DivisionId""          AS ""DivisionId"",
                   ppi.""FinYear""             AS ""PpiFinYear"",
                   p.""ScoaProjectID""         AS ""ScoaProjectID""
            FROM ""Plan_ProjectItem"" ppi
            LEFT JOIN ""Plan_Project"" p ON p.""Project_ID"" = ppi.""ProjectID""
            WHERE ppi.""PlanProjectItem_ID"" = @id
            LIMIT 1",
            new { id });
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost("api/plan-project-items/vote-data-batch")]
    public async Task<IActionResult> GetVoteDataBatch([FromBody] int[] ids)
    {
        if (ids == null || ids.Length == 0) return Ok(Array.Empty<object>());
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT ppi.""PlanProjectItem_ID"" AS ""PlanProjectItem_ID"",
                   ppi.""SCOAItemID""          AS ""SCOAItemID"",
                   ppi.""ProjectID""           AS ""ProjectID"",
                   ppi.""SCOAFundId""          AS ""SCOAFundId"",
                   ppi.""SCOARegionId""        AS ""SCOARegionId"",
                   ppi.""SCOACostingID""       AS ""SCOACostingID"",
                   ppi.""SCOAFunctionId""      AS ""SCOAFunctionId"",
                   ppi.""DivisionId""          AS ""DivisionId"",
                   ppi.""FinYear""             AS ""PpiFinYear"",
                   p.""ScoaProjectID""         AS ""ScoaProjectID"",
                   p.""Project_ID""            AS ""PlanProjectId""
            FROM ""Plan_ProjectItem"" ppi
            LEFT JOIN ""Plan_Project"" p ON p.""Project_ID"" = ppi.""ProjectID""
            WHERE ppi.""PlanProjectItem_ID"" = ANY(@ids)",
            new { ids });
        return Ok(rows);
    }
}
