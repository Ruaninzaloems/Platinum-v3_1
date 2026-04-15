using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/cidms-classes")]
public class CidmsClassController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public CidmsClassController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<CidmsClass>(@"SELECT * FROM ""Const_Asset_CIDMS_Class"" ORDER BY ""AssetCIDMSClassID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<CidmsClass>(@"SELECT * FROM ""Const_Asset_CIDMS_Class"" WHERE ""AssetCIDMSClassID"" = @id", new { id });
        return item is null ? NotFound(new { error = "CIDMS Class not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CidmsClass model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_CIDMS_Class"" (""AssetCIDMSClassDesc"", ""AssetAccountSubGroupID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
            VALUES (@AssetCIDMSClassDesc, @AssetAccountSubGroupID, @Enabled, GETDATE(), @CapturerID, @Default)
            RETURNING ""AssetCIDMSClassID""", model);
        model.AssetCIDMSClassID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CidmsClass model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_CIDMS_Class""
            SET ""AssetCIDMSClassDesc"" = @AssetCIDMSClassDesc, ""AssetAccountSubGroupID"" = @AssetAccountSubGroupID,
                ""Enabled"" = @Enabled, ""DateModified"" = GETDATE()
            WHERE ""AssetCIDMSClassID"" = @id", new { model.AssetCIDMSClassDesc, model.AssetAccountSubGroupID, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "CIDMS Class not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_CIDMS_Class"" WHERE ""AssetCIDMSClassID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "CIDMS Class not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("CIDMS Classes");
        ws.Cell(1, 1).Value = "CIDMS Class";
        ws.Cell(1, 2).Value = "Accounting Sub Group ID";
        ws.Cell(2, 1).Value = "Sample Class";
        ws.Cell(2, 2).Value = "1";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CidmsClasses_Template.xlsx");
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
        var rows = new List<(string desc, int subGroupId)>();

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var desc = ws.Cell(r, 1).GetString().Trim();
            var subGroupIdStr = ws.Cell(r, 2).GetString().Trim();
            if (string.IsNullOrWhiteSpace(desc))
            {
                errors.Add(new ImportError { Row = r, Column = "CIDMS Class", Value = desc, Message = "Required field 'CIDMS Class' is empty" });
                continue;
            }
            if (!int.TryParse(subGroupIdStr, out var subGroupId))
            {
                errors.Add(new ImportError { Row = r, Column = "Accounting Sub Group ID", Value = subGroupIdStr, Message = "Invalid Accounting Sub Group ID" });
                continue;
            }
            rows.Add((desc, subGroupId));
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var (desc, subGroupId) in rows)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_CIDMS_Class"" (""AssetCIDMSClassDesc"", ""AssetAccountSubGroupID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
                VALUES (@desc, @subGroupId, 1, GETDATE(), 1, 1)", new { desc, subGroupId }, txn);
        }

        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rows.Count });
    }
}
