using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/criticality-grades")]
public class CriticalityGradeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public CriticalityGradeController(DbConnectionFactory db) => _db = db;

    private const string _critCols = @"""AssetCriticalityGradeID"" AS ""CriticalityGrade_ID"", ""AssetCriticalityGradeDesc"" AS ""CriticalityGradeDesc"", ""ConsequenceOfFailure"", ""QualitiveDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"", ""Default""";

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<CriticalityGrade>($@"SELECT {_critCols} FROM ""Const_Asset_Criticality_Grade"" ORDER BY ""AssetCriticalityGradeID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<CriticalityGrade>($@"SELECT {_critCols} FROM ""Const_Asset_Criticality_Grade"" WHERE ""AssetCriticalityGradeID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Criticality grade not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CriticalityGrade model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_Criticality_Grade"" (""AssetCriticalityGradeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
            VALUES (@CriticalityGradeDesc, @Enabled, GETDATE(), @CapturerID, @Default)
            RETURNING ""AssetCriticalityGradeID""", model);
        model.CriticalityGrade_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CriticalityGrade model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_Criticality_Grade""
            SET ""AssetCriticalityGradeDesc"" = @CriticalityGradeDesc, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE()
            WHERE ""AssetCriticalityGradeID"" = @id", new { model.CriticalityGradeDesc, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "Criticality grade not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_Criticality_Grade"" WHERE ""AssetCriticalityGradeID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Criticality grade not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Criticality Grades");
        ws.Cell(1, 1).Value = "Criticality Grade";
        ws.Cell(2, 1).Value = "High";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CriticalityGrades_Template.xlsx");
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
            var val = ws.Cell(r, 1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Criticality Grade", Value = val, Message = "Required field 'Criticality Grade' is empty" });
                continue;
            }
            rows.Add(val);
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var val in rows)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_Criticality_Grade"" (""AssetCriticalityGradeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
                VALUES (@val, 1, GETDATE(), 1, 1)", new { val }, txn);
        }

        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rows.Count });
    }
}
