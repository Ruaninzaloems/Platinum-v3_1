using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-categories")]
public class AssetCategoryController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetCategoryController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? typeId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""AssetCategoryID"" AS ""assetCategoryId"", ""AssetCategoryDesc"" AS ""assetCategoryDesc"",
                           ""TypeID"" AS ""assetTypeId"", ""Enabled"" AS ""enabled"",
                           ""RequireStatus"" AS ""requireStatus""
                    FROM ""Const_AssetCategory_sys""";
        if (typeId.HasValue) sql += @" WHERE ""TypeID"" = @typeId";
        sql += @" ORDER BY ""AssetCategoryID""";
        var items = await conn.QueryAsync<dynamic>(sql, new { typeId });
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetCategory>(@"SELECT * FROM ""Const_AssetCategory_sys"" WHERE ""AssetCategoryID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Asset category not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetCategory model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetCategory_sys"" WHERE ""AssetCategoryDesc"" ILIKE @AssetCategoryDesc AND ""TypeID"" IS NOT DISTINCT FROM @TypeID", new { model.AssetCategoryDesc, model.TypeID }) > 0;
        if (dup) return Conflict(new { error = $"Asset category '{model.AssetCategoryDesc}' already exists for this asset type" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_AssetCategory_sys"" (""AssetCategoryDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"",
                ""RevaluationByCostModel"", ""RevaluationByRevalutionModel"", ""Default"", ""TypeID"", ""RequireStatus"")
            VALUES (@AssetCategoryDesc, @Enabled, GETDATE(), @CapturerID,
                @RevaluationByCostModel, @RevaluationByRevalutionModel, @Default, @TypeID, @RequireStatus)
            RETURNING ""AssetCategoryID""", model);
        model.AssetCategoryID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetCategory model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetCategory_sys"" WHERE ""AssetCategoryDesc"" ILIKE @AssetCategoryDesc AND ""TypeID"" IS NOT DISTINCT FROM @TypeID AND ""AssetCategoryID"" <> @id", new { model.AssetCategoryDesc, model.TypeID, id }) > 0;
        if (dup) return Conflict(new { error = $"Asset category '{model.AssetCategoryDesc}' already exists for this asset type" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_AssetCategory_sys""
            SET ""AssetCategoryDesc"" = @AssetCategoryDesc, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE(),
                ""RevaluationByCostModel"" = @RevaluationByCostModel, ""RevaluationByRevalutionModel"" = @RevaluationByRevalutionModel,
                ""TypeID"" = @TypeID, ""RequireStatus"" = @RequireStatus
            WHERE ""AssetCategoryID"" = @id",
            new { model.AssetCategoryDesc, model.Enabled, model.RevaluationByCostModel, model.RevaluationByRevalutionModel, model.TypeID, model.RequireStatus, id });
        return rows == 0 ? NotFound(new { error = "Asset category not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var refs = await conn.ExecuteScalarAsync<int>(@"
            SELECT (SELECT COUNT(1) FROM ""Const_Asset_SubCategory""  WHERE ""AssetCategoryID""  = @id)
                 + (SELECT COUNT(1) FROM ""Const_AssetClass_sys""     WHERE ""AssetCategoryID""  = @id)
                 + (SELECT COUNT(1) FROM ""AssetConfig_mSCOA""        WHERE ""CategoryID""       = @id)
                 + (SELECT COUNT(1) FROM ""Asset_Register_Items""     WHERE ""AssetCategory_ID"" = @id)", new { id });
        if (refs > 0)
            return Conflict(new { error = "Cannot delete this Asset Category — it is referenced by existing sub-categories, asset classes, mSCOA settings, or asset register items." });
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_AssetCategory_sys"" WHERE ""AssetCategoryID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Asset category not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT c.""AssetCategoryID"" AS ""cid"", t.""AssetTypeDesc"" AS ""tdesc"",
                   c.""AssetCategoryDesc"" AS ""cdesc"",
                   c.""Enabled"" AS ""enabled"", COALESCE(c.""RequireStatus"", 0) AS ""reqstatus"",
                   COALESCE(c.""RevaluationByCostModel"", 0) AS ""revalByCost"",
                   COALESCE(c.""RevaluationByRevalutionModel"", 0) AS ""revalByReval"",
                   COALESCE(c.""Default"", 0) AS ""isDefault""
            FROM ""Const_AssetCategory_sys"" c
            LEFT JOIN ""Const_AssetType_Sys"" t ON t.""AssetType_ID"" = c.""TypeID""
            ORDER BY c.""AssetCategoryID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Asset Categories");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Asset Type";
        ws.Cell(1, 3).Value = "Asset Category";
        ws.Cell(1, 4).Value = "Revaluation By Cost Model";
        ws.Cell(1, 5).Value = "Revaluation By Revaluation Model";
        ws.Cell(1, 6).Value = "Default";
        ws.Cell(1, 7).Value = "Require Status";
        ws.Cell(1, 8).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.cid;
            ws.Cell(r, 2).Value = (string?)row.tdesc ?? "";
            ws.Cell(r, 3).Value = (string?)row.cdesc ?? "";
            ws.Cell(r, 4).Value = (int)row.revalByCost == 1 ? "Yes" : "No";
            ws.Cell(r, 5).Value = (int)row.revalByReval == 1 ? "Yes" : "No";
            ws.Cell(r, 6).Value = (int)row.isDefault == 1 ? "Yes" : "No";
            ws.Cell(r, 7).Value = (int)row.reqstatus == 1 ? "Yes" : "No";
            ws.Cell(r, 8).Value = (int)row.enabled == 1 ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetCategories_Export.xlsx");
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Asset Categories");
        ws.Cell(1, 1).Value = "Asset Type";
        ws.Cell(1, 2).Value = "Asset Category";
        ws.Cell(1, 3).Value = "Require Status";
        ws.Cell(1, 4).Value = "Revaluation By Cost Model";
        ws.Cell(1, 5).Value = "Revaluation By Revaluation Model";
        ws.Cell(2, 1).Value = "Property, Plant and Equipment";
        ws.Cell(2, 2).Value = "Land";
        ws.Cell(2, 3).Value = "No";
        ws.Cell(2, 4).Value = "No";
        ws.Cell(2, 5).Value = "No";
        ws.Row(1).Style.Font.Bold = true;
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetCategories_Template.xlsx");
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

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var typeLookup = (await conn.QueryAsync<AssetType>(@"SELECT * FROM ""Const_AssetType_Sys""")).ToDictionary(t => t.AssetTypeDesc?.Trim() ?? "", t => t.AssetType_ID, StringComparer.OrdinalIgnoreCase);

        var rowData = new List<(int typeId, string categoryDesc, int requireStatus, int revalByCost, int revalByRevalution)>();
        var rowNumMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var typeDesc = ws.Cell(r, 1).GetString().Trim();
            var catDesc = ws.Cell(r, 2).GetString().Trim();
            var requireStatusRaw = ws.Cell(r, 3).GetString().Trim();
            var revalByCostRaw = ws.Cell(r, 4).GetString().Trim();
            var revalByRevalutionRaw = ws.Cell(r, 5).GetString().Trim();

            if (string.IsNullOrWhiteSpace(typeDesc))
            {
                errors.Add(new ImportError { Row = r, Column = "Asset Type", Value = typeDesc, Message = "Required field 'Asset Type' is empty" });
                continue;
            }

            if (!typeLookup.TryGetValue(typeDesc, out var typeId))
            {
                errors.Add(new ImportError { Row = r, Column = "Asset Type", Value = typeDesc, Message = $"No matching Asset Type found for '{typeDesc}'" });
                continue;
            }

            if (string.IsNullOrWhiteSpace(catDesc))
            {
                errors.Add(new ImportError { Row = r, Column = "Asset Category", Value = catDesc, Message = "Required field 'Asset Category' is empty" });
                continue;
            }

            bool flagError = false;
            if (!string.IsNullOrEmpty(requireStatusRaw) && !string.Equals(requireStatusRaw, "yes", StringComparison.OrdinalIgnoreCase) && !string.Equals(requireStatusRaw, "no", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add(new ImportError { Row = r, Column = "Require Status", Value = requireStatusRaw, Message = $"Invalid value '{requireStatusRaw}' in column 'Require Status' — must be 'Yes', 'No', or blank" });
                flagError = true;
            }
            if (!string.IsNullOrEmpty(revalByCostRaw) && !string.Equals(revalByCostRaw, "yes", StringComparison.OrdinalIgnoreCase) && !string.Equals(revalByCostRaw, "no", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add(new ImportError { Row = r, Column = "Revaluation By Cost Model", Value = revalByCostRaw, Message = $"Invalid value '{revalByCostRaw}' in column 'Revaluation By Cost Model' — must be 'Yes', 'No', or blank" });
                flagError = true;
            }
            if (!string.IsNullOrEmpty(revalByRevalutionRaw) && !string.Equals(revalByRevalutionRaw, "yes", StringComparison.OrdinalIgnoreCase) && !string.Equals(revalByRevalutionRaw, "no", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add(new ImportError { Row = r, Column = "Revaluation By Revaluation Model", Value = revalByRevalutionRaw, Message = $"Invalid value '{revalByRevalutionRaw}' in column 'Revaluation By Revaluation Model' — must be 'Yes', 'No', or blank" });
                flagError = true;
            }
            if (flagError) continue;

            if (!seen.Add($"{catDesc}|{typeId}"))
            {
                errors.Add(new ImportError { Row = r, Column = "Asset Category", Value = catDesc, Message = $"Duplicate: 'Asset Category' value '{catDesc}' for this type in file" });
                continue;
            }

            var requireStatus = string.Equals(requireStatusRaw, "yes", StringComparison.OrdinalIgnoreCase) ? 1 : 0;
            var revalByCost = string.Equals(revalByCostRaw, "yes", StringComparison.OrdinalIgnoreCase) ? 1 : 0;
            var revalByRevalution = string.Equals(revalByRevalutionRaw, "yes", StringComparison.OrdinalIgnoreCase) ? 1 : 0;
            rowData.Add((typeId, catDesc, requireStatus, revalByCost, revalByRevalution));
            rowNumMap[$"{typeId}|{catDesc}"] = r;
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        var dbErrors = new List<ImportError>();
        await using var txn = await conn.BeginTransactionAsync();
        foreach (var (typeId, categoryDesc, requireStatus, revalByCost, revalByRevalution) in rowData)
        {
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetCategory_sys"" WHERE ""AssetCategoryDesc"" ILIKE @categoryDesc AND ""TypeID"" = @typeId", new { categoryDesc, typeId }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNumMap.TryGetValue($"{typeId}|{categoryDesc}", out var rn) ? rn : 0, Column = "Asset Category", Value = categoryDesc, Message = $"Duplicate: '{categoryDesc}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_AssetCategory_sys"" (""AssetCategoryDesc"", ""TypeID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"", ""RequireStatus"", ""RevaluationByCostModel"", ""RevaluationByRevalutionModel"")
                VALUES (@categoryDesc, @typeId, 1, GETDATE(), 1, 1, @requireStatus, @revalByCost, @revalByRevalution)",
                new { categoryDesc, typeId, requireStatus, revalByCost, revalByRevalution }, txn);
        }
        if (dbErrors.Count > 0)
        {
            await txn.RollbackAsync();
            return BadRequest(new ImportResult { Success = false, Errors = dbErrors });
        }
        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rowData.Count });
    }
}
