using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/financial-years")]
public class FinancialYearController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public FinancialYearController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var rows = await conn.QueryAsync(
            @"SELECT
                f.""ID"" AS id,
                f.""FinYear"" AS finYear,
                f.""CurrentIndex"" AS currentIndex,
                f.""ActiveFinYear"" AS activeFinYear,
                CASE WHEN f.""CurrentIndex"" = 0 THEN TRUE ELSE FALSE END AS isDefault
              FROM ""Const_FinYearWithIndex_sys"" f
              WHERE f.""ActiveFinYear"" = (
                SELECT ""ActiveFinYear""
                FROM ""Const_FinYearWithIndex_sys""
                WHERE ""CurrentIndex"" = 0
                ORDER BY ""ID"" DESC
                LIMIT 1
              )
              ORDER BY f.""CurrentIndex""");

        return Ok(rows);
    }

    [HttpGet("default")]
    public async Task<IActionResult> GetDefault()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var row = await conn.QueryFirstOrDefaultAsync(
            @"SELECT ""FinYear"" AS finYear, ""ActiveFinYear"" AS activeFinYear
              FROM ""Const_FinYearWithIndex_sys""
              WHERE ""CurrentIndex"" = 0
              ORDER BY ""ID"" DESC
              LIMIT 1");

        return row is null ? NotFound(new { error = "No default financial year configured" }) : Ok(row);
    }
}
