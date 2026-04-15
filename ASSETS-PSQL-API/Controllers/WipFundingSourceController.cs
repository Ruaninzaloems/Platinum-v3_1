using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/wip-funding-sources")]
public class WipFundingSourceController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public WipFundingSourceController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<WipFundingSource>(
            @"SELECT ""FundingSourceID"" AS ""WIPFundingSource_ID"", ""SourceDesc"" AS ""WIPFundingSourceDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"" FROM ""Const_Asset_WIPFundingSource"" ORDER BY ""FundingSourceID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<WipFundingSource>(
            @"SELECT ""FundingSourceID"" AS ""WIPFundingSource_ID"", ""SourceDesc"" AS ""WIPFundingSourceDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"" FROM ""Const_Asset_WIPFundingSource"" WHERE ""FundingSourceID"" = @id", new { id });
        return item is null ? NotFound(new { error = "WIP funding source not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] WipFundingSource model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_WIPFundingSource"" (""SourceDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
            VALUES (@WIPFundingSourceDesc, COALESCE(@Enabled, 1), NOW(), 1)
            RETURNING ""FundingSourceID""", model);
        model.WIPFundingSource_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] WipFundingSource model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_WIPFundingSource""
            SET ""SourceDesc"" = @WIPFundingSourceDesc, ""Enabled"" = @Enabled, ""DateModified"" = NOW()
            WHERE ""FundingSourceID"" = @id",
            new { model.WIPFundingSourceDesc, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "WIP funding source not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"DELETE FROM ""Const_Asset_WIPFundingSource"" WHERE ""FundingSourceID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "WIP funding source not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("WIP Funding Sources");
        ws.Cell(1, 1).Value = "Funding Source";
        ws.Cell(2, 1).Value = "Government Grant";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "WIPFundingSources_Template.xlsx");
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
        var rows = new List<string>();

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var val = ws.Cell(r, 1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Funding Source", Value = val, Message = "Required field is empty" });
                continue;
            }
            rows.Add(val);
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var val in rows)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_WIPFundingSource"" (""SourceDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
                VALUES (@val, 1, NOW(), 1)", new { val }, txn);
        }

        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rows.Count });
    }
}
