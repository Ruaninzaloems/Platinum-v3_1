using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-sub-categories")]
public class AssetSubCategoryController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetSubCategoryController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? typeId, [FromQuery] int? categoryId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Asset_SubCategory_ID"" AS ""assetSubCategoryId"",
                           ""Asset_SubCategoryDescription"" AS ""assetSubCategoryDesc"",
                           ""AssetCategoryID"" AS ""assetCategoryId"",
                           ""TypeID"" AS ""assetTypeId"",
                           ""Enabled"" AS ""enabled""
                    FROM ""Const_Asset_SubCategory"" WHERE 1=1";
        var parameters = new DynamicParameters();
        if (typeId.HasValue) { sql += @" AND ""TypeID"" = @typeId"; parameters.Add("typeId", typeId); }
        if (categoryId.HasValue) { sql += @" AND ""AssetCategoryID"" = @categoryId"; parameters.Add("categoryId", categoryId); }
        sql += @" ORDER BY ""Asset_SubCategory_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetSubCategory>(@"SELECT * FROM ""Const_Asset_SubCategory"" WHERE ""Asset_SubCategory_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Asset sub category not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetSubCategory model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_SubCategory"" (""Asset_SubCategoryDescription"", ""Enabled"", ""DateCaptured"", ""Capturer_ID"", ""AssetCategoryID"", ""TypeID"", ""Default"")
            VALUES (@Asset_SubCategoryDescription, @Enabled, GETDATE(), @Capturer_ID, @AssetCategoryID, @TypeID, @Default)
            RETURNING ""Asset_SubCategory_ID""", model);
        model.Asset_SubCategory_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetSubCategory model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_SubCategory""
            SET ""Asset_SubCategoryDescription"" = @Asset_SubCategoryDescription, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE(),
                ""AssetCategoryID"" = @AssetCategoryID, ""TypeID"" = @TypeID
            WHERE ""Asset_SubCategory_ID"" = @id",
            new { model.Asset_SubCategoryDescription, model.Enabled, model.AssetCategoryID, model.TypeID, id });
        return rows == 0 ? NotFound(new { error = "Asset sub category not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_SubCategory"" WHERE ""Asset_SubCategory_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Asset sub category not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Sub Categories");
        ws.Cell(1, 1).Value = "Asset Type";
        ws.Cell(1, 2).Value = "Category";
        ws.Cell(1, 3).Value = "Sub Category Description";
        ws.Cell(2, 1).Value = "Property, Plant and Equipment";
        ws.Cell(2, 2).Value = "Electrical Infrastructure";
        ws.Cell(2, 3).Value = "HV Switching Station";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetSubCategories_Template.xlsx");
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

        var typeLookup = (await conn.QueryAsync<AssetType>(@"SELECT * FROM ""Const_AssetType_Sys"""))
            .ToDictionary(t => t.AssetTypeDesc?.Trim() ?? "", t => t.AssetType_ID, StringComparer.OrdinalIgnoreCase);
        var catLookup = (await conn.QueryAsync<AssetCategory>(@"SELECT * FROM ""Const_AssetCategory_sys""")).ToList();

        var rowData = new List<(int typeId, int categoryId, string desc)>();

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var typeDesc = ws.Cell(r, 1).GetString().Trim();
            var catDesc = ws.Cell(r, 2).GetString().Trim();
            var subDesc = ws.Cell(r, 3).GetString().Trim();

            if (!string.IsNullOrWhiteSpace(typeDesc) && !typeLookup.TryGetValue(typeDesc, out _))
            {
                errors.Add(new ImportError { Row = r, Column = "Asset Type", Value = typeDesc, Message = $"No matching Asset Type found for '{typeDesc}'" });
                continue;
            }

            var typeId = !string.IsNullOrWhiteSpace(typeDesc) ? typeLookup[typeDesc] : 0;
            var matchedCat = catLookup.FirstOrDefault(c =>
                string.Equals(c.AssetCategoryDesc?.Trim(), catDesc, StringComparison.OrdinalIgnoreCase)
                && (typeId == 0 || c.TypeID == typeId));

            if (!string.IsNullOrWhiteSpace(catDesc) && matchedCat == null)
            {
                errors.Add(new ImportError { Row = r, Column = "Category", Value = catDesc, Message = $"No matching Category found for '{catDesc}'" + (typeId > 0 ? $" under Asset Type '{typeDesc}'" : "") });
                continue;
            }

            if (string.IsNullOrWhiteSpace(subDesc))
            {
                errors.Add(new ImportError { Row = r, Column = "Sub Category Description", Value = subDesc, Message = "Required field 'Sub Category Description' is empty" });
                continue;
            }

            rowData.Add((typeId, matchedCat?.AssetCategoryID ?? 0, subDesc));
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var txn = await conn.BeginTransactionAsync();
        foreach (var (typeId, categoryId, desc) in rowData)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_SubCategory"" (""Asset_SubCategoryDescription"", ""TypeID"", ""AssetCategoryID"", ""Enabled"", ""DateCaptured"", ""Capturer_ID"", ""Default"")
                VALUES (@desc, NULLIF(@typeId, 0), NULLIF(@categoryId, 0), 1, GETDATE(), 1, 1)", new { desc, typeId, categoryId }, txn);
        }
        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rowData.Count });
    }
}
