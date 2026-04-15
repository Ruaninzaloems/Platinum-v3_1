using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-fair-value-approvals")]
public class AssetFairValueApprovalController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetFairValueApprovalController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? assetFairValueId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Asset_FairValueApproval_ID"" AS ""FairValueApproval_ID"", ""RegistrationItemFairValue_Id"" AS ""AssetFairValue_ID"", ""ApprovalDate"", ""ApprovedByID"", ""Status"", ""Comments"", ""DateCaptured"", ""CapturerID"" FROM ""Asset_FairValueApproval""";
        if (assetFairValueId.HasValue) sql += @" WHERE ""RegistrationItemFairValue_Id"" = @assetFairValueId";
        sql += @" ORDER BY ""Asset_FairValueApproval_ID"" DESC";
        var items = await conn.QueryAsync<AssetFairValueApproval>(sql, new { assetFairValueId });
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetFairValueApproval>(@"SELECT ""Asset_FairValueApproval_ID"" AS ""FairValueApproval_ID"", ""RegistrationItemFairValue_Id"" AS ""AssetFairValue_ID"", ""ApprovalDate"", ""ApprovedByID"", ""Status"", ""Comments"", ""DateCaptured"", ""CapturerID"" FROM ""Asset_FairValueApproval"" WHERE ""Asset_FairValueApproval_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Fair value approval not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetFairValueApproval model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_FairValueApproval"" (""RegistrationItemFairValue_Id"", ""ApprovalDate"", ""ApprovedByID"", ""Status"", ""Comments"", ""DateCaptured"", ""CapturerID"")
            VALUES (@AssetFairValue_ID, @ApprovalDate, @ApprovedByID, @Status, @Comments, GETDATE(), @CapturerID)
            RETURNING ""Asset_FairValueApproval_ID""", model);
        model.FairValueApproval_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetFairValueApproval model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_FairValueApproval""
            SET ""ApprovalDate"" = @ApprovalDate, ""ApprovedByID"" = @ApprovedByID, ""Status"" = @Status, ""Comments"" = @Comments
            WHERE ""Asset_FairValueApproval_ID"" = @id", new { model.ApprovalDate, model.ApprovedByID, model.Status, model.Comments, id });
        return rows == 0 ? NotFound(new { error = "Fair value approval not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Asset_FairValueApproval"" WHERE ""Asset_FairValueApproval_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Fair value approval not found" }) : Ok(new { success = 1 });
    }
}
