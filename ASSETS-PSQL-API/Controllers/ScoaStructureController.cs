using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/scoa-structure")]
public class ScoaStructureController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public ScoaStructureController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? tableId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""Const_SCOA_Structure"" WHERE 1=1";
        var p = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(tableId) && int.TryParse(tableId, out var tableIdInt))
        {
            sql += @" AND ""TableID"" = @tableIdInt";
            p.Add("tableIdInt", tableIdInt);
        }
        sql += @" ORDER BY ""ScoaCode""";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(@"SELECT * FROM ""Const_SCOA_Structure"" WHERE ""ScoaID"" = @id", new { id });
        return item is null ? NotFound() : Ok(item);
    }
}
