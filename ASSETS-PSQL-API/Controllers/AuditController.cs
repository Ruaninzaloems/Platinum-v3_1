using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/audit")]
public class AuditController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AuditController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? entity_type,
        [FromQuery] string? entity_id,
        [FromQuery] int? user_id,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""Asset_AuditTrail"" WHERE 1=1";
        var parameters = new DynamicParameters();
        if (!string.IsNullOrEmpty(entity_type)) { sql += @" AND ""entity_type"" = @entity_type"; parameters.Add("entity_type", entity_type); }
        if (!string.IsNullOrEmpty(entity_id)) { sql += @" AND ""entity_id"" = @entity_id"; parameters.Add("entity_id", entity_id); }
        if (user_id.HasValue) { sql += @" AND ""user_id"" = @user_id"; parameters.Add("user_id", user_id.Value); }
        sql += @" ORDER BY ""timestamp"" DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY";
        parameters.Add("limit", limit);
        parameters.Add("offset", offset);
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }
}
