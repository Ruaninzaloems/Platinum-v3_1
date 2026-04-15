using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/months")]
public class MonthController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public MonthController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<Month>(@"SELECT ""Month_ID"", ""Month"" AS ""MonthDesc"", ""Enabled"" FROM ""Const_Month_sys"" ORDER BY ""Month_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<Month>(@"SELECT ""Month_ID"", ""Month"" AS ""MonthDesc"", ""Enabled"" FROM ""Const_Month_sys"" WHERE ""Month_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Month not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Month model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Month_sys"" (""Month"", ""Enabled"")
            VALUES (@MonthDesc, @Enabled)
            RETURNING ""Month_ID""", model);
        model.Month_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Month model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Month_sys""
            SET ""Month"" = @MonthDesc, ""Enabled"" = @Enabled
            WHERE ""Month_ID"" = @id", new { model.MonthDesc, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "Month not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Month_sys"" WHERE ""Month_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Month not found" }) : Ok(new { success = 1 });
    }
}
