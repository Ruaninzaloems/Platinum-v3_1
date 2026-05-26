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
        [FromQuery] int? page, [FromQuery] int? pageSize, [FromQuery] string? search, [FromQuery] string? model)
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
        if (string.Equals(model, "Cost", StringComparison.OrdinalIgnoreCase))
            filterClause += @" AND (""AssetMeasurement_ID"" IS NULL OR ""AssetMeasurement_ID"" IN (SELECT ""AssetConfig_MeasurementType_ID"" FROM ""AssetConfig_MeasurementType"" WHERE ""Name"" NOT ILIKE '%Revaluation%'))";
        else if (string.Equals(model, "Revaluation", StringComparison.OrdinalIgnoreCase))
            filterClause += @" AND ""AssetMeasurement_ID"" IN (SELECT ""AssetConfig_MeasurementType_ID"" FROM ""AssetConfig_MeasurementType"" WHERE ""Name"" ILIKE '%Revaluation%')";

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
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetClass_sys"" WHERE ""AssetClassDesc"" ILIKE @AssetClassDesc AND ""TypeID"" IS NOT DISTINCT FROM @TypeID AND ""AssetCategoryID"" IS NOT DISTINCT FROM @AssetCategoryID AND ""Asset_SubCategory_ID"" IS NOT DISTINCT FROM @Asset_SubCategory_ID", new { model.AssetClassDesc, model.TypeID, model.AssetCategoryID, model.Asset_SubCategory_ID }) > 0;
        if (dup) return Conflict(new { error = $"Asset class '{model.AssetClassDesc}' already exists for this type/category/sub-category" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_AssetClass_sys"" (""AssetClassDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"",
                ""Asset_SubCategory_ID"", ""UsefulLifeInMonths"", ""AssetDepreciationMethod_ID"",
                ""TypeID"", ""AssetCategoryID"", ""AssetStatus_ID"", ""AssetMeasurement_ID"", ""RevaluationMethod"")
            VALUES (@AssetClassDesc, @Enabled, GETDATE(), @CapturerID,
                @Asset_SubCategory_ID, @UsefulLifeInMonths, @AssetDepreciationMethod_ID,
                @TypeID, @AssetCategoryID, @AssetStatus_ID, @AssetMeasurement_ID, @RevaluationMethod)
            RETURNING ""AssetClass_ID""", model);
        model.AssetClass_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetClass model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var isDefault = await conn.ExecuteScalarAsync<int>(@"SELECT COALESCE(""Default"",0) FROM ""Const_AssetClass_sys"" WHERE ""AssetClass_ID"" = @id", new { id });
        if (isDefault == 1)
            return BadRequest(new { error = "Cannot update a system/default Asset Class — system classes cannot be changed." });
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_AssetClass_sys"" WHERE ""AssetClassDesc"" ILIKE @AssetClassDesc AND ""TypeID"" IS NOT DISTINCT FROM @TypeID AND ""AssetCategoryID"" IS NOT DISTINCT FROM @AssetCategoryID AND ""Asset_SubCategory_ID"" IS NOT DISTINCT FROM @Asset_SubCategory_ID AND ""AssetClass_ID"" <> @id", new { model.AssetClassDesc, model.TypeID, model.AssetCategoryID, model.Asset_SubCategory_ID, id }) > 0;
        if (dup) return Conflict(new { error = $"Asset class '{model.AssetClassDesc}' already exists for this type/category/sub-category" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_AssetClass_sys""
            SET ""AssetClassDesc"" = @AssetClassDesc, ""Enabled"" = @Enabled, ""DateModified"" = GETDATE(),
                ""Asset_SubCategory_ID"" = @Asset_SubCategory_ID, ""UsefulLifeInMonths"" = @UsefulLifeInMonths,
                ""AssetDepreciationMethod_ID"" = @AssetDepreciationMethod_ID,
                ""TypeID"" = @TypeID, ""AssetCategoryID"" = @AssetCategoryID,
                ""AssetStatus_ID"" = @AssetStatus_ID, ""AssetMeasurement_ID"" = @AssetMeasurement_ID,
                ""RevaluationMethod"" = @RevaluationMethod
            WHERE ""AssetClass_ID"" = @id",
            new { model.AssetClassDesc, model.Enabled, model.Asset_SubCategory_ID, model.UsefulLifeInMonths,
                  model.AssetDepreciationMethod_ID, model.TypeID, model.AssetCategoryID,
                  model.AssetStatus_ID, model.AssetMeasurement_ID, model.RevaluationMethod, id });
        return rows == 0 ? NotFound(new { error = "Asset class not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var isDefault = await conn.ExecuteScalarAsync<int>(@"SELECT COALESCE(""Default"",0) FROM ""Const_AssetClass_sys"" WHERE ""AssetClass_ID"" = @id", new { id });
        if (isDefault == 1)
            return BadRequest(new { error = "Cannot delete a system/default Asset Class — system classes cannot be deleted." });
        var refs = await conn.ExecuteScalarAsync<int>(@"
            SELECT COUNT(1) FROM ""Asset_Register_Items"" WHERE ""AssetClass_ID"" = @id", new { id });
        if (refs > 0)
            return Conflict(new { error = "Cannot delete this Asset Class — it is referenced by existing asset register items." });
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_AssetClass_sys"" WHERE ""AssetClass_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Asset class not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT
                ac.""AssetClassDesc"",
                at.""AssetTypeDesc"",
                cat.""AssetCategoryDesc"",
                sub.""Asset_SubCategoryDescription"",
                mt.""Name"" AS ""MeasurementType"",
                st.""AssetStatusDesc"",
                ac.""UsefulLifeInMonths"",
                dm.""AssetDepreciationMethodDesc"",
                ac.""RevaluationByCostModel"",
                ac.""RevaluationByRevalutionModel""
            FROM ""Const_AssetClass_sys"" ac
            LEFT JOIN ""Const_AssetType_Sys"" at ON ac.""TypeID"" = at.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON ac.""AssetCategoryID"" = cat.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sub ON ac.""Asset_SubCategory_ID"" = sub.""Asset_SubCategory_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON ac.""AssetMeasurement_ID"" = mt.""AssetConfig_MeasurementType_ID""
            LEFT JOIN ""Const_AssetStatus_Sys"" st ON ac.""AssetStatus_ID"" = st.""AssetStatus_ID""
            LEFT JOIN ""Const_AssetDepreciationMethod_Sys"" dm ON ac.""AssetDepreciationMethod_ID"" = dm.""AssetDepreciationMethod_ID""
            ORDER BY ac.""AssetClassDesc""");

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
        ws.Cell(1, 9).Value = "Revaluation By Cost Model";
        ws.Cell(1, 10).Value = "Revaluation By Revaluation Model";
        ws.Row(1).Style.Font.Bold = true;

        int row = 2;
        foreach (var r in rows)
        {
            ws.Cell(row, 1).Value = (string?)r.AssetClassDesc ?? "";
            ws.Cell(row, 2).Value = (string?)r.AssetTypeDesc ?? "";
            ws.Cell(row, 3).Value = (string?)r.AssetCategoryDesc ?? "";
            ws.Cell(row, 4).Value = (string?)r.Asset_SubCategoryDescription ?? "";
            ws.Cell(row, 5).Value = (string?)r.MeasurementType ?? "";
            ws.Cell(row, 6).Value = (string?)r.AssetStatusDesc ?? "";
            ws.Cell(row, 7).Value = r.UsefulLifeInMonths != null ? (int)r.UsefulLifeInMonths : 0;
            ws.Cell(row, 8).Value = (string?)r.AssetDepreciationMethodDesc ?? "";
            ws.Cell(row, 9).Value = Convert.ToInt32(r.RevaluationByCostModel ?? 0) == 1 ? "Yes" : "No";
            ws.Cell(row, 10).Value = Convert.ToInt32(r.RevaluationByRevalutionModel ?? 0) == 1 ? "Yes" : "No";
            row++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "AssetClasses_Export.xlsx");
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
        ws.Cell(1, 9).Value = "Revaluation By Cost Model";
        ws.Cell(1, 10).Value = "Revaluation By Revaluation Model";
        ws.Cell(2, 1).Value = "HV switching station equipment - HV busbar indoor";
        ws.Cell(2, 2).Value = "Property, Plant and Equipment";
        ws.Cell(2, 3).Value = "Electrical Infrastructure";
        ws.Cell(2, 4).Value = "HV Switching Station";
        ws.Cell(2, 5).Value = "Cost Module";
        ws.Cell(2, 6).Value = "In Use";
        ws.Cell(2, 7).Value = 720;
        ws.Cell(2, 8).Value = "Straight Line";
        ws.Cell(2, 9).Value = "No";
        ws.Cell(2, 10).Value = "No";
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
        var seenClasses = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var rowNumMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

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
            var revalByCostRaw = ws.Cell(r, 9).GetString().Trim();
            var revalByRevalutionRaw = ws.Cell(r, 10).GetString().Trim();

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

            if (!string.IsNullOrEmpty(revalByCostRaw) && !string.Equals(revalByCostRaw, "yes", StringComparison.OrdinalIgnoreCase) && !string.Equals(revalByCostRaw, "no", StringComparison.OrdinalIgnoreCase))
                errors.Add(new ImportError { Row = r, Column = "Revaluation By Cost Model", Value = revalByCostRaw, Message = $"Invalid value '{revalByCostRaw}' in column 'Revaluation By Cost Model' — must be 'Yes', 'No', or blank" });

            if (!string.IsNullOrEmpty(revalByRevalutionRaw) && !string.Equals(revalByRevalutionRaw, "yes", StringComparison.OrdinalIgnoreCase) && !string.Equals(revalByRevalutionRaw, "no", StringComparison.OrdinalIgnoreCase))
                errors.Add(new ImportError { Row = r, Column = "Revaluation By Revaluation Model", Value = revalByRevalutionRaw, Message = $"Invalid value '{revalByRevalutionRaw}' in column 'Revaluation By Revaluation Model' — must be 'Yes', 'No', or blank" });

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

            if (!seenClasses.Add($"{classDesc}|{typeId}|{catId}|{subCatId}"))
            {
                errors.Add(new ImportError { Row = r, Column = "Asset Class", Value = classDesc, Message = $"Duplicate: 'Asset Class' value '{classDesc}' for this type/category/sub-category in file" });
                continue;
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
                RevaluationByCostModel = string.Equals(revalByCostRaw, "yes", StringComparison.OrdinalIgnoreCase) ? 1 : 0,
                RevaluationByRevalutionModel = string.Equals(revalByRevalutionRaw, "yes", StringComparison.OrdinalIgnoreCase) ? 1 : 0,
                Enabled = 1
            });
            rowNumMap[$"{classDesc}|{typeId}|{catId}|{subCatId}"] = r;
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var txn = await conn.BeginTransactionAsync();
        int inserted = 0, updated = 0, skipped = 0;
        foreach (var item in rowData)
        {
            var existingId = await conn.ExecuteScalarAsync<int?>(@"SELECT ""AssetClass_ID"" FROM ""Const_AssetClass_sys"" WHERE ""AssetClassDesc"" ILIKE @AssetClassDesc AND ""TypeID"" IS NOT DISTINCT FROM @TypeID AND ""AssetCategoryID"" IS NOT DISTINCT FROM @AssetCategoryID AND ""Asset_SubCategory_ID"" IS NOT DISTINCT FROM @Asset_SubCategory_ID", new { item.AssetClassDesc, item.TypeID, item.AssetCategoryID, item.Asset_SubCategory_ID }, txn);
            if (existingId.HasValue)
            {
                var isDefault = await conn.ExecuteScalarAsync<int>(@"SELECT COALESCE(""Default"",0) FROM ""Const_AssetClass_sys"" WHERE ""AssetClass_ID"" = @id", new { id = existingId.Value }, txn);
                if (isDefault == 1) { skipped++; continue; }
                await conn.ExecuteAsync(@"
                    UPDATE ""Const_AssetClass_sys"" SET
                        ""AssetMeasurement_ID"" = @AssetMeasurement_ID,
                        ""AssetStatus_ID"" = @AssetStatus_ID,
                        ""UsefulLifeInMonths"" = @UsefulLifeInMonths,
                        ""AssetDepreciationMethod_ID"" = @AssetDepreciationMethod_ID,
                        ""RevaluationByCostModel"" = @RevaluationByCostModel,
                        ""RevaluationByRevalutionModel"" = @RevaluationByRevalutionModel,
                        ""DateModified"" = GETDATE()
                    WHERE ""AssetClass_ID"" = @id",
                    new { item.AssetMeasurement_ID, item.AssetStatus_ID, item.UsefulLifeInMonths, item.AssetDepreciationMethod_ID, item.RevaluationByCostModel, item.RevaluationByRevalutionModel, id = existingId.Value }, txn);
                updated++;
            }
            else
            {
                await conn.ExecuteAsync(@"
                    INSERT INTO ""Const_AssetClass_sys"" (""AssetClassDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"",
                        ""Asset_SubCategory_ID"", ""UsefulLifeInMonths"", ""AssetDepreciationMethod_ID"",
                        ""TypeID"", ""AssetCategoryID"", ""AssetStatus_ID"", ""AssetMeasurement_ID"",
                        ""RevaluationByCostModel"", ""RevaluationByRevalutionModel"")
                    VALUES (@AssetClassDesc, @Enabled, GETDATE(), 1,
                        @Asset_SubCategory_ID, @UsefulLifeInMonths, @AssetDepreciationMethod_ID,
                        @TypeID, @AssetCategoryID, @AssetStatus_ID, @AssetMeasurement_ID,
                        @RevaluationByCostModel, @RevaluationByRevalutionModel)", item, txn);
                inserted++;
            }
        }
        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = inserted + updated, Inserted = inserted, Updated = updated, Skipped = skipped });
    }
}
