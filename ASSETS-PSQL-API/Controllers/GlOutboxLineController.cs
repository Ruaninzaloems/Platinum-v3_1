using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/gl-outbox-lines")]
public class GlOutboxLineController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public GlOutboxLineController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? outboxId = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        IEnumerable<dynamic> items;
        if (outboxId.HasValue)
        {
            items = await conn.QueryAsync<dynamic>(@"
                SELECT * FROM ""GL_Outbox_Lines""
                WHERE ""OutboxId"" = @outboxId
                ORDER BY ""LineId""", new { outboxId = outboxId.Value });
        }
        else
        {
            items = await conn.QueryAsync<dynamic>(@"
                SELECT * FROM ""GL_Outbox_Lines"" ORDER BY ""LineId""");
        }
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT * FROM ""GL_Outbox_Lines"" WHERE ""LineId"" = @id", new { id });
        return item is null ? NotFound() : Ok(item);
    }
}
