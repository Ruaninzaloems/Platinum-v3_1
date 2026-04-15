using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/calculation-types")]
public class CalculationTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public CalculationTypeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<CalculationType>(@"SELECT ""Asset_Calculation_Type_ID"" AS ""CalculationType_ID"", ""TypeDescription"" AS ""CalculationTypeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"" FROM ""Const_Asset_Calculation_Type"" ORDER BY ""Asset_Calculation_Type_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<CalculationType>(@"SELECT ""Asset_Calculation_Type_ID"" AS ""CalculationType_ID"", ""TypeDescription"" AS ""CalculationTypeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"" FROM ""Const_Asset_Calculation_Type"" WHERE ""Asset_Calculation_Type_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Calculation type not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CalculationType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_Calculation_Type"" (""TypeDescription"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
            VALUES (@CalculationTypeDesc, @Enabled, GETDATE(), @CapturerID)
            RETURNING ""Asset_Calculation_Type_ID""", model);
        model.CalculationType_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CalculationType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_Calculation_Type""
            SET ""TypeDescription"" = @CalculationTypeDesc, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE()
            WHERE ""Asset_Calculation_Type_ID"" = @id", new { model.CalculationTypeDesc, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "Calculation type not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_Calculation_Type"" WHERE ""Asset_Calculation_Type_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Calculation type not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Calculation Types");
        ws.Cell(1, 1).Value = "Calculation Type";
        ws.Cell(2, 1).Value = "Straight Line";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CalculationTypes_Template.xlsx");
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
                errors.Add(new ImportError { Row = r, Column = "Calculation Type", Value = val, Message = "Required field 'Calculation Type' is empty" });
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
                INSERT INTO ""Const_Asset_Calculation_Type"" (""TypeDescription"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
                VALUES (@val, 1, GETDATE(), 1)", new { val }, txn);
        }

        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rows.Count });
    }
}
