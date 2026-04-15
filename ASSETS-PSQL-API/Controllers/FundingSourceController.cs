using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-register-funding")]
public class AssetRegisterFundingController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetRegisterFundingController(DbConnectionFactory db) => _db = db;

    private static string SelectAll => @"
        SELECT
            f.""AssetFundingSource_ID""  AS ""assetFundingSourceId"",
            f.""AssetRegisterItem_ID""   AS ""assetRegisterItemId"",
            f.""FundingSource_ID""       AS ""fundingSourceId"",
            f.""FinYear""               AS ""finYear"",
            f.""Amount""               AS ""amount"",
            f.""DateCaptured""          AS ""dateCaptured"",
            f.""DateModified""          AS ""dateModified""
        FROM ""Asset_FundingSource"" f";

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? assetRegisterItemId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = SelectAll + " WHERE 1=1";
        var parameters = new DynamicParameters();
        if (assetRegisterItemId.HasValue)
        {
            sql += @" AND f.""AssetRegisterItem_ID"" = @assetRegisterItemId";
            parameters.Add("assetRegisterItemId", assetRegisterItemId.Value);
        }
        sql += @" ORDER BY f.""AssetFundingSource_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE f.""AssetFundingSource_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Asset funding not found" }) : Ok(item);
    }

    [HttpGet("by-asset/{assetRegisterItemId:int}")]
    public async Task<IActionResult> GetByAssetId(int assetRegisterItemId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            SelectAll + @" WHERE f.""AssetRegisterItem_ID"" = @assetRegisterItemId ORDER BY f.""AssetFundingSource_ID""",
            new { assetRegisterItemId });
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        T? Get<T>(string key) { if (!model.TryGetValue(key, out var v) || v is null) return default; var s = v.ToString(); if (string.IsNullOrWhiteSpace(s)) return default; try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); } catch { return default; } }
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_FundingSource"" (""AssetRegisterItem_ID"", ""FundingSource_ID"", ""FinYear"", ""Amount"", ""DateCaptured"", ""CapturerID"")
            VALUES (@assetRegisterItemId, @fundingSourceId, @finYear, @amount, NOW(), 1)
            RETURNING ""AssetFundingSource_ID""",
            new
            {
                assetRegisterItemId = Get<int?>("assetRegisterItemId"),
                fundingSourceId = Get<int?>("fundingSourceId"),
                finYear = Get<string?>("finYear"),
                amount = Get<decimal?>("amount")
            });
        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE f.""AssetFundingSource_ID"" = @id", new { id });
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        T? Get<T>(string key) { if (!model.TryGetValue(key, out var v) || v is null) return default; var s = v.ToString(); if (string.IsNullOrWhiteSpace(s)) return default; try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); } catch { return default; } }
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_FundingSource"" SET
                ""FundingSource_ID"" = @fundingSourceId,
                ""FinYear""          = @finYear,
                ""Amount""           = @amount,
                ""DateModified""     = NOW()
            WHERE ""AssetFundingSource_ID"" = @id",
            new
            {
                fundingSourceId = Get<int?>("fundingSourceId"),
                finYear = Get<string?>("finYear"),
                amount = Get<decimal?>("amount"),
                id
            });
        if (rows == 0) return NotFound(new { error = "Asset funding not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE f.""AssetFundingSource_ID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"DELETE FROM ""Asset_FundingSource"" WHERE ""AssetFundingSource_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Asset funding not found" }) : Ok(new { success = 1 });
    }
}
