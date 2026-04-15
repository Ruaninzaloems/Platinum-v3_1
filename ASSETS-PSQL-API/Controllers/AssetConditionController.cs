using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-conditions")]
public class AssetConditionController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetConditionController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<AssetCondition>(@"SELECT ""Asset_Condition_ID"" AS ""AssetCondition_ID"", ""Description"" AS ""AssetConditionDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"" FROM ""Const_Asset_Condition"" ORDER BY ""Asset_Condition_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetCondition>(@"SELECT ""Asset_Condition_ID"" AS ""AssetCondition_ID"", ""Description"" AS ""AssetConditionDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"" FROM ""Const_Asset_Condition"" WHERE ""Asset_Condition_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Asset condition not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetCondition model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_Condition"" (""Description"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
            VALUES (@AssetConditionDesc, @Enabled, GETDATE(), @CapturerID)
            RETURNING ""Asset_Condition_ID""", model);
        model.AssetCondition_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetCondition model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_Condition""
            SET ""Description"" = @AssetConditionDesc, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE()
            WHERE ""Asset_Condition_ID"" = @id", new { model.AssetConditionDesc, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "Asset condition not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_Condition"" WHERE ""Asset_Condition_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Asset condition not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Asset Conditions");
        ws.Cell(1, 1).Value = "Condition";
        ws.Cell(2, 1).Value = "Good";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetConditions_Template.xlsx");
    }

    [HttpPost("import")]
    public async Task<IActionResult> Import(IFormFile file)
    {
        var validation = ImportHelper.ValidateFile(file);
        if (validation != null) return BadRequest(validation);

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream);
        stream.Position = 0;
        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheets.First();
        var errors = new List<ImportError>();
        var rows = new List<string>();

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var desc = ws.Cell(r, 1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(desc))
            {
                errors.Add(new ImportError { Row = r, Column = "Condition", Value = desc, Message = "Required field 'Condition' is empty" });
                continue;
            }
            rows.Add(desc);
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var desc in rows)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_Condition"" (""Description"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
                VALUES (@desc, 1, GETDATE(), 1)", new { desc }, txn);
        }

        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rows.Count });
    }
}
