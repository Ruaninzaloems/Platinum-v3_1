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
        var items = await conn.QueryAsync<dynamic>(@"SELECT ""Asset_Condition_ID"" AS ""assetConditionId"", ""Description"" AS ""assetConditionDesc"", CAST(""Enabled"" AS INT) AS ""enabled"", ""DateCaptured"" AS ""dateCaptured"", ""CapturerID"" AS ""capturerId"", ""DateModified"" AS ""dateModified"", ""ModifierID"" AS ""modifierId"" FROM ""Const_Asset_Condition"" ORDER BY ""Asset_Condition_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(@"SELECT ""Asset_Condition_ID"" AS ""assetConditionId"", ""Description"" AS ""assetConditionDesc"", CAST(""Enabled"" AS INT) AS ""enabled"", ""DateCaptured"" AS ""dateCaptured"", ""CapturerID"" AS ""capturerId"", ""DateModified"" AS ""dateModified"", ""ModifierID"" AS ""modifierId"" FROM ""Const_Asset_Condition"" WHERE ""Asset_Condition_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Asset condition not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetCondition model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_Condition"" WHERE ""Description"" ILIKE @AssetConditionDesc", new { model.AssetConditionDesc }) > 0;
        if (dup) return Conflict(new { error = $"Asset condition '{model.AssetConditionDesc}' already exists" });
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
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_Condition"" WHERE ""Description"" ILIKE @AssetConditionDesc AND ""Asset_Condition_ID"" <> @id", new { model.AssetConditionDesc, id }) > 0;
        if (dup) return Conflict(new { error = $"Asset condition '{model.AssetConditionDesc}' already exists" });
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

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT ""Asset_Condition_ID"" AS ""cid"", ""Description"" AS ""cdesc"", CAST(""Enabled"" AS INT) AS ""enabled""
            FROM ""Const_Asset_Condition"" ORDER BY ""Asset_Condition_ID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Asset Conditions");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Condition";
        ws.Cell(1, 3).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.cid;
            ws.Cell(r, 2).Value = (string?)row.cdesc ?? "";
            ws.Cell(r, 3).Value = (int)row.enabled == 1 ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetConditions_Export.xlsx");
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
        var rowNums = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var rows = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var desc = ws.Cell(r, 1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(desc))
            {
                errors.Add(new ImportError { Row = r, Column = "Condition", Value = desc, Message = "Required field 'Condition' is empty" });
                continue;
            }
            if (!seen.Add(desc))
            {
                errors.Add(new ImportError { Row = r, Column = "Condition", Value = desc, Message = $"Duplicate: 'Condition' value '{desc}' in file" });
                continue;
            }
            rows.Add(desc);
            rowNums[desc] = r;
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dbErrors = new List<ImportError>();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var desc in rows)
        {
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_Condition"" WHERE ""Description"" ILIKE @desc", new { desc }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(desc, out var rn) ? rn : 0, Column = "Asset Condition", Value = desc, Message = $"Duplicate: '{desc}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_Condition"" (""Description"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
                VALUES (@desc, 1, GETDATE(), 1)", new { desc }, txn);
        }

        if (dbErrors.Count > 0)
        {
            await txn.RollbackAsync();
            return BadRequest(new ImportResult { Success = false, Errors = dbErrors });
        }
        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rows.Count });
    }
}
