using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-fair-values")]
public class AssetFairValueController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetFairValueController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear, [FromQuery] int? assetRegisterItemId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""RegistrationItemFairValue_Id"" AS ""AssetFairValue_ID"", ""AssetRegisterItem_ID"", ""FairValueDate"", ""FairValue"" AS ""FairValueAmount"", ""PreviousCarryingAmount"", ""GainLoss"", ""Status"", ""FinYear"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"" FROM ""Asset_FairValue"" WHERE 1=1";
        if (!string.IsNullOrEmpty(finYear)) sql += @" AND ""FinYear"" = @finYear";
        if (assetRegisterItemId.HasValue) sql += @" AND ""AssetRegisterItem_ID"" = @assetRegisterItemId";
        sql += @" ORDER BY ""RegistrationItemFairValue_Id"" DESC";
        var items = await conn.QueryAsync<AssetFairValue>(sql, new { finYear, assetRegisterItemId });
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetFairValue>(@"SELECT ""RegistrationItemFairValue_Id"" AS ""AssetFairValue_ID"", ""AssetRegisterItem_ID"", ""FairValueDate"", ""FairValue"" AS ""FairValueAmount"", ""PreviousCarryingAmount"", ""GainLoss"", ""Status"", ""FinYear"", ""DateCaptured"", ""CapturerID"", ""DateModified"", ""ModifierID"" FROM ""Asset_FairValue"" WHERE ""RegistrationItemFairValue_Id"" = @id", new { id });
        return item is null ? NotFound(new { error = "Fair value record not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetFairValue model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_FairValue"" (""AssetRegisterItem_ID"", ""FairValueDate"", ""FairValue"", ""PreviousCarryingAmount"", ""GainLoss"", ""Status"", ""FinYear"", ""DateCaptured"", ""CapturerID"")
            VALUES (@AssetRegisterItem_ID, @FairValueDate, @FairValueAmount, @PreviousCarryingAmount, @GainLoss, @Status, @FinYear, GETDATE(), @CapturerID)
            RETURNING ""RegistrationItemFairValue_Id""", model);
        model.AssetFairValue_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetFairValue model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_FairValue""
            SET ""FairValueDate"" = @FairValueDate, ""FairValue"" = @FairValueAmount, ""PreviousCarryingAmount"" = @PreviousCarryingAmount,
                ""GainLoss"" = @GainLoss, ""Status"" = @Status, ""FinYear"" = @FinYear, ""DateModified"" = GETDATE(), ""ModifierID"" = @ModifierID
            WHERE ""RegistrationItemFairValue_Id"" = @id", new { model.FairValueDate, model.FairValueAmount, model.PreviousCarryingAmount, model.GainLoss, model.Status, model.FinYear, model.ModifierID, id });
        return rows == 0 ? NotFound(new { error = "Fair value record not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Asset_FairValue"" WHERE ""RegistrationItemFairValue_Id"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Fair value record not found" }) : Ok(new { success = 1 });
    }
}
