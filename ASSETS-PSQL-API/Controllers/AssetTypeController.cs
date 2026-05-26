using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-types")]
public class AssetTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetTypeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT ""AssetType_ID"" AS ""assetTypeId"", ""AssetTypeDesc"" AS ""assetTypeDesc"",
                   ""Enabled"" AS ""enabled"", ""NoUsefuleLife"" AS ""noUsefulLife"",
                   ""RequireStatus"" AS ""requireStatus""
            FROM ""Const_AssetType_Sys"" ORDER BY ""AssetTypeDesc""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetType>(@"SELECT * FROM ""Const_AssetType_Sys"" WHERE ""AssetType_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Asset type not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetType_Sys"" WHERE ""AssetTypeDesc"" ILIKE @AssetTypeDesc", new { model.AssetTypeDesc }) > 0;
        if (dup) return Conflict(new { error = $"Asset type '{model.AssetTypeDesc}' already exists" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_AssetType_Sys"" (""AssetTypeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"", ""RequireStatus"", ""NoUsefuleLife"")
            VALUES (@AssetTypeDesc, @Enabled, GETDATE(), @CapturerID, @Default, @RequireStatus, @NoUsefuleLife)
            RETURNING ""AssetType_ID""", model);
        model.AssetType_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetType_Sys"" WHERE ""AssetTypeDesc"" ILIKE @AssetTypeDesc AND ""AssetType_ID"" <> @id", new { model.AssetTypeDesc, id }) > 0;
        if (dup) return Conflict(new { error = $"Asset type '{model.AssetTypeDesc}' already exists" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_AssetType_Sys""
            SET ""AssetTypeDesc"" = @AssetTypeDesc, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE(),
                ""RequireStatus"" = @RequireStatus, ""NoUsefuleLife"" = @NoUsefuleLife
            WHERE ""AssetType_ID"" = @id", new { model.AssetTypeDesc, model.Enabled, model.RequireStatus, model.NoUsefuleLife, id });
        return rows == 0 ? NotFound(new { error = "Asset type not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var refs = await conn.ExecuteScalarAsync<int>(@"
            SELECT (SELECT COUNT(1) FROM ""Const_AssetCategory_sys""  WHERE ""TypeID""       = @id)
                 + (SELECT COUNT(1) FROM ""Const_Asset_SubCategory""  WHERE ""TypeID""       = @id)
                 + (SELECT COUNT(1) FROM ""AssetConfig_mSCOA""        WHERE ""TypeID""       = @id)
                 + (SELECT COUNT(1) FROM ""Asset_Register_Items""     WHERE ""AssetType_ID"" = @id)", new { id });
        if (refs > 0)
            return Conflict(new { error = "Cannot delete this Asset Type — it is referenced by existing categories, sub-categories, mSCOA settings, or asset register items." });
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_AssetType_Sys"" WHERE ""AssetType_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Asset type not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT ""AssetType_ID"",
                   ""AssetTypeDesc"",
                   CASE WHEN ""Enabled"" THEN 1 ELSE 0 END AS ""Enabled"",
                   CASE WHEN COALESCE(""NoUsefuleLife"", false) THEN 1 ELSE 0 END AS ""NoUsefuleLife"",
                   CASE WHEN COALESCE(""RequireStatus"", false) THEN 1 ELSE 0 END AS ""RequireStatus"",
                   ""DateCaptured""
            FROM ""Const_AssetType_Sys"" ORDER BY ""AssetTypeDesc""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Asset Types");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Asset Type";
        ws.Cell(1, 3).Value = "Enabled";
        ws.Cell(1, 4).Value = "No Useful Life";
        ws.Cell(1, 5).Value = "Require Status";
        ws.Cell(1, 6).Value = "Date Captured";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.AssetType_ID;
            ws.Cell(r, 2).Value = (string?)row.AssetTypeDesc ?? "";
            ws.Cell(r, 3).Value = (int)row.Enabled == 1 ? "Yes" : "No";
            ws.Cell(r, 4).Value = (int)row.NoUsefuleLife == 1 ? "Yes" : "No";
            ws.Cell(r, 5).Value = (int)row.RequireStatus == 1 ? "Yes" : "No";
            ws.Cell(r, 6).Value = row.DateCaptured != null ? ((DateTime)row.DateCaptured).ToString("yyyy-MM-dd") : "";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetTypes_Export.xlsx");
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Asset Types");
        ws.Cell(1, 1).Value = "Asset Type";
        ws.Cell(1, 2).Value = "No Useful Life";
        ws.Cell(1, 3).Value = "Require Status";
        ws.Cell(2, 1).Value = "Biological Assets";
        ws.Cell(2, 2).Value = "No";
        ws.Cell(2, 3).Value = "No";
        ws.Row(1).Style.Font.Bold = true;
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetTypes_Template.xlsx");
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
        var rows = new List<(string val, bool noUsefulLife, bool requireStatus)>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var val = ws.Cell(r, 1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Asset Type", Value = val, Message = "Required field 'Asset Type' is empty" });
                continue;
            }
            if (!seen.Add(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Asset Type", Value = val, Message = $"Duplicate: 'Asset Type' value '{val}' in file" });
                continue;
            }
            var noUsefulLifeRaw = ws.Cell(r, 2).GetString().Trim();
            var requireStatusRaw = ws.Cell(r, 3).GetString().Trim();
            bool flagError = false;
            if (!string.IsNullOrEmpty(noUsefulLifeRaw) && !string.Equals(noUsefulLifeRaw, "yes", StringComparison.OrdinalIgnoreCase) && !string.Equals(noUsefulLifeRaw, "no", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add(new ImportError { Row = r, Column = "No Useful Life", Value = noUsefulLifeRaw, Message = $"Invalid value '{noUsefulLifeRaw}' in column 'No Useful Life' — must be 'Yes', 'No', or blank" });
                flagError = true;
            }
            if (!string.IsNullOrEmpty(requireStatusRaw) && !string.Equals(requireStatusRaw, "yes", StringComparison.OrdinalIgnoreCase) && !string.Equals(requireStatusRaw, "no", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add(new ImportError { Row = r, Column = "Require Status", Value = requireStatusRaw, Message = $"Invalid value '{requireStatusRaw}' in column 'Require Status' — must be 'Yes', 'No', or blank" });
                flagError = true;
            }
            if (flagError) continue;
            var noUsefulLife = string.Equals(noUsefulLifeRaw, "yes", StringComparison.OrdinalIgnoreCase);
            var requireStatus = string.Equals(requireStatusRaw, "yes", StringComparison.OrdinalIgnoreCase);
            rows.Add((val, noUsefulLife, requireStatus));
            rowNums[val] = r;
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dbErrors = new List<ImportError>();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var (val, noUsefulLife, requireStatus) in rows)
        {
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetType_Sys"" WHERE ""AssetTypeDesc"" ILIKE @val", new { val }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(val, out var rn) ? rn : 0, Column = "Asset Type", Value = val, Message = $"Duplicate: '{val}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_AssetType_Sys"" (""AssetTypeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"", ""NoUsefuleLife"", ""RequireStatus"")
                VALUES (@val, true, GETDATE(), 1, true, @noUsefulLife, @requireStatus)",
                new { val, noUsefulLife, requireStatus }, txn);
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
