using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-classes")]
public class AssetClassController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetClassController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? typeId, [FromQuery] int? categoryId, [FromQuery] int? subCategoryId,
        [FromQuery] int? page, [FromQuery] int? pageSize, [FromQuery] string? search)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""Const_AssetClass_sys"" WHERE 1=1";
        var countSql = @"SELECT COUNT(*) FROM ""Const_AssetClass_sys"" WHERE 1=1";
        var parameters = new DynamicParameters();
        var filterClause = "";

        if (typeId.HasValue) { filterClause += @" AND ""TypeID"" = @typeId"; parameters.Add("typeId", typeId); }
        if (categoryId.HasValue) { filterClause += @" AND ""AssetCategoryID"" = @categoryId"; parameters.Add("categoryId", categoryId); }
        if (subCategoryId.HasValue) { filterClause += @" AND ""Asset_SubCategory_ID"" = @subCategoryId"; parameters.Add("subCategoryId", subCategoryId); }
        if (!string.IsNullOrWhiteSpace(search)) { filterClause += @" AND ""AssetClassDesc"" LIKE @search"; parameters.Add("search", $"%{search}%"); }

        sql += filterClause + @" ORDER BY ""AssetClass_ID""";
        countSql += filterClause;

        if (page.HasValue && pageSize.HasValue)
        {
            var total = await conn.QuerySingleAsync<int>(countSql, parameters);
            var offset = (page.Value - 1) * pageSize.Value;
            parameters.Add("limit", pageSize.Value);
            parameters.Add("offset", offset);
            sql += " OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY";
            var items = await conn.QueryAsync<AssetClass>(sql, parameters);
            return Ok(new { data = items, total, page = page.Value, pageSize = pageSize.Value });
        }

        var all = await conn.QueryAsync<AssetClass>(sql, parameters);
        return Ok(all);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetClass>(@"SELECT * FROM ""Const_AssetClass_sys"" WHERE ""AssetClass_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Asset class not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetClass model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_AssetClass_sys"" (""AssetClassDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"",
                ""Asset_SubCategory_ID"", ""UsefulLifeInMonths"", ""AssetDepreciationMethod_ID"",
                ""TypeID"", ""AssetCategoryID"", ""AssetStatus_ID"", ""AssetMeasurement_ID"")
            VALUES (@AssetClassDesc, @Enabled, GETDATE(), @CapturerID,
                @Asset_SubCategory_ID, @UsefulLifeInMonths, @AssetDepreciationMethod_ID,
                @TypeID, @AssetCategoryID, @AssetStatus_ID, @AssetMeasurement_ID)
            RETURNING ""AssetClass_ID""", model);
        model.AssetClass_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetClass model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_AssetClass_sys""
            SET ""AssetClassDesc"" = @AssetClassDesc, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE(),
                ""Asset_SubCategory_ID"" = @Asset_SubCategory_ID, ""UsefulLifeInMonths"" = @UsefulLifeInMonths,
                ""AssetDepreciationMethod_ID"" = @AssetDepreciationMethod_ID,
                ""TypeID"" = @TypeID, ""AssetCategoryID"" = @AssetCategoryID,
                ""AssetStatus_ID"" = @AssetStatus_ID, ""AssetMeasurement_ID"" = @AssetMeasurement_ID
            WHERE ""AssetClass_ID"" = @id",
            new { model.AssetClassDesc, model.Enabled, model.Asset_SubCategory_ID, model.UsefulLifeInMonths,
                  model.AssetDepreciationMethod_ID, model.TypeID, model.AssetCategoryID,
                  model.AssetStatus_ID, model.AssetMeasurement_ID, id });
        return rows == 0 ? NotFound(new { error = "Asset class not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_AssetClass_sys"" WHERE ""AssetClass_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Asset class not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Asset Classes");
        ws.Cell(1, 1).Value = "Asset Class";
        ws.Cell(1, 2).Value = "Asset Type";
        ws.Cell(1, 3).Value = "Category";
        ws.Cell(1, 4).Value = "Sub Category";
        ws.Cell(1, 5).Value = "Measurement Type";
        ws.Cell(1, 6).Value = "Asset Status";
        ws.Cell(1, 7).Value = "Useful Life (Months)";
        ws.Cell(1, 8).Value = "Depreciation Method";
        ws.Cell(2, 1).Value = "HV switching station equipment - HV busbar indoor";
        ws.Cell(2, 2).Value = "Property, Plant and Equipment";
        ws.Cell(2, 3).Value = "Electrical Infrastructure";
        ws.Cell(2, 4).Value = "HV Switching Station";
        ws.Cell(2, 5).Value = "Cost Module";
        ws.Cell(2, 6).Value = "In Use";
        ws.Cell(2, 7).Value = 720;
        ws.Cell(2, 8).Value = "Straight Line";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetClasses_Template.xlsx");
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
        var catList = (await conn.QueryAsync<AssetCategory>(@"SELECT * FROM ""Const_AssetCategory_sys""")).ToList();
        var subCatList = (await conn.QueryAsync<AssetSubCategory>(@"SELECT * FROM ""Const_Asset_SubCategory""")).ToList();
        var statusLookup = (await conn.QueryAsync<AssetStatus>(@"SELECT * FROM ""Const_AssetStatus_Sys"""))
            .ToDictionary(s => s.AssetStatusDesc?.Trim() ?? "", s => s.AssetStatus_ID, StringComparer.OrdinalIgnoreCase);
        var measureLookup = (await conn.QueryAsync<MeasurementType>(@"SELECT * FROM ""AssetConfig_MeasurementType"""))
            .ToDictionary(m => m.Name?.Trim() ?? "", m => m.AssetConfig_MeasurementType_ID, StringComparer.OrdinalIgnoreCase);
        var depMethodLookup = (await conn.QueryAsync<dynamic>(@"SELECT * FROM ""Const_AssetDepreciationMethod_Sys"""))
            .ToDictionary(d => ((string)(d.AssetDepreciationMethodDesc ?? "")).Trim(), d => (int)d.AssetDepreciationMethod_ID, StringComparer.OrdinalIgnoreCase);

        var rowData = new List<AssetClass>();

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var classDesc = ws.Cell(r, 1).GetString().Trim();
            var typeDesc = ws.Cell(r, 2).GetString().Trim();
            var catDesc = ws.Cell(r, 3).GetString().Trim();
            var subCatDesc = ws.Cell(r, 4).GetString().Trim();
            var measureDesc = ws.Cell(r, 5).GetString().Trim();
            var statusDesc = ws.Cell(r, 6).GetString().Trim();
            var usefulLifeStr = ws.Cell(r, 7).GetString().Trim();
            var depMethodDesc = ws.Cell(r, 8).GetString().Trim();

            if (string.IsNullOrWhiteSpace(classDesc))
                errors.Add(new ImportError { Row = r, Column = "Asset Class", Value = classDesc, Message = "Required field 'Asset Class' is empty" });

            if (string.IsNullOrWhiteSpace(typeDesc))
                errors.Add(new ImportError { Row = r, Column = "Asset Type", Value = typeDesc, Message = "Required field 'Asset Type' is empty" });
            else if (!typeLookup.TryGetValue(typeDesc, out _))
                errors.Add(new ImportError { Row = r, Column = "Asset Type", Value = typeDesc, Message = $"No matching Asset Type found for '{typeDesc}'" });

            if (string.IsNullOrWhiteSpace(statusDesc))
                errors.Add(new ImportError { Row = r, Column = "Asset Status", Value = statusDesc, Message = "Required field 'Asset Status' is empty" });
            else if (!statusLookup.TryGetValue(statusDesc, out _))
                errors.Add(new ImportError { Row = r, Column = "Asset Status", Value = statusDesc, Message = $"No matching Asset Status found for '{statusDesc}'" });

            if (string.IsNullOrWhiteSpace(usefulLifeStr) || !int.TryParse(usefulLifeStr, out _))
                errors.Add(new ImportError { Row = r, Column = "Useful Life (Months)", Value = usefulLifeStr, Message = "Required field 'Useful Life (Months)' must be a number" });

            if (errors.Any(e => e.Row == r)) continue;

            var typeId = typeLookup[typeDesc];

            int? catId = null;
            if (!string.IsNullOrWhiteSpace(catDesc))
            {
                var matchedCat = catList.FirstOrDefault(c => string.Equals(c.AssetCategoryDesc?.Trim(), catDesc, StringComparison.OrdinalIgnoreCase) && c.TypeID == typeId);
                if (matchedCat == null)
                {
                    errors.Add(new ImportError { Row = r, Column = "Category", Value = catDesc, Message = $"No matching Category found for '{catDesc}' under Asset Type '{typeDesc}'" });
                    continue;
                }
                catId = matchedCat.AssetCategoryID;
            }

            int? subCatId = null;
            if (!string.IsNullOrWhiteSpace(subCatDesc))
            {
                var matchedSub = subCatList.FirstOrDefault(s =>
                    string.Equals(s.Asset_SubCategoryDescription?.Trim(), subCatDesc, StringComparison.OrdinalIgnoreCase)
                    && (catId == null || s.AssetCategoryID == catId));
                if (matchedSub == null)
                {
                    errors.Add(new ImportError { Row = r, Column = "Sub Category", Value = subCatDesc, Message = $"No matching Sub Category found for '{subCatDesc}'" });
                    continue;
                }
                subCatId = matchedSub.Asset_SubCategory_ID;
            }

            int? measureId = null;
            if (!string.IsNullOrWhiteSpace(measureDesc))
            {
                if (!measureLookup.TryGetValue(measureDesc, out var mId))
                {
                    errors.Add(new ImportError { Row = r, Column = "Measurement Type", Value = measureDesc, Message = $"No matching Measurement Type found for '{measureDesc}'" });
                    continue;
                }
                measureId = mId;
            }

            int? depMethodId = null;
            if (!string.IsNullOrWhiteSpace(depMethodDesc))
            {
                if (!depMethodLookup.TryGetValue(depMethodDesc, out var dId))
                {
                    errors.Add(new ImportError { Row = r, Column = "Depreciation Method", Value = depMethodDesc, Message = $"No matching Depreciation Method found for '{depMethodDesc}'" });
                    continue;
                }
                depMethodId = dId;
            }

            rowData.Add(new AssetClass
            {
                AssetClassDesc = classDesc,
                TypeID = typeId,
                AssetCategoryID = catId,
                Asset_SubCategory_ID = subCatId,
                AssetMeasurement_ID = measureId,
                AssetStatus_ID = statusLookup[statusDesc],
                UsefulLifeInMonths = int.Parse(usefulLifeStr),
                AssetDepreciationMethod_ID = depMethodId,
                Enabled = 1
            });
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var txn = await conn.BeginTransactionAsync();
        foreach (var item in rowData)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_AssetClass_sys"" (""AssetClassDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"",
                    ""Asset_SubCategory_ID"", ""UsefulLifeInMonths"", ""AssetDepreciationMethod_ID"",
                    ""TypeID"", ""AssetCategoryID"", ""AssetStatus_ID"", ""AssetMeasurement_ID"")
                VALUES (@AssetClassDesc, @Enabled, GETDATE(), 1,
                    @Asset_SubCategory_ID, @UsefulLifeInMonths, @AssetDepreciationMethod_ID,
                    @TypeID, @AssetCategoryID, @AssetStatus_ID, @AssetMeasurement_ID)", item, txn);
        }
        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rowData.Count });
    }
}
