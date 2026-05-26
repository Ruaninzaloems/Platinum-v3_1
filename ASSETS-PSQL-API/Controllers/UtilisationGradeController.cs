using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/utilisation-grades")]
public class UtilisationGradeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public UtilisationGradeController(DbConnectionFactory db) => _db = db;

    private const string _utilCols = @"""AssetUtilisationGradeID"" AS ""UtilisationGrade_ID"", ""AssetUtilisationGradeDesc"" AS ""UtilisationGradeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"", ""Default""";

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<UtilisationGrade>($@"SELECT {_utilCols} FROM ""Const_Asset_Utilisation_Grade"" ORDER BY ""AssetUtilisationGradeID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<UtilisationGrade>($@"SELECT {_utilCols} FROM ""Const_Asset_Utilisation_Grade"" WHERE ""AssetUtilisationGradeID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Utilisation grade not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UtilisationGrade model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_Utilisation_Grade"" WHERE ""AssetUtilisationGradeDesc"" ILIKE @UtilisationGradeDesc", new { model.UtilisationGradeDesc }) > 0;
        if (dup) return Conflict(new { error = $"Utilisation grade '{model.UtilisationGradeDesc}' already exists" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_Utilisation_Grade"" (""AssetUtilisationGradeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
            VALUES (@UtilisationGradeDesc, @Enabled, GETDATE(), @CapturerID, @Default)
            RETURNING ""AssetUtilisationGradeID""", model);
        model.UtilisationGrade_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UtilisationGrade model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_Utilisation_Grade"" WHERE ""AssetUtilisationGradeDesc"" ILIKE @UtilisationGradeDesc AND ""AssetUtilisationGradeID"" <> @id", new { model.UtilisationGradeDesc, id }) > 0;
        if (dup) return Conflict(new { error = $"Utilisation grade '{model.UtilisationGradeDesc}' already exists" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_Utilisation_Grade""
            SET ""AssetUtilisationGradeDesc"" = @UtilisationGradeDesc, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE()
            WHERE ""AssetUtilisationGradeID"" = @id", new { model.UtilisationGradeDesc, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "Utilisation grade not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_Utilisation_Grade"" WHERE ""AssetUtilisationGradeID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Utilisation grade not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""Const_Asset_Utilisation_Grade"" ORDER BY ""AssetUtilisationGradeID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Utilisation Grades");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Utilisation Grade Description";
        ws.Cell(1, 3).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.AssetUtilisationGradeID;
            ws.Cell(r, 2).Value = (string?)row.AssetUtilisationGradeDesc ?? "";
            ws.Cell(r, 3).Value = (int)row.Enabled == 1 ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "UtilisationGrades_Export.xlsx");
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Utilisation Grades");
        ws.Cell(1, 1).Value = "Utilisation Grade";
        ws.Cell(2, 1).Value = "High";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "UtilisationGrades_Template.xlsx");
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
                errors.Add(new ImportError { Row = r, Column = "Utilisation Grade", Value = val, Message = "Required field 'Utilisation Grade' is empty" });
                continue;
            }
            if (!seen.Add(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Utilisation Grade", Value = val, Message = $"Duplicate: 'Utilisation Grade' value '{val}' in file" });
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
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_Utilisation_Grade"" WHERE ""AssetUtilisationGradeDesc"" ILIKE @val", new { val }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(val, out var rn) ? rn : 0, Column = "Utilisation Grade", Value = val, Message = $"Duplicate: '{val}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_Utilisation_Grade"" (""AssetUtilisationGradeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
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
