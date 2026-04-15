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
        var sql = @"SELECT ""AssetCategoryID"" AS ""assetCategoryId"", ""AssetCategoryDesc"" AS ""assetCategoryDesc"", ""TypeID"" AS ""assetTypeId"", ""Enabled"" AS ""enabled""
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
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_AssetCategory_sys"" WHERE ""AssetCategoryID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Asset category not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Asset Categories");
        ws.Cell(1, 1).Value = "Asset Type";
        ws.Cell(1, 2).Value = "Asset Category";
        ws.Cell(2, 1).Value = "Property, Plant and Equipment";
        ws.Cell(2, 2).Value = "Land";
        ws.Row(1).Style.Font.Bold = true;
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

        var rowData = new List<(int typeId, string categoryDesc)>();

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var typeDesc = ws.Cell(r, 1).GetString().Trim();
            var catDesc = ws.Cell(r, 2).GetString().Trim();

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

            rowData.Add((typeId, catDesc));
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var txn = await conn.BeginTransactionAsync();
        foreach (var (typeId, categoryDesc) in rowData)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_AssetCategory_sys"" (""AssetCategoryDesc"", ""TypeID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
                VALUES (@categoryDesc, @typeId, 1, GETDATE(), 1, 1)", new { categoryDesc, typeId }, txn);
        }
        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rowData.Count });
    }
}
