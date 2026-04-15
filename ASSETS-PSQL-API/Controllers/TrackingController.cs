using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/tracking-ext")]
public class TrackingController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public TrackingController(DbConnectionFactory db) => _db = db;

    [HttpGet("zones")]
    public async Task<IActionResult> GetZones()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""Asset_TrackingZones"" WHERE ""is_active"" = 1 ORDER BY ""name""");
        return Ok(items);
    }

    [HttpPost("zones")]
    public async Task<IActionResult> CreateZone([FromBody] ZoneRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstAsync<dynamic>(@"
            INSERT INTO ""Asset_TrackingZones"" (""name"", ""boundary_polygon"", ""zone_type"")
            VALUES (@Name, @BoundaryPolygon, @ZoneType) RETURNING *",
            new { request.Name, BoundaryPolygon = System.Text.Json.JsonSerializer.Serialize(request.BoundaryPolygon), request.ZoneType });
        return CreatedAtAction(null, result);
    }

    [HttpGet("alerts")]
    public async Task<IActionResult> GetAlerts([FromQuery] string? acknowledged)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""Asset_TrackingAlerts"" WHERE 1=1";
        if (acknowledged == "false") sql += @" AND ""acknowledged_at"" IS NULL";
        sql += @" ORDER BY ""created_at"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql);
        return Ok(items);
    }

    [HttpPatch("alerts/{id:int}/acknowledge")]
    public async Task<IActionResult> AcknowledgeAlert(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            UPDATE ""Asset_TrackingAlerts"" SET ""acknowledged_by"" = 1, ""acknowledged_at"" = GETDATE()
            WHERE ""id"" = @id RETURNING *", new { id });
        return result is null ? NotFound(new { error = "Alert not found" }) : Ok(result);
    }
}

public class ZoneRequest
{
    public string? Name { get; set; }
    public object? BoundaryPolygon { get; set; }
    public string? ZoneType { get; set; }
}
