using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/scm-unbundling-headers")]
public class ScmUnbundlingHeaderController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public ScmUnbundlingHeaderController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""SCM_AssetUnbundling_Header"" ORDER BY ""AssetContractHeader_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""SCM_AssetUnbundling_Header"" WHERE ""AssetContractHeader_ID"" = @id", new { id });
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> body)
    {
        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            var p = new DynamicParameters();
            p.Add("ContractID", body.GetValueOrDefault("ContractID") ?? body.GetValueOrDefault("contractId"));
            p.Add("AssetParentID", body.GetValueOrDefault("AssetParentID") ?? body.GetValueOrDefault("assetParentId"));
            p.Add("VendorID", body.GetValueOrDefault("VendorID") ?? body.GetValueOrDefault("vendorId"));
            p.Add("Enabled", body.GetValueOrDefault("Enabled") ?? body.GetValueOrDefault("enabled") ?? 1);
            p.Add("Complete", body.GetValueOrDefault("Complete") ?? body.GetValueOrDefault("complete") ?? 0);
            var id = await conn.ExecuteScalarAsync<int>(@"
                INSERT INTO ""SCM_AssetUnbundling_Header"" (""ContractID"", ""AssetParentID"", ""VendorID"", ""Enabled"", ""Complete"", ""DateCaptured"", ""CapturerID"")
                VALUES (@ContractID, @AssetParentID, @VendorID, @Enabled, @Complete, NOW(), 1)
                RETURNING ""AssetContractHeader_ID""", p);
            return CreatedAtAction(nameof(GetById), new { id }, new { id });
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> body)
    {
        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            var p = new DynamicParameters();
            p.Add("id", id);
            p.Add("ContractID", body.GetValueOrDefault("ContractID") ?? body.GetValueOrDefault("contractId"));
            p.Add("AssetParentID", body.GetValueOrDefault("AssetParentID") ?? body.GetValueOrDefault("assetParentId"));
            p.Add("VendorID", body.GetValueOrDefault("VendorID") ?? body.GetValueOrDefault("vendorId"));
            p.Add("Enabled", body.GetValueOrDefault("Enabled") ?? body.GetValueOrDefault("enabled") ?? 1);
            p.Add("Complete", body.GetValueOrDefault("Complete") ?? body.GetValueOrDefault("complete") ?? 0);
            var rows = await conn.ExecuteAsync(@"
                UPDATE ""SCM_AssetUnbundling_Header""
                SET ""ContractID"" = @ContractID, ""AssetParentID"" = @AssetParentID, ""VendorID"" = @VendorID,
                    ""Enabled"" = @Enabled, ""Complete"" = @Complete, ""DateModified"" = NOW(), ""ModifierID"" = 1
                WHERE ""AssetContractHeader_ID"" = @id", p);
            return rows == 0 ? NotFound() : NoContent();
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            var rows = await conn.ExecuteAsync(
                @"DELETE FROM ""SCM_AssetUnbundling_Header"" WHERE ""AssetContractHeader_ID"" = @id", new { id });
            return rows == 0 ? NotFound() : NoContent();
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet("by-contract")]
    public async Task<IActionResult> GetByContract([FromQuery] int contractId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            @"SELECT * FROM ""SCM_AssetUnbundling_Header"" WHERE ""ContractID"" = @contractId ORDER BY ""AssetContractHeader_ID""",
            new { contractId });
        return Ok(items);
    }
}
