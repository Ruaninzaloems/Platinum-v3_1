using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-impairment-postings")]
public class AssetImpairmentPostingController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetImpairmentPostingController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? assetImpairmentId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Id"" AS ""ImpairmentPosting_ID"", ""Impairment_ID"" AS ""AssetImpairment_ID"", ""Impairment_ID"", ""PostingDate"", ""PostedByID"", ""Status"", ""FairValueAmt"", ""CostToSell"", ""PresentValue"", ""ImpairmentLostAmt"", ""AmountFromRevaluationReserve"", ""Approved"", ""IsReversal"", ""Id"", ""DateCaptured"", ""CapturerID"" FROM ""Asset_ImpairmentPostings""";
        if (assetImpairmentId.HasValue) sql += @" WHERE ""Impairment_ID"" = @assetImpairmentId";
        sql += @" ORDER BY ""Id"" DESC";
        var items = await conn.QueryAsync<AssetImpairmentPosting>(sql, new { assetImpairmentId });
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetImpairmentPosting>(@"SELECT ""Id"" AS ""ImpairmentPosting_ID"", ""Impairment_ID"" AS ""AssetImpairment_ID"", ""Impairment_ID"", ""PostingDate"", ""PostedByID"", ""Status"", ""FairValueAmt"", ""CostToSell"", ""PresentValue"", ""ImpairmentLostAmt"", ""AmountFromRevaluationReserve"", ""Approved"", ""IsReversal"", ""Id"", ""DateCaptured"", ""CapturerID"" FROM ""Asset_ImpairmentPostings"" WHERE ""Id"" = @id", new { id });
        return item is null ? NotFound(new { error = "Impairment posting not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetImpairmentPosting model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_ImpairmentPostings"" (""Impairment_ID"", ""PostingDate"", ""PostedByID"", ""Status"",
                ""FairValueAmt"", ""CostToSell"", ""PresentValue"", ""ImpairmentLostAmt"", ""AmountFromRevaluationReserve"", ""IsReversal"", ""DateCaptured"", ""CapturerID"")
            VALUES (COALESCE(@Impairment_ID, @AssetImpairment_ID), @PostingDate, @PostedByID, @Status,
                @FairValueAmt, @CostToSell, @PresentValue, @ImpairmentLostAmt, @AmountFromRevaluationReserve, COALESCE(@IsReversal, 0), GETDATE(), @CapturerID)
            RETURNING ""Id""", model);
        model.ImpairmentPosting_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetImpairmentPosting model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_ImpairmentPostings""
            SET ""PostingDate"" = @PostingDate, ""PostedByID"" = @PostedByID, ""Status"" = @Status
            WHERE ""Id"" = @id", new { model.PostingDate, model.PostedByID, model.Status, id });
        return rows == 0 ? NotFound(new { error = "Impairment posting not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Asset_ImpairmentPostings"" WHERE ""Id"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Impairment posting not found" }) : Ok(new { success = 1 });
    }
}
