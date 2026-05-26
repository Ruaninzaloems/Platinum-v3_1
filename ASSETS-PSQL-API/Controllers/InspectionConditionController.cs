using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/inspection-conditions")]
public class InspectionConditionController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public InspectionConditionController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<InspectionCondition>(@"SELECT * FROM ""Const_AssetInspectionConditions"" ORDER BY ""InspectionCondition_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<InspectionCondition>(@"SELECT * FROM ""Const_AssetInspectionConditions"" WHERE ""InspectionCondition_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Inspection condition not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InspectionCondition model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetInspectionConditions"" WHERE ""InspectionConditionDesc"" ILIKE @InspectionConditionDesc", new { model.InspectionConditionDesc }) > 0;
        if (dup) return Conflict(new { error = $"Inspection condition '{model.InspectionConditionDesc}' already exists" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_AssetInspectionConditions"" (""InspectionConditionDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
            VALUES (@InspectionConditionDesc, @Enabled, GETDATE(), @CapturerID)
            RETURNING ""InspectionCondition_ID""", model);
        model.InspectionCondition_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] InspectionCondition model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetInspectionConditions"" WHERE ""InspectionConditionDesc"" ILIKE @InspectionConditionDesc AND ""InspectionCondition_ID"" <> @id", new { model.InspectionConditionDesc, id }) > 0;
        if (dup) return Conflict(new { error = $"Inspection condition '{model.InspectionConditionDesc}' already exists" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_AssetInspectionConditions""
            SET ""InspectionConditionDesc"" = @InspectionConditionDesc, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE()
            WHERE ""InspectionCondition_ID"" = @id", new { model.InspectionConditionDesc, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "Inspection condition not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_AssetInspectionConditions"" WHERE ""InspectionCondition_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Inspection condition not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Inspection Conditions");
        ws.Cell(1, 1).Value = "Inspection Condition";
        ws.Cell(2, 1).Value = "Good";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "InspectionConditions_Template.xlsx");
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
                errors.Add(new ImportError { Row = r, Column = "Inspection Condition", Value = val, Message = "Required field is empty" });
                continue;
            }
            if (!seen.Add(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Inspection Condition", Value = val, Message = $"Duplicate: 'Inspection Condition' value '{val}' in file" });
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
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetInspectionConditions"" WHERE ""InspectionConditionDesc"" ILIKE @val", new { val }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(val, out var rn) ? rn : 0, Column = "Inspection Condition", Value = val, Message = $"Duplicate: '{val}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_AssetInspectionConditions"" (""InspectionConditionDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
                VALUES (@val, 1, GETDATE(), 1)", new { val }, txn);
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
