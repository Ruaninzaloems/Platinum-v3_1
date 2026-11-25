using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

public class ClearingAccountDto
{
    public int PlanProjectItem_ID { get; set; }
}

[ApiController]
[Route("api/clearing-accounts")]
public class ClearingAccountsController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public ClearingAccountsController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        try { await conn.ExecuteScalarAsync<int>(@"SELECT 1 FROM ""Asset_ClearingAccounts"" LIMIT 0"); }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "42P01") { return Ok(Array.Empty<object>()); }
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT ca.""Asset_ClearingAccounts_ID"" AS ""id"",
                   ca.""PlanProjectItem_ID""         AS ""planProjectItemId"",
                   ca.""DateCaptured""               AS ""dateCaptured"",
                   ppi.""SCOAItemID""                AS ""scoaItemId"",
                   ppi.""FinYear""                   AS ""finYear"",
                   ppi.""ProjectID""                 AS ""projectId"",
                   pp.""ProjectCode""::TEXT           AS ""projectCode"",
                   pp.""ProjectName""                AS ""projectName"",
                   css.""ScoaCode""                  AS ""scoaCode"",
                   css.""ScoaShortDesc""             AS ""scoaShortDesc"",
                   CONCAT(css.""ScoaCode"", ' | ', css.""ScoaShortDesc"") AS ""scoaDesc""
            FROM ""Asset_ClearingAccounts"" ca
            LEFT JOIN ""Plan_ProjectItem"" ppi ON ppi.""PlanProjectItem_ID"" = ca.""PlanProjectItem_ID""
            LEFT JOIN ""Plan_Project"" pp ON pp.""Project_ID"" = ppi.""ProjectID""
            LEFT JOIN ""Const_SCOA_Structure"" css ON css.""ScoaID"" = ppi.""SCOAItemID""
            ORDER BY ca.""Asset_ClearingAccounts_ID""");
        return Ok(rows);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] ClearingAccountDto dto)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var newId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_ClearingAccounts"" (""PlanProjectItem_ID"", ""DateCaptured"")
            VALUES (@PlanProjectItem_ID, NOW())
            RETURNING ""Asset_ClearingAccounts_ID""",
            new { dto.PlanProjectItem_ID });
        return Ok(new { id = newId });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Asset_ClearingAccounts"" WHERE ""Asset_ClearingAccounts_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Clearing account not found" }) : Ok(new { success = 1 });
    }
}
