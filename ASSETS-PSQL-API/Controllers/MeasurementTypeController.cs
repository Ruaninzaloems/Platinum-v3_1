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
    public async Task<IActionResult> GetAll([FromQuery] int? typeId, [FromQuery] string? model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        IEnumerable<dynamic> items;

        var modelFilter = "";
        if (string.Equals(model, "Cost", StringComparison.OrdinalIgnoreCase))
            modelFilter = @" AND mt.""Name"" NOT ILIKE '%Revaluation%'";
        else if (string.Equals(model, "Revaluation", StringComparison.OrdinalIgnoreCase))
            modelFilter = @" AND mt.""Name"" ILIKE '%Revaluation%'";

        if (typeId.HasValue)
        {
            items = await conn.QueryAsync<dynamic>($@"
                SELECT mt.""AssetConfig_MeasurementType_ID"" AS ""measurementTypeId"",
                       mt.""Name"" AS ""measurementTypeDesc"",
                       mt.""Enabled"" AS ""enabled"",
                       mt.""NoDepreciation"" AS ""noDepreciation""
                FROM ""AssetConfig_MeasurementType"" mt
                INNER JOIN ""AssetConfig_AssetType_MeasurementType_Link"" lnk
                    ON lnk.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
                WHERE lnk.""AssetType_ID"" = @typeId{modelFilter}
                ORDER BY mt.""Name""", new { typeId });
        }
        else
        {
            items = await conn.QueryAsync<dynamic>($@"
                SELECT mt.""AssetConfig_MeasurementType_ID"" AS ""measurementTypeId"",
                       mt.""Name"" AS ""measurementTypeDesc"",
                       mt.""Enabled"" AS ""enabled"",
                       mt.""NoDepreciation"" AS ""noDepreciation""
                FROM ""AssetConfig_MeasurementType"" mt WHERE 1=1{modelFilter} ORDER BY mt.""Name""");
        }
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
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""AssetConfig_MeasurementType"" WHERE ""Name"" ILIKE @Name", new { model.Name }) > 0;
        if (dup) return Conflict(new { error = $"Measurement type '{model.Name}' already exists" });
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
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""AssetConfig_MeasurementType"" WHERE ""Name"" ILIKE @Name AND ""AssetConfig_MeasurementType_ID"" <> @id", new { model.Name, id }) > 0;
        if (dup) return Conflict(new { error = $"Measurement type '{model.Name}' already exists" });
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
        var refs = await conn.ExecuteScalarAsync<int>(@"
            SELECT (SELECT COUNT(1) FROM ""Const_AssetClass_sys""  WHERE ""AssetMeasurement_ID""            = @id)
                 + (SELECT COUNT(1) FROM ""AssetConfig_mSCOA""     WHERE ""MeasurementTypeID""              = @id)
                 + (SELECT COUNT(1) FROM ""Asset_Register_Items""  WHERE ""MeasurementType_ID""             = @id)", new { id });
        if (refs > 0)
            return Conflict(new { error = "Cannot delete this Measurement Type — it is referenced by existing asset classes, mSCOA settings, or asset register items." });
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""AssetConfig_MeasurementType"" WHERE ""AssetConfig_MeasurementType_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Measurement type not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT ""AssetConfig_MeasurementType_ID"",
                   ""Name"",
                   CASE WHEN ""Enabled"" THEN 1 ELSE 0 END AS ""Enabled"",
                   COALESCE(""NoDepreciation"", 0) AS ""NoDepreciation"",
                   ""CreatedDate""
            FROM ""AssetConfig_MeasurementType"" ORDER BY ""Name""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Measurement Types");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Measurement Type";
        ws.Cell(1, 3).Value = "Enabled";
        ws.Cell(1, 4).Value = "No Depreciation";
        ws.Cell(1, 5).Value = "Date Captured";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.AssetConfig_MeasurementType_ID;
            ws.Cell(r, 2).Value = (string?)row.Name ?? "";
            ws.Cell(r, 3).Value = (int)row.Enabled == 1 ? "Yes" : "No";
            ws.Cell(r, 4).Value = (int)row.NoDepreciation == 1 ? "Yes" : "No";
            ws.Cell(r, 5).Value = row.CreatedDate != null ? ((DateTime)row.CreatedDate).ToString("yyyy-MM-dd") : "";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "MeasurementTypes_Export.xlsx");
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Measurement Types");
        ws.Cell(1, 1).Value = "Measurement Type Description";
        ws.Cell(1, 2).Value = "No Depreciation";
        ws.Cell(2, 1).Value = "Cost Module";
        ws.Cell(2, 2).Value = "No";
        ws.Row(1).Style.Font.Bold = true;
        ws.Columns().AdjustToContents();
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
        var rowNums = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var rows = new List<(string val, bool noDepreciation)>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var val = ws.Cell(r, 1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Measurement Type Description", Value = val, Message = "Required field 'Measurement Type Description' is empty" });
                continue;
            }
            if (!seen.Add(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Measurement Type Description", Value = val, Message = $"Duplicate: 'Measurement Type Description' value '{val}' in file" });
                continue;
            }
            var noDepreciationRaw = ws.Cell(r, 2).GetString().Trim();
            if (!string.IsNullOrEmpty(noDepreciationRaw) && !string.Equals(noDepreciationRaw, "yes", StringComparison.OrdinalIgnoreCase) && !string.Equals(noDepreciationRaw, "no", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add(new ImportError { Row = r, Column = "No Depreciation", Value = noDepreciationRaw, Message = $"Invalid value '{noDepreciationRaw}' in column 'No Depreciation' — must be 'Yes', 'No', or blank" });
                continue;
            }
            var noDepreciation = string.Equals(noDepreciationRaw, "yes", StringComparison.OrdinalIgnoreCase);
            rows.Add((val, noDepreciation));
            rowNums[val] = r;
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dbErrors = new List<ImportError>();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var (val, noDepreciation) in rows)
        {
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""AssetConfig_MeasurementType"" WHERE ""Name"" ILIKE @val", new { val }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(val, out var rn) ? rn : 0, Column = "Measurement Type", Value = val, Message = $"Duplicate: '{val}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""AssetConfig_MeasurementType"" (""Name"", ""Default"", ""Enabled"", ""CreatedByID"", ""CreatedDate"", ""NoDepreciation"")
                VALUES (@val, true, true, 1, GETDATE(), @noDepreciation)",
                new { val, noDepreciation }, txn);
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
