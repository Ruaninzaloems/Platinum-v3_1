using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/wip-register-funding")]
public class WipRegisterFundingController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public WipRegisterFundingController(DbConnectionFactory db) => _db = db;

    private static string SelectAll => @"
        SELECT
            f.""WIPRegisterFunding_ID""  AS ""wipRegisterFundingId"",
            f.""WIPRegister_ID""         AS ""wipRegisterId"",
            f.""FundingSource_ID""       AS ""fundingSourceId"",
            f.""Amount""                AS ""amount"",
            f.""DateCaptured""          AS ""dateCaptured"",
            f.""DateModified""          AS ""dateModified""
        FROM ""Asset_WIP_Register_Funding"" f";

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? wipRegisterId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = SelectAll + " WHERE 1=1";
        var parameters = new DynamicParameters();
        if (wipRegisterId.HasValue) { sql += @" AND f.""WIPRegister_ID"" = @wipRegisterId"; parameters.Add("wipRegisterId", wipRegisterId.Value); }
        sql += @" ORDER BY f.""WIPRegisterFunding_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE f.""WIPRegisterFunding_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "WIP funding not found" }) : Ok(item);
    }

    [HttpGet("by-wip-register/{wipRegisterId:int}")]
    public async Task<IActionResult> GetByWipRegisterId(int wipRegisterId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            SelectAll + @" WHERE f.""WIPRegister_ID"" = @wipRegisterId ORDER BY f.""WIPRegisterFunding_ID""",
            new { wipRegisterId });
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        T? Get<T>(string key) { if (!model.TryGetValue(key, out var v) || v is null) return default; var s = v.ToString(); if (string.IsNullOrWhiteSpace(s)) return default; try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); } catch { return default; } }
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_WIP_Register_Funding"" (""WIPRegister_ID"", ""FundingSource_ID"", ""Amount"", ""DateCaptured"", ""CapturerID"")
            VALUES (@wipRegisterId, @fundingSourceId, @amount, NOW(), 1)
            RETURNING ""WIPRegisterFunding_ID""",
            new
            {
                wipRegisterId = Get<int?>("wipRegisterId"),
                fundingSourceId = Get<int?>("fundingSourceId"),
                amount = Get<decimal?>("amount")
            });
        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE f.""WIPRegisterFunding_ID"" = @id", new { id });
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        T? Get<T>(string key) { if (!model.TryGetValue(key, out var v) || v is null) return default; var s = v.ToString(); if (string.IsNullOrWhiteSpace(s)) return default; try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); } catch { return default; } }
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register_Funding"" SET
                ""FundingSource_ID"" = @fundingSourceId,
                ""Amount""           = @amount,
                ""DateModified""     = NOW()
            WHERE ""WIPRegisterFunding_ID"" = @id",
            new
            {
                fundingSourceId = Get<int?>("fundingSourceId"),
                amount = Get<decimal?>("amount"),
                id
            });
        if (rows == 0) return NotFound(new { error = "WIP funding not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE f.""WIPRegisterFunding_ID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"DELETE FROM ""Asset_WIP_Register_Funding"" WHERE ""WIPRegisterFunding_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "WIP funding not found" }) : Ok(new { success = 1 });
    }
}
