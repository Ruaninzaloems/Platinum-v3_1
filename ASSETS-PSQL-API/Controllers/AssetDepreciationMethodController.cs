using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-depreciation-methods")]
public class AssetDepreciationMethodController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetDepreciationMethodController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync(@"SELECT ""AssetDepreciationMethod_ID"" AS ""assetDepreciationMethod_ID"", ""AssetDepreciationMethodDesc"" AS ""assetDepreciationMethodDesc"", ""Enabled"" AS ""enabled"", ""DateCaptured"" AS ""dateCaptured"" FROM ""Const_AssetDepreciationMethod_Sys"" ORDER BY ""AssetDepreciationMethod_ID""");
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync(@"SELECT ""AssetDepreciationMethod_ID"" AS ""assetDepreciationMethod_ID"", ""AssetDepreciationMethodDesc"" AS ""assetDepreciationMethodDesc"", ""Enabled"" AS ""enabled"", ""DateCaptured"" AS ""dateCaptured"" FROM ""Const_AssetDepreciationMethod_Sys"" WHERE ""AssetDepreciationMethod_ID"" = @Id", new { Id = id });
        if (item == null) return NotFound(new { error = "Not found" });
        return Ok(item);
    }
}
