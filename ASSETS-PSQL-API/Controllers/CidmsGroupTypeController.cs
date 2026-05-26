using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/cidms-group-types")]
public class CidmsGroupTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public CidmsGroupTypeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<CidmsGroupType>(@"SELECT * FROM ""Const_Asset_CIDMS_Group_Type"" ORDER BY ""AssetCIDMSGroupTypeID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<CidmsGroupType>(@"SELECT * FROM ""Const_Asset_CIDMS_Group_Type"" WHERE ""AssetCIDMSGroupTypeID"" = @id", new { id });
        return item is null ? NotFound(new { error = "CIDMS Group Type not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CidmsGroupType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Group_Type"" WHERE ""AssetCIDMSGroupTypeDesc"" ILIKE @AssetCIDMSGroupTypeDesc AND ""AssetCIDMSClassID"" = @AssetCIDMSClassID", new { model.AssetCIDMSGroupTypeDesc, model.AssetCIDMSClassID }) > 0;
        if (dup) return Conflict(new { error = $"CIDMS group type '{model.AssetCIDMSGroupTypeDesc}' already exists under this class" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_CIDMS_Group_Type"" (""AssetCIDMSGroupTypeDesc"", ""AssetCIDMSClassID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
            VALUES (@AssetCIDMSGroupTypeDesc, @AssetCIDMSClassID, @Enabled, GETDATE(), @CapturerID, @Default)
            RETURNING ""AssetCIDMSGroupTypeID""", model);
        model.AssetCIDMSGroupTypeID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CidmsGroupType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Group_Type"" WHERE ""AssetCIDMSGroupTypeDesc"" ILIKE @AssetCIDMSGroupTypeDesc AND ""AssetCIDMSClassID"" = @AssetCIDMSClassID AND ""AssetCIDMSGroupTypeID"" <> @id", new { model.AssetCIDMSGroupTypeDesc, model.AssetCIDMSClassID, id }) > 0;
        if (dup) return Conflict(new { error = $"CIDMS group type '{model.AssetCIDMSGroupTypeDesc}' already exists under this class" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_CIDMS_Group_Type""
            SET ""AssetCIDMSGroupTypeDesc"" = @AssetCIDMSGroupTypeDesc, ""AssetCIDMSClassID"" = @AssetCIDMSClassID,
                ""Enabled"" = @Enabled, ""DateModified"" = GETDATE()
            WHERE ""AssetCIDMSGroupTypeID"" = @id", new { model.AssetCIDMSGroupTypeDesc, model.AssetCIDMSClassID, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "CIDMS Group Type not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_CIDMS_Group_Type"" WHERE ""AssetCIDMSGroupTypeID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "CIDMS Group Type not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT gt.""AssetCIDMSGroupTypeID"" AS ""gtid"",
                   cl.""AssetCIDMSClassDesc"" AS ""cldesc"",
                   gt.""AssetCIDMSGroupTypeDesc"" AS ""gtdesc"",
                   gt.""Enabled"" AS ""enabled""
            FROM ""Const_Asset_CIDMS_Group_Type"" gt
            LEFT JOIN ""Const_Asset_CIDMS_Class"" cl ON cl.""AssetCIDMSClassID"" = gt.""AssetCIDMSClassID""
            ORDER BY gt.""AssetCIDMSGroupTypeID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("CIDMS Group Types");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "CIDMS Class";
        ws.Cell(1, 3).Value = "Group Type Description";
        ws.Cell(1, 4).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.gtid;
            ws.Cell(r, 2).Value = (string?)row.cldesc ?? "";
            ws.Cell(r, 3).Value = (string?)row.gtdesc ?? "";
            ws.Cell(r, 4).Value = (int)row.enabled == 1 ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CIDMSGroupTypes_Export.xlsx");
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("CIDMS Group Types");
        ws.Cell(1, 1).Value = "Group Type";
        ws.Cell(1, 2).Value = "CIDMS Class ID";
        ws.Cell(2, 1).Value = "Sample Group Type";
        ws.Cell(2, 2).Value = "1";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CidmsGroupTypes_Template.xlsx");
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
        var rows = new List<(string desc, int classId)>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var desc = ws.Cell(r, 1).GetString().Trim();
            var classIdStr = ws.Cell(r, 2).GetString().Trim();
            if (string.IsNullOrWhiteSpace(desc))
            {
                errors.Add(new ImportError { Row = r, Column = "Group Type", Value = desc, Message = "Required field 'Group Type' is empty" });
                continue;
            }
            if (!int.TryParse(classIdStr, out var classId))
            {
                errors.Add(new ImportError { Row = r, Column = "CIDMS Class ID", Value = classIdStr, Message = "Invalid CIDMS Class ID" });
                continue;
            }
            if (!seen.Add($"{desc}|{classId}"))
            {
                errors.Add(new ImportError { Row = r, Column = "Group Type", Value = desc, Message = $"Duplicate: 'Group Type' value '{desc}' for this class in file" });
                continue;
            }
            rows.Add((desc, classId));
            rowNums[desc] = r;
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dbErrors = new List<ImportError>();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var (desc, classId) in rows)
        {
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Group_Type"" WHERE ""AssetCIDMSGroupTypeDesc"" ILIKE @desc AND ""AssetCIDMSClassID"" = @classId", new { desc, classId }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(desc, out var rn) ? rn : 0, Column = "CIDMS Group Type", Value = desc, Message = $"Duplicate: '{desc}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_CIDMS_Group_Type"" (""AssetCIDMSGroupTypeDesc"", ""AssetCIDMSClassID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
                VALUES (@desc, @classId, 1, GETDATE(), 1, 1)", new { desc, classId }, txn);
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
