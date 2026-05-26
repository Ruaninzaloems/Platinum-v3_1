using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using ClosedXML.Excel;

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
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetProjectStatus"" WHERE ""StatusDesc"" ILIKE @StatusDesc", new { model.StatusDesc }) > 0;
        if (dup) return Conflict(new { error = $"Asset project status '{model.StatusDesc}' already exists" });
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
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetProjectStatus"" WHERE ""StatusDesc"" ILIKE @StatusDesc AND ""AssetProjectStatus_ID"" <> @id", new { model.StatusDesc, id }) > 0;
        if (dup) return Conflict(new { error = $"Asset project status '{model.StatusDesc}' already exists" });
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

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"SELECT ""AssetProjectStatus_ID"", ""StatusDesc"" FROM ""Const_AssetProjectStatus"" ORDER BY ""StatusDesc""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Asset Project Statuses");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Status Description";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.AssetProjectStatus_ID;
            ws.Cell(r, 2).Value = (string?)row.StatusDesc ?? "";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetProjectStatuses_Export.xlsx");
    }
}

public class AssetProjectStatusModel
{
    public string StatusDesc { get; set; } = "";
}
