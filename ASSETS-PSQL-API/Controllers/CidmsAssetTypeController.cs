using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/cidms-asset-types")]
public class CidmsAssetTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public CidmsAssetTypeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<CidmsAssetType>(@"SELECT * FROM ""Const_Asset_CIDMS_Asset_Type"" ORDER BY ""AssetCIDMSAssetTypeID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<CidmsAssetType>(@"SELECT * FROM ""Const_Asset_CIDMS_Asset_Type"" WHERE ""AssetCIDMSAssetTypeID"" = @id", new { id });
        return item is null ? NotFound(new { error = "CIDMS Asset Type not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CidmsAssetType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Asset_Type"" WHERE ""AssetCIDMSAssetTypeDesc"" ILIKE @AssetCIDMSAssetTypeDesc AND ""AssetCIDMSGroupTypeID"" = @AssetCIDMSGroupTypeID", new { model.AssetCIDMSAssetTypeDesc, model.AssetCIDMSGroupTypeID }) > 0;
        if (dup) return Conflict(new { error = $"CIDMS asset type '{model.AssetCIDMSAssetTypeDesc}' already exists under this group type" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_CIDMS_Asset_Type"" (""AssetCIDMSAssetTypeDesc"", ""AssetCIDMSGroupTypeID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
            VALUES (@AssetCIDMSAssetTypeDesc, @AssetCIDMSGroupTypeID, @Enabled, GETDATE(), @CapturerID, @Default)
            RETURNING ""AssetCIDMSAssetTypeID""", model);
        model.AssetCIDMSAssetTypeID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CidmsAssetType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Asset_Type"" WHERE ""AssetCIDMSAssetTypeDesc"" ILIKE @AssetCIDMSAssetTypeDesc AND ""AssetCIDMSGroupTypeID"" = @AssetCIDMSGroupTypeID AND ""AssetCIDMSAssetTypeID"" <> @id", new { model.AssetCIDMSAssetTypeDesc, model.AssetCIDMSGroupTypeID, id }) > 0;
        if (dup) return Conflict(new { error = $"CIDMS asset type '{model.AssetCIDMSAssetTypeDesc}' already exists under this group type" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_CIDMS_Asset_Type""
            SET ""AssetCIDMSAssetTypeDesc"" = @AssetCIDMSAssetTypeDesc, ""AssetCIDMSGroupTypeID"" = @AssetCIDMSGroupTypeID,
                ""Enabled"" = @Enabled, ""DateModified"" = GETDATE()
            WHERE ""AssetCIDMSAssetTypeID"" = @id", new { model.AssetCIDMSAssetTypeDesc, model.AssetCIDMSGroupTypeID, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "CIDMS Asset Type not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_CIDMS_Asset_Type"" WHERE ""AssetCIDMSAssetTypeID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "CIDMS Asset Type not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT at2.""AssetCIDMSAssetTypeID"" AS ""atid"",
                   gt.""AssetCIDMSGroupTypeDesc"" AS ""gtdesc"",
                   at2.""AssetCIDMSAssetTypeDesc"" AS ""atdesc"",
                   at2.""Enabled"" AS ""enabled""
            FROM ""Const_Asset_CIDMS_Asset_Type"" at2
            LEFT JOIN ""Const_Asset_CIDMS_Group_Type"" gt ON gt.""AssetCIDMSGroupTypeID"" = at2.""AssetCIDMSGroupTypeID""
            ORDER BY at2.""AssetCIDMSAssetTypeID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("CIDMS Asset Types");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Group Type";
        ws.Cell(1, 3).Value = "CIDMS Asset Type Description";
        ws.Cell(1, 4).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.atid;
            ws.Cell(r, 2).Value = (string?)row.gtdesc ?? "";
            ws.Cell(r, 3).Value = (string?)row.atdesc ?? "";
            ws.Cell(r, 4).Value = (int)row.enabled == 1 ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CIDMSAssetTypes_Export.xlsx");
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("CIDMS Asset Types");
        ws.Cell(1, 1).Value = "CIDMS Asset Type";
        ws.Cell(1, 2).Value = "Group Type ID";
        ws.Cell(2, 1).Value = "Sample Asset Type";
        ws.Cell(2, 2).Value = "1";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CidmsAssetTypes_Template.xlsx");
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
        var rows = new List<(string desc, int groupTypeId)>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var desc = ws.Cell(r, 1).GetString().Trim();
            var groupTypeIdStr = ws.Cell(r, 2).GetString().Trim();
            if (string.IsNullOrWhiteSpace(desc))
            {
                errors.Add(new ImportError { Row = r, Column = "CIDMS Asset Type", Value = desc, Message = "Required field 'CIDMS Asset Type' is empty" });
                continue;
            }
            if (!int.TryParse(groupTypeIdStr, out var groupTypeId))
            {
                errors.Add(new ImportError { Row = r, Column = "Group Type ID", Value = groupTypeIdStr, Message = "Invalid Group Type ID" });
                continue;
            }
            if (!seen.Add($"{desc}|{groupTypeId}"))
            {
                errors.Add(new ImportError { Row = r, Column = "CIDMS Asset Type", Value = desc, Message = $"Duplicate: 'CIDMS Asset Type' value '{desc}' for this group type in file" });
                continue;
            }
            rows.Add((desc, groupTypeId));
            rowNums[desc] = r;
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dbErrors = new List<ImportError>();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var (desc, groupTypeId) in rows)
        {
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Asset_Type"" WHERE ""AssetCIDMSAssetTypeDesc"" ILIKE @desc AND ""AssetCIDMSGroupTypeID"" = @groupTypeId", new { desc, groupTypeId }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(desc, out var rn) ? rn : 0, Column = "CIDMS Asset Type", Value = desc, Message = $"Duplicate: '{desc}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_CIDMS_Asset_Type"" (""AssetCIDMSAssetTypeDesc"", ""AssetCIDMSGroupTypeID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
                VALUES (@desc, @groupTypeId, 1, GETDATE(), 1, 1)", new { desc, groupTypeId }, txn);
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
