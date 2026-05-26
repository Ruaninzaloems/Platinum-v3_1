using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/const-funding-sources")]
public class ConstFundingSourceController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public ConstFundingSourceController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        string sql;
        var p = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(finYear))
        {
            sql = @"SELECT ""FundingSource_ID"" AS ""fundingSourceId"",
                           ""FundingSourceDesc"" AS ""fundingSourceDesc"",
                           ""Enabled"" AS ""enabled"",
                           ""DateCaptured"" AS ""dateCaptured"",
                           ""FinYear"" AS ""finYear"",
                           ""PreviousReferenceId"" AS ""previousReferenceId""
                    FROM ""Const_FundingSource""
                    WHERE ""FinYear"" = @finYear
                    ORDER BY ""FundingSourceDesc""";
            p.Add("finYear", finYear);
        }
        else
        {
            sql = @"SELECT DISTINCT ON (""FundingSourceDesc"")
                           ""FundingSource_ID"" AS ""fundingSourceId"",
                           ""FundingSourceDesc"" AS ""fundingSourceDesc"",
                           ""Enabled"" AS ""enabled"",
                           ""DateCaptured"" AS ""dateCaptured"",
                           ""FinYear"" AS ""finYear"",
                           ""PreviousReferenceId"" AS ""previousReferenceId""
                    FROM ""Const_FundingSource""
                    ORDER BY ""FundingSourceDesc"", ""FundingSource_ID"" DESC";
        }
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""FundingSource_ID"" AS ""fundingSourceId"", ""FundingSourceDesc"" AS ""fundingSourceDesc"",
                     ""Enabled"" AS ""enabled"", ""DateCaptured"" AS ""dateCaptured"", ""FinYear"" AS ""finYear"",
                     ""PreviousReferenceId"" AS ""previousReferenceId""
              FROM ""Const_FundingSource"" WHERE ""FundingSource_ID"" = @id", new { id });
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ConstFundingSourceModel model)
    {
        if (string.IsNullOrWhiteSpace(model.FundingSourceDesc))
            return BadRequest(new { error = "Funding source description is required" });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_FundingSource"" WHERE ""FundingSourceDesc"" ILIKE @FundingSourceDesc", new { model.FundingSourceDesc }) > 0;
        if (dup) return Conflict(new { error = $"Funding source '{model.FundingSourceDesc}' already exists" });
        var id = await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO ""Const_FundingSource"" (""FundingSourceDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"", ""FinYear"", ""PreviousReferenceId"")
              VALUES (@FundingSourceDesc, @Enabled, NOW(), 1, @FinYear, @PreviousReferenceId)
              RETURNING ""FundingSource_ID""", model);
        return Ok(new { fundingSourceId = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ConstFundingSourceModel model)
    {
        if (string.IsNullOrWhiteSpace(model.FundingSourceDesc))
            return BadRequest(new { error = "Funding source description is required" });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""Const_FundingSource"" WHERE ""FundingSourceDesc"" ILIKE @FundingSourceDesc AND ""FundingSource_ID"" <> @id", new { model.FundingSourceDesc, id }) > 0;
        if (dup) return Conflict(new { error = $"Funding source '{model.FundingSourceDesc}' already exists" });
        var rows = await conn.ExecuteAsync(
            @"UPDATE ""Const_FundingSource""
              SET ""FundingSourceDesc"" = @FundingSourceDesc,
                  ""Enabled""           = @Enabled,
                  ""FinYear""           = @FinYear,
                  ""DateModified""      = NOW(),
                  ""ModifierID""        = 1
              WHERE ""FundingSource_ID"" = @id",
            new { model.FundingSourceDesc, model.Enabled, model.FinYear, id });
        if (rows == 0) return NotFound();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"DELETE FROM ""Const_FundingSource"" WHERE ""FundingSource_ID"" = @id", new { id });
        if (rows == 0) return NotFound();
        return Ok();
    }
}

public class ConstFundingSourceModel
{
    public string FundingSourceDesc { get; set; } = "";
    public int Enabled { get; set; } = 1;
    public string? FinYear { get; set; }
    public int? PreviousReferenceId { get; set; }
}
