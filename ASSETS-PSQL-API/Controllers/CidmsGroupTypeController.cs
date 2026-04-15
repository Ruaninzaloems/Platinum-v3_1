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
        var rows = new List<(string desc, int classId)>();

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
            rows.Add((desc, classId));
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var (desc, classId) in rows)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_CIDMS_Group_Type"" (""AssetCIDMSGroupTypeDesc"", ""AssetCIDMSClassID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
                VALUES (@desc, @classId, 1, GETDATE(), 1, 1)", new { desc, classId }, txn);
        }

        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rows.Count });
    }
}
