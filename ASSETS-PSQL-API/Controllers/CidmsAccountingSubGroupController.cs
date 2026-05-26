using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/cidms-accounting-sub-groups")]
public class CidmsAccountingSubGroupController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public CidmsAccountingSubGroupController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<CidmsAccountingSubGroup>(@"SELECT * FROM ""Const_Asset_CIDMS_Accounting_Sub_Group"" ORDER BY ""AssetAccountSubGroupID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<CidmsAccountingSubGroup>(@"SELECT * FROM ""Const_Asset_CIDMS_Accounting_Sub_Group"" WHERE ""AssetAccountSubGroupID"" = @id", new { id });
        return item is null ? NotFound(new { error = "CIDMS Accounting Sub Group not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CidmsAccountingSubGroup model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Accounting_Sub_Group"" WHERE ""AssetAccountSubGroupDesc"" ILIKE @AssetAccountSubGroupDesc AND ""AssetAccountGroupID"" = @AssetAccountGroupID", new { model.AssetAccountSubGroupDesc, model.AssetAccountGroupID }) > 0;
        if (dup) return Conflict(new { error = $"CIDMS accounting sub-group '{model.AssetAccountSubGroupDesc}' already exists under this accounting group" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_CIDMS_Accounting_Sub_Group"" (""AssetAccountSubGroupDesc"", ""AssetAccountGroupID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
            VALUES (@AssetAccountSubGroupDesc, @AssetAccountGroupID, @Enabled, GETDATE(), @CapturerID, @Default)
            RETURNING ""AssetAccountSubGroupID""", model);
        model.AssetAccountSubGroupID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CidmsAccountingSubGroup model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Accounting_Sub_Group"" WHERE ""AssetAccountSubGroupDesc"" ILIKE @AssetAccountSubGroupDesc AND ""AssetAccountGroupID"" = @AssetAccountGroupID AND ""AssetAccountSubGroupID"" <> @id", new { model.AssetAccountSubGroupDesc, model.AssetAccountGroupID, id }) > 0;
        if (dup) return Conflict(new { error = $"CIDMS accounting sub-group '{model.AssetAccountSubGroupDesc}' already exists under this accounting group" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_CIDMS_Accounting_Sub_Group""
            SET ""AssetAccountSubGroupDesc"" = @AssetAccountSubGroupDesc, ""AssetAccountGroupID"" = @AssetAccountGroupID,
                ""Enabled"" = @Enabled, ""DateModified"" = GETDATE()
            WHERE ""AssetAccountSubGroupID"" = @id", new { model.AssetAccountSubGroupDesc, model.AssetAccountGroupID, model.Enabled, id });
        return rows == 0 ? NotFound(new { error = "CIDMS Accounting Sub Group not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_CIDMS_Accounting_Sub_Group"" WHERE ""AssetAccountSubGroupID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "CIDMS Accounting Sub Group not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT sg.""AssetAccountSubGroupID"" AS ""sgid"",
                   ag.""AssetAccountGroupDesc"" AS ""groupdesc"",
                   sg.""AssetAccountSubGroupDesc"" AS ""sgdesc"",
                   sg.""Enabled"" AS ""enabled""
            FROM ""Const_Asset_CIDMS_Accounting_Sub_Group"" sg
            LEFT JOIN ""Const_Asset_CIDMS_Accounting_Group"" ag ON ag.""AssetAccountGroupID"" = sg.""AssetAccountGroupID""
            ORDER BY sg.""AssetAccountSubGroupID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("CIDMS Accounting Sub Groups");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Accounting Group";
        ws.Cell(1, 3).Value = "Sub Group Description";
        ws.Cell(1, 4).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.sgid;
            ws.Cell(r, 2).Value = (string?)row.groupdesc ?? "";
            ws.Cell(r, 3).Value = (string?)row.sgdesc ?? "";
            ws.Cell(r, 4).Value = (int)row.enabled == 1 ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CIDMSAccountingSubGroups_Export.xlsx");
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("CIDMS Accounting Sub Groups");
        ws.Cell(1, 1).Value = "Accounting Sub Group";
        ws.Cell(1, 2).Value = "Accounting Group ID";
        ws.Cell(2, 1).Value = "Sample Sub Group";
        ws.Cell(2, 2).Value = "1";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CidmsAccountingSubGroups_Template.xlsx");
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
        var rows = new List<(string desc, int groupId)>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var desc = ws.Cell(r, 1).GetString().Trim();
            var groupIdStr = ws.Cell(r, 2).GetString().Trim();
            if (string.IsNullOrWhiteSpace(desc))
            {
                errors.Add(new ImportError { Row = r, Column = "Accounting Sub Group", Value = desc, Message = "Required field 'Accounting Sub Group' is empty" });
                continue;
            }
            if (!int.TryParse(groupIdStr, out var groupId))
            {
                errors.Add(new ImportError { Row = r, Column = "Accounting Group ID", Value = groupIdStr, Message = "Invalid Accounting Group ID" });
                continue;
            }
            if (!seen.Add($"{desc}|{groupId}"))
            {
                errors.Add(new ImportError { Row = r, Column = "Accounting Sub Group", Value = desc, Message = $"Duplicate: 'Accounting Sub Group' value '{desc}' for this group in file" });
                continue;
            }
            rows.Add((desc, groupId));
            rowNums[desc] = r;
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dbErrors = new List<ImportError>();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var (desc, groupId) in rows)
        {
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_Asset_CIDMS_Accounting_Sub_Group"" WHERE ""AssetAccountSubGroupDesc"" ILIKE @desc AND ""AssetAccountGroupID"" = @groupId", new { desc, groupId }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(desc, out var rn) ? rn : 0, Column = "Accounting Sub Group", Value = desc, Message = $"Duplicate: '{desc}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_CIDMS_Accounting_Sub_Group"" (""AssetAccountSubGroupDesc"", ""AssetAccountGroupID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"")
                VALUES (@desc, @groupId, 1, GETDATE(), 1, 1)", new { desc, groupId }, txn);
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
