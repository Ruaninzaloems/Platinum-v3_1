using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/cidms-sub-component-types")]
public class CidmsSubComponentTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public CidmsSubComponentTypeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<CidmsSubComponentType>(@"SELECT * FROM ""Const_Asset_CIDMS_SubComponent_Type"" ORDER BY ""AssetCIDMSSubComponentTypeID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<CidmsSubComponentType>(@"SELECT * FROM ""Const_Asset_CIDMS_SubComponent_Type"" WHERE ""AssetCIDMSSubComponentTypeID"" = @id", new { id });
        return item is null ? NotFound(new { error = "CIDMS Sub Component Type not found" }) : Ok(item);
    }

    [HttpGet("{id:int}/chain")]
    public async Task<IActionResult> GetChain(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var chain = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT
                sc.""AssetCIDMSSubComponentTypeID""    AS ""cidmsSubComponentTypeId"",
                sc.""AssetCIDMSSubComponentTypeDesc""  AS ""cidmsSubComponentTypeDesc"",
                ct.""AssetCIDMSComponentTypeID""       AS ""cidmsComponentTypeId"",
                ct.""AssetCIDMSComponentTypeDesc""     AS ""cidmsComponentTypeDesc"",
                at2.""AssetCIDMSAssetTypeID""          AS ""cidmsAssetTypeId"",
                at2.""AssetCIDMSAssetTypeDesc""        AS ""cidmsAssetTypeDesc"",
                gt.""AssetCIDMSGroupTypeID""           AS ""cidmsGroupTypeId"",
                gt.""AssetCIDMSGroupTypeDesc""         AS ""cidmsGroupTypeDesc"",
                cl.""AssetCIDMSClassID""               AS ""cidmsClassId"",
                cl.""AssetCIDMSClassDesc""             AS ""cidmsClassDesc"",
                sg.""AssetAccountSubGroupID""          AS ""cidmsAccountingSubGroupId"",
                sg.""AssetAccountSubGroupDesc""        AS ""cidmsAccountingSubGroupDesc"",
                ag.""AssetAccountGroupID""             AS ""cidmsAccountingGroupId"",
                ag.""AssetAccountGroupDesc""           AS ""cidmsAccountingGroupDesc""
            FROM ""Const_Asset_CIDMS_SubComponent_Type"" sc
            LEFT JOIN ""Const_Asset_CIDMS_Component_Type"" ct ON ct.""AssetCIDMSComponentTypeID"" = sc.""AssetCIDMSComponentTypeID""
            LEFT JOIN ""Const_Asset_CIDMS_Asset_Type"" at2 ON at2.""AssetCIDMSAssetTypeID"" = ct.""AssetCIDMSAssetTypeID""
            LEFT JOIN ""Const_Asset_CIDMS_Group_Type"" gt ON gt.""AssetCIDMSGroupTypeID"" = at2.""AssetCIDMSGroupTypeID""
            LEFT JOIN ""Const_Asset_CIDMS_Class"" cl ON cl.""AssetCIDMSClassID"" = gt.""AssetCIDMSClassID""
            LEFT JOIN ""Const_Asset_CIDMS_Accounting_Sub_Group"" sg ON sg.""AssetAccountSubGroupID"" = cl.""AssetAccountSubGroupID""
            LEFT JOIN ""Const_Asset_CIDMS_Accounting_Group"" ag ON ag.""AssetAccountGroupID"" = sg.""AssetAccountGroupID""
            WHERE sc.""AssetCIDMSSubComponentTypeID"" = @id", new { id });
        if (chain is null) return NotFound(new { error = "CIDMS Sub Component Type not found" });
        return Ok(chain);
    }

    // Resolve descriptions for any combination of upper-level CIDMS IDs
    [HttpGet("resolve-upper")]
    public async Task<IActionResult> ResolveUpper(
        [FromQuery] int? componentTypeId,
        [FromQuery] int? accountingGroupId,
        [FromQuery] int? subAccountingGroupId,
        [FromQuery] int? classId,
        [FromQuery] int? groupTypeId,
        [FromQuery] int? assetTypeId,
        [FromQuery] int? subComponentTypeId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        async Task<string?> Desc(string table, string idCol, string descCol, int? id)
        {
            if (!id.HasValue || id.Value == 0) return null;
            try { return await conn.QuerySingleOrDefaultAsync<string>($@"SELECT ""{descCol}"" FROM ""{table}"" WHERE ""{idCol}"" = @id", new { id = id.Value }); }
            catch { return null; }
        }

        return Ok(new {
            cidmsSubComponentTypeId   = subComponentTypeId,
            cidmsSubComponentTypeDesc = await Desc("Const_Asset_CIDMS_SubComponent_Type",  "AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc", subComponentTypeId),
            cidmsComponentTypeId      = componentTypeId,
            cidmsComponentTypeDesc    = await Desc("Const_Asset_CIDMS_Component_Type",     "AssetCIDMSComponentTypeID",    "AssetCIDMSComponentTypeDesc",    componentTypeId),
            cidmsAssetTypeId          = assetTypeId,
            cidmsAssetTypeDesc        = await Desc("Const_Asset_CIDMS_Asset_Type",         "AssetCIDMSAssetTypeID",        "AssetCIDMSAssetTypeDesc",        assetTypeId),
            cidmsGroupTypeId          = groupTypeId,
            cidmsGroupTypeDesc        = await Desc("Const_Asset_CIDMS_Group_Type",         "AssetCIDMSGroupTypeID",        "AssetCIDMSGroupTypeDesc",        groupTypeId),
            cidmsClassId              = classId,
            cidmsClassDesc            = await Desc("Const_Asset_CIDMS_Class",              "AssetCIDMSClassID",            "AssetCIDMSClassDesc",            classId),
            cidmsAccountingSubGroupId = subAccountingGroupId,
            cidmsAccountingSubGroupDesc = await Desc("Const_Asset_CIDMS_Accounting_Sub_Group","AssetAccountSubGroupID",   "AssetAccountSubGroupDesc",       subAccountingGroupId),
            cidmsAccountingGroupId    = accountingGroupId,
            cidmsAccountingGroupDesc  = await Desc("Const_Asset_CIDMS_Accounting_Group",  "AssetAccountGroupID",          "AssetAccountGroupDesc",          accountingGroupId)
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CidmsSubComponentType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Asset_CIDMS_SubComponent_Type"" (""AssetCIDMSSubComponentTypeDesc"", ""AssetCIDMSComponentTypeID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"", ""Infrastructure"", ""Nature"")
            VALUES (@AssetCIDMSSubComponentTypeDesc, @AssetCIDMSComponentTypeID, @Enabled, GETDATE(), @CapturerID, @Default, @Infrastructure, @Nature)
            RETURNING ""AssetCIDMSSubComponentTypeID""", model);
        model.AssetCIDMSSubComponentTypeID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CidmsSubComponentType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_CIDMS_SubComponent_Type""
            SET ""AssetCIDMSSubComponentTypeDesc"" = @AssetCIDMSSubComponentTypeDesc, ""AssetCIDMSComponentTypeID"" = @AssetCIDMSComponentTypeID,
                ""Enabled"" = @Enabled, ""DateModified"" = GETDATE(), ""Infrastructure"" = @Infrastructure, ""Nature"" = @Nature
            WHERE ""AssetCIDMSSubComponentTypeID"" = @id", new { model.AssetCIDMSSubComponentTypeDesc, model.AssetCIDMSComponentTypeID, model.Enabled, model.Infrastructure, model.Nature, id });
        return rows == 0 ? NotFound(new { error = "CIDMS Sub Component Type not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Asset_CIDMS_SubComponent_Type"" WHERE ""AssetCIDMSSubComponentTypeID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "CIDMS Sub Component Type not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("CIDMS Sub Component Types");
        ws.Cell(1, 1).Value = "Sub Component Type";
        ws.Cell(1, 2).Value = "Component Type ID";
        ws.Cell(1, 3).Value = "Infrastructure";
        ws.Cell(1, 4).Value = "Nature";
        ws.Cell(2, 1).Value = "Sample Sub Component";
        ws.Cell(2, 2).Value = "1";
        ws.Cell(2, 3).Value = "0";
        ws.Cell(2, 4).Value = "0";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "CidmsSubComponentTypes_Template.xlsx");
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
        var rows = new List<(string desc, int componentTypeId, int infrastructure, int nature)>();

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var desc = ws.Cell(r, 1).GetString().Trim();
            var componentTypeIdStr = ws.Cell(r, 2).GetString().Trim();
            var infraStr = ws.Cell(r, 3).GetString().Trim();
            var natureStr = ws.Cell(r, 4).GetString().Trim();
            if (string.IsNullOrWhiteSpace(desc))
            {
                errors.Add(new ImportError { Row = r, Column = "Sub Component Type", Value = desc, Message = "Required field 'Sub Component Type' is empty" });
                continue;
            }
            if (!int.TryParse(componentTypeIdStr, out var componentTypeId))
            {
                errors.Add(new ImportError { Row = r, Column = "Component Type ID", Value = componentTypeIdStr, Message = "Invalid Component Type ID" });
                continue;
            }
            int.TryParse(infraStr, out var infrastructure);
            int.TryParse(natureStr, out var nature);
            rows.Add((desc, componentTypeId, infrastructure, nature));
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var (desc, componentTypeId, infrastructure, nature) in rows)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Const_Asset_CIDMS_SubComponent_Type"" (""AssetCIDMSSubComponentTypeDesc"", ""AssetCIDMSComponentTypeID"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""Default"", ""Infrastructure"", ""Nature"")
                VALUES (@desc, @componentTypeId, 1, GETDATE(), 1, 1, @infrastructure, @nature)", new { desc, componentTypeId, infrastructure, nature }, txn);
        }

        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rows.Count });
    }
}
