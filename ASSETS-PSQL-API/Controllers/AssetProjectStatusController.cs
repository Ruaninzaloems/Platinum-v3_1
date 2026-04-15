using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-project-statuses")]
public class AssetProjectStatusController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public AssetProjectStatusController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            @"SELECT ""AssetProjectStatus_ID"" AS ""assetProjectStatusId"", ""StatusDesc"" AS ""statusDesc""
              FROM ""Const_AssetProjectStatus""
              ORDER BY ""StatusDesc""");
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""AssetProjectStatus_ID"" AS ""assetProjectStatusId"", ""StatusDesc"" AS ""statusDesc""
              FROM ""Const_AssetProjectStatus""
              WHERE ""AssetProjectStatus_ID"" = @id", new { id });
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetProjectStatusModel model)
    {
        if (string.IsNullOrWhiteSpace(model.StatusDesc))
            return BadRequest(new { error = "Status description is required" });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO ""Const_AssetProjectStatus"" (""StatusDesc"")
              VALUES (@StatusDesc)
              RETURNING ""AssetProjectStatus_ID""", model);
        return Ok(new { assetProjectStatusId = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetProjectStatusModel model)
    {
        if (string.IsNullOrWhiteSpace(model.StatusDesc))
            return BadRequest(new { error = "Status description is required" });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"UPDATE ""Const_AssetProjectStatus"" SET ""StatusDesc"" = @StatusDesc
              WHERE ""AssetProjectStatus_ID"" = @id", new { model.StatusDesc, id });
        if (rows == 0) return NotFound();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"DELETE FROM ""Const_AssetProjectStatus"" WHERE ""AssetProjectStatus_ID"" = @id", new { id });
        if (rows == 0) return NotFound();
        return Ok();
    }
}

public class AssetProjectStatusModel
{
    public string StatusDesc { get; set; } = "";
}
