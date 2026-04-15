using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/user-processing-months")]
public class UserProcessingMonthController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public UserProcessingMonthController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? userId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""User_UserProcessingMonth"" WHERE 1=1";
        var p = new DynamicParameters();
        if (userId.HasValue)
        {
            sql += @" AND ""UserID"" = @userId";
            p.Add("userId", userId.Value);
        }
        sql += @" ORDER BY ""UserProcessingMonth_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrent([FromQuery] int userId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""User_UserProcessingMonth"" WHERE ""UserID"" = @userId ORDER BY ""UserProcessingMonth_ID"" DESC LIMIT 1",
            new { userId });
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""User_UserProcessingMonth"" WHERE ""UserProcessingMonth_ID"" = @id", new { id });
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("current")]
    public async Task<IActionResult> SetCurrent([FromQuery] int userId, [FromBody] Dictionary<string, object?> body)
    {
        try
        {
            body["userId"] = userId;
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            var processingMonth = body.GetValueOrDefault("processingMonth") ?? body.GetValueOrDefault("ProcessingMonth");
            var id = await conn.ExecuteScalarAsync<int>(
                @"INSERT INTO ""User_UserProcessingMonth"" (""UserID"", ""ProcessingMonth"", ""DateCaptured"")
                  VALUES (@userId, @processingMonth, NOW())
                  RETURNING ""UserProcessingMonth_ID""",
                new { userId, processingMonth });
            return Ok(new { id });
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> body)
    {
        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            var userId = body.GetValueOrDefault("userId") ?? body.GetValueOrDefault("UserID");
            var processingMonth = body.GetValueOrDefault("processingMonth") ?? body.GetValueOrDefault("ProcessingMonth");
            var id = await conn.ExecuteScalarAsync<int>(
                @"INSERT INTO ""User_UserProcessingMonth"" (""UserID"", ""ProcessingMonth"", ""DateCaptured"")
                  VALUES (@userId, @processingMonth, NOW())
                  RETURNING ""UserProcessingMonth_ID""",
                new { userId, processingMonth });
            return Ok(new { id });
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> body)
    {
        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            var processingMonth = body.GetValueOrDefault("processingMonth") ?? body.GetValueOrDefault("ProcessingMonth");
            var rows = await conn.ExecuteAsync(
                @"UPDATE ""User_UserProcessingMonth""
                  SET ""ProcessingMonth"" = @processingMonth, ""DateModified"" = NOW()
                  WHERE ""UserProcessingMonth_ID"" = @id",
                new { processingMonth, id });
            return rows == 0 ? NotFound() : Ok(new { updated = true });
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }
}
