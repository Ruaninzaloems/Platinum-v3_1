using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-statuses")]
public class AssetStatusController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetStatusController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT ""AssetStatus_ID""  AS ""assetStatusId"",
                   ""AssetStatusDesc"" AS ""assetStatusDesc"",
                   ""Enabled""        AS ""enabled""
            FROM ""Const_AssetStatus_Sys""
            ORDER BY ""AssetStatus_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetStatus>(@"SELECT * FROM ""Const_AssetStatus_Sys"" WHERE ""AssetStatus_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Asset status not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetStatus model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetStatus_Sys"" WHERE ""AssetStatusDesc"" ILIKE @AssetStatusDesc", new { model.AssetStatusDesc }) > 0;
        if (dup) return Conflict(new { error = $"Asset status '{model.AssetStatusDesc}' already exists" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_AssetStatus_Sys"" (""AssetStatusDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
            VALUES (@AssetStatusDesc, @Enabled, NOW(), @CapturerID, @Default)
            RETURNING ""AssetStatus_ID""", model);
        model.AssetStatus_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetStatus model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetStatus_Sys"" WHERE ""AssetStatusDesc"" ILIKE @AssetStatusDesc AND ""AssetStatus_ID"" <> @id", new { model.AssetStatusDesc, id }) > 0;
        if (dup) return Conflict(new { error = $"Asset status '{model.AssetStatusDesc}' already exists" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_AssetStatus_Sys""
            SET ""AssetStatusDesc"" = @AssetStatusDesc, ""Enabled"" = @Enabled, ""DateModified"" = NOW()
            WHERE ""AssetStatus_ID"" = @id", new { model.AssetStatusDesc, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "Asset status not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var refs = await conn.ExecuteScalarAsync<int>(@"
            SELECT (SELECT COUNT(1) FROM ""Const_AssetClass_sys""  WHERE ""AssetStatus_ID"" = @id)
                 + (SELECT COUNT(1) FROM ""AssetConfig_mSCOA""     WHERE ""StatusID""       = @id)
                 + (SELECT COUNT(1) FROM ""Asset_Register_Items""  WHERE ""AssetStatus_ID"" = @id)", new { id });
        if (refs > 0)
            return Conflict(new { error = "Cannot delete this Asset Status — it is referenced by existing asset classes, mSCOA settings, or asset register items." });
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_AssetStatus_Sys"" WHERE ""AssetStatus_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Asset status not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT ""AssetStatus_ID"" AS ""sid"", ""AssetStatusDesc"" AS ""sdesc"", ""Enabled"" AS ""enabled""
            FROM ""Const_AssetStatus_Sys"" ORDER BY ""AssetStatus_ID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Asset Statuses");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Asset Status";
        ws.Cell(1, 3).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.sid;
            ws.Cell(r, 2).Value = (string?)row.sdesc ?? "";
            ws.Cell(r, 3).Value = (int)row.enabled == 1 ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetStatuses_Export.xlsx");
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Asset Statuses");
        ws.Cell(1, 1).Value = "Asset Status";
        ws.Cell(2, 1).Value = "In Use";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetStatuses_Template.xlsx");
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
                errors.Add(new ImportError { Row = r, Column = "Asset Status", Value = val, Message = "Required field 'Asset Status' is empty" });
                continue;
            }
            if (!seen.Add(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Asset Status", Value = val, Message = $"Duplicate: 'Asset Status' value '{val}' in file" });
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
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetStatus_Sys"" WHERE ""AssetStatusDesc"" ILIKE @val", new { val }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(val, out var rn) ? rn : 0, Column = "Asset Status", Value = val, Message = $"Duplicate: '{val}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_AssetStatus_Sys"" (""AssetStatusDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
                VALUES (@val, 1, NOW(), 1, 1)", new { val }, txn);
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
