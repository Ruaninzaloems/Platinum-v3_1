using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/component-types")]
public class ComponentTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public ComponentTypeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<ComponentType>(@"SELECT ""Asset_ComponentType_ID"" AS ""Asset_Component_ID"", ""Asset_Component_Description"", ""Enabled"", ""DateCaptured"", ""Capturer_ID"" AS ""CapturerID"", ""DateModified"", ""Modifier_ID"" AS ""ModifierID"", ""Default"" FROM ""Const_Asset_ComponentType"" ORDER BY ""Asset_ComponentType_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<ComponentType>(@"SELECT ""Asset_ComponentType_ID"" AS ""Asset_Component_ID"", ""Asset_Component_Description"", ""Enabled"", ""DateCaptured"", ""Capturer_ID"" AS ""CapturerID"", ""DateModified"", ""Modifier_ID"" AS ""ModifierID"", ""Default"" FROM ""Const_Asset_ComponentType"" WHERE ""Asset_ComponentType_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Component type not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ComponentType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_ComponentType"" WHERE ""Asset_Component_Description"" ILIKE @Asset_Component_Description", new { model.Asset_Component_Description }) > 0;
        if (dup) return Conflict(new { error = $"Component type '{model.Asset_Component_Description}' already exists" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_ComponentType"" (""Asset_Component_Description"", ""Enabled"", ""DateCaptured"", ""Capturer_ID"", ""Default"")
            VALUES (@Asset_Component_Description, @Enabled, GETDATE(), @CapturerID, @Default)
            RETURNING ""Asset_ComponentType_ID""", model);
        model.Asset_Component_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ComponentType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_ComponentType"" WHERE ""Asset_Component_Description"" ILIKE @Asset_Component_Description AND ""Asset_ComponentType_ID"" <> @id", new { model.Asset_Component_Description, id }) > 0;
        if (dup) return Conflict(new { error = $"Component type '{model.Asset_Component_Description}' already exists" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_ComponentType""
            SET ""Asset_Component_Description"" = @Asset_Component_Description, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE(), ""Default"" = @Default
            WHERE ""Asset_ComponentType_ID"" = @id", new { model.Asset_Component_Description, model.Enabled, model.Default, id });
        return rows == 0 ? NotFound(new { error = "Component type not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_ComponentType"" WHERE ""Asset_ComponentType_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Component type not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT ""Asset_ComponentType_ID"" AS ""ctid"", ""Asset_Component_Description"" AS ""ctdesc"", ""Enabled"" AS ""enabled""
            FROM ""Const_Asset_ComponentType"" ORDER BY ""Asset_ComponentType_ID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Component Types");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Component Type";
        ws.Cell(1, 3).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.ctid;
            ws.Cell(r, 2).Value = (string?)row.ctdesc ?? "";
            ws.Cell(r, 3).Value = (int)row.enabled == 1 ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "ComponentTypes_Export.xlsx");
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Component Types");
        ws.Cell(1, 1).Value = "Component Type";
        ws.Cell(2, 1).Value = "Building";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "ComponentTypes_Template.xlsx");
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
            var val = ws.Cell(r, 1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Component Type", Value = val, Message = "Required field 'Component Type' is empty" });
                continue;
            }
            if (!seen.Add(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Component Type", Value = val, Message = $"Duplicate: 'Component Type' value '{val}' in file" });
                continue;
            }
            rows.Add(val);
            rowNums[val] = r;
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dbErrors = new List<ImportError>();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var val in rows)
        {
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_ComponentType"" WHERE ""Asset_Component_Description"" ILIKE @val", new { val }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(val, out var rn) ? rn : 0, Column = "Component Type", Value = val, Message = $"Duplicate: '{val}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_ComponentType"" (""Asset_Component_Description"", ""Enabled"", ""DateCaptured"", ""Capturer_ID"", ""Default"")
                VALUES (@val, 1, GETDATE(), 1, 1)", new { val }, txn);
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
