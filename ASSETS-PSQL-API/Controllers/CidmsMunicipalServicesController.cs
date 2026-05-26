using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/cidms-municipal-services")]
public class CidmsMunicipalServicesController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public CidmsMunicipalServicesController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<CidmsMunicipalServices>(@"SELECT * FROM ""Const_Asset_CIDMS_Municipal_Services"" ORDER BY ""AssetMunicipalServicesID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<CidmsMunicipalServices>(@"SELECT * FROM ""Const_Asset_CIDMS_Municipal_Services"" WHERE ""AssetMunicipalServicesID"" = @id", new { id });
        return item is null ? NotFound(new { error = "CIDMS Municipal Service not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CidmsMunicipalServices model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Municipal_Services"" WHERE ""AssetMunicipalServicesDesc"" ILIKE @AssetMunicipalServicesDesc", new { model.AssetMunicipalServicesDesc }) > 0;
        if (dup) return Conflict(new { error = $"CIDMS municipal service '{model.AssetMunicipalServicesDesc}' already exists" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_CIDMS_Municipal_Services"" (""AssetMunicipalServicesDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
            VALUES (@AssetMunicipalServicesDesc, @Enabled, GETDATE(), @CapturerID, @Default)
            RETURNING ""AssetMunicipalServicesID""", model);
        model.AssetMunicipalServicesID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CidmsMunicipalServices model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Municipal_Services"" WHERE ""AssetMunicipalServicesDesc"" ILIKE @AssetMunicipalServicesDesc AND ""AssetMunicipalServicesID"" <> @id", new { model.AssetMunicipalServicesDesc, id }) > 0;
        if (dup) return Conflict(new { error = $"CIDMS municipal service '{model.AssetMunicipalServicesDesc}' already exists" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_CIDMS_Municipal_Services""
            SET ""AssetMunicipalServicesDesc"" = @AssetMunicipalServicesDesc, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE()
            WHERE ""AssetMunicipalServicesID"" = @id", new { model.AssetMunicipalServicesDesc, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "CIDMS Municipal Service not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_CIDMS_Municipal_Services"" WHERE ""AssetMunicipalServicesID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "CIDMS Municipal Service not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""Const_Asset_CIDMS_Municipal_Services"" ORDER BY ""AssetMunicipalServicesID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("CIDMS Municipal Services");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Municipal Service Description";
        ws.Cell(1, 3).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.AssetMunicipalServicesID;
            ws.Cell(r, 2).Value = (string?)row.AssetMunicipalServicesDesc ?? "";
            ws.Cell(r, 3).Value = (int)row.Enabled == 1 ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CIDMSMunicipalServices_Export.xlsx");
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("CIDMS Municipal Services");
        ws.Cell(1, 1).Value = "Municipal Service";
        ws.Cell(2, 1).Value = "Sample Service";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CidmsMunicipalServices_Template.xlsx");
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
                errors.Add(new ImportError { Row = r, Column = "Municipal Service", Value = val, Message = "Required field 'Municipal Service' is empty" });
                continue;
            }
            if (!seen.Add(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Municipal Service", Value = val, Message = $"Duplicate: 'Municipal Service' value '{val}' in file" });
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
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Municipal_Services"" WHERE ""AssetMunicipalServicesDesc"" ILIKE @val", new { val }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(val, out var rn) ? rn : 0, Column = "Municipal Services", Value = val, Message = $"Duplicate: '{val}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_CIDMS_Municipal_Services"" (""AssetMunicipalServicesDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
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
