using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/gl-outbox")]
public class GlOutboxController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public GlOutboxController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        IEnumerable<dynamic> items;
        if (!string.IsNullOrWhiteSpace(status))
        {
            items = await conn.QueryAsync<dynamic>(@"
                SELECT * FROM ""GL_Outbox""
                WHERE ""Status"" = @status
                ORDER BY ""CreatedAt"" DESC", new { status = status.ToUpperInvariant() });
        }
        else
        {
            items = await conn.QueryAsync<dynamic>(@"
                SELECT * FROM ""GL_Outbox"" ORDER BY ""CreatedAt"" DESC");
        }
        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT * FROM ""GL_Outbox"" WHERE ""OutboxId"" = @id", new { id });
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] GlOutboxStatusUpdate body)
    {
        if (string.IsNullOrWhiteSpace(body?.Status))
            return BadRequest("Status is required.");

        var status = body.Status.ToUpperInvariant();
        var validStatuses = new[] { "PENDING", "PROCESSING", "POSTED", "FAILED" };
        if (!Array.Exists(validStatuses, s => s == status))
            return BadRequest($"Invalid status. Allowed: {string.Join(", ", validStatuses)}");

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var affected = await conn.ExecuteAsync(@"
            UPDATE ""GL_Outbox""
            SET ""Status"" = @status,
                ""DispatchedAt"" = CASE WHEN @status = 'POSTED' THEN NOW() ELSE ""DispatchedAt"" END,
                ""LastError"" = CASE WHEN @status = 'FAILED' THEN @lastError ELSE ""LastError"" END,
                ""RetryCount"" = CASE WHEN @status = 'FAILED' THEN ""RetryCount"" + 1 ELSE ""RetryCount"" END
            WHERE ""OutboxId"" = @id",
            new { id, status, lastError = body.LastError });

        return affected == 0 ? NotFound() : NoContent();
    }
}

public class GlOutboxStatusUpdate
{
    public string Status { get; set; } = string.Empty;
    public string? LastError { get; set; }
}
