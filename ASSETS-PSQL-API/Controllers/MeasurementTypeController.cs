using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/measurement-types")]
public class MeasurementTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public MeasurementTypeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT ""AssetConfig_MeasurementType_ID"" AS ""measurementTypeId"",
                   ""Name"" AS ""measurementTypeDesc"",
                   ""Enabled"" AS ""enabled""
            FROM ""AssetConfig_MeasurementType"" ORDER BY ""AssetConfig_MeasurementType_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<MeasurementType>(@"SELECT * FROM ""AssetConfig_MeasurementType"" WHERE ""AssetConfig_MeasurementType_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Measurement type not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MeasurementType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""AssetConfig_MeasurementType"" (""Name"", ""Default"", ""Enabled"", ""CreatedByID"", ""CreatedDate"", ""NoDepreciation"")
            VALUES (@Name, @Default, @Enabled, @CreatedByID, GETDATE(), @NoDepreciation)
            RETURNING ""AssetConfig_MeasurementType_ID""", model);
        model.AssetConfig_MeasurementType_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] MeasurementType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""AssetConfig_MeasurementType""
            SET ""Name"" = @Name, ""Enabled"" = @Enabled, ""ModiefiedDate"" = GETDATE(), ""NoDepreciation"" = @NoDepreciation
            WHERE ""AssetConfig_MeasurementType_ID"" = @id", new { model.Name, model.Enabled, model.NoDepreciation, id });
        return rows == 0 ? NotFound(new { error = "Measurement type not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""AssetConfig_MeasurementType"" WHERE ""AssetConfig_MeasurementType_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Measurement type not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Measurement Types");
        ws.Cell(1, 1).Value = "Measurement Type Description";
        ws.Cell(2, 1).Value = "Cost Module";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "MeasurementTypes_Template.xlsx");
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
                errors.Add(new ImportError { Row = r, Column = "Measurement Type Description", Value = val, Message = "Required field 'Measurement Type Description' is empty" });
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
                INSERT INTO ""AssetConfig_MeasurementType"" (""Name"", ""Default"", ""Enabled"", ""CreatedByID"", ""CreatedDate"")
                VALUES (@val, 1, 1, 1, GETDATE())", new { val }, txn);
        }

        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rows.Count });
    }
}
