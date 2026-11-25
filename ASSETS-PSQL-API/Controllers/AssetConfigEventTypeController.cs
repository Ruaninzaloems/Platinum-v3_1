using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-config-event-types")]
public class AssetConfigEventTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public AssetConfigEventTypeController(DbConnectionFactory db) => _db = db;

    private const string SelectColumns = @"
        SELECT ""EventType_ID""   AS ""eventTypeId"",
               ""SourceDocType""  AS ""sourceDocType"",
               ""EventType""      AS ""eventType"",
               ""Description""    AS ""description""
        FROM ""AssetConfig_EventType""";

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(SelectColumns + @" ORDER BY ""EventType""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectColumns + @" WHERE ""EventType_ID"" = @id", new { id });
        return item is null ? NotFound() : Ok(item);
    }
}
