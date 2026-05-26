using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Helpers;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/scm-contract-detail-items")]
public class ScmContractDetailItemsController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public ScmContractDetailItemsController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""SCM_ContractDetailItems"" ORDER BY ""ContractDetailItems_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""SCM_ContractDetailItems"" WHERE ""ContractDetailItems_ID"" = @id", new { id });
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
            p.Add("Cost", body.GetValueOrDefault("Cost") ?? body.GetValueOrDefault("cost"));
            p.Add("VatAmount", body.GetValueOrDefault("VatAmount") ?? body.GetValueOrDefault("vatAmount"));
            p.Add("TotalAmount", body.GetValueOrDefault("TotalAmount") ?? body.GetValueOrDefault("totalAmount"));
            p.Add("BillOfQuantityID", body.GetValueOrDefault("BillOfQuantityID") ?? body.GetValueOrDefault("billOfQuantityId"));
            p.Add("Enabled", body.GetValueOrDefault("Enabled") ?? body.GetValueOrDefault("enabled") ?? 1);
            var id = await conn.ExecuteScalarAsync<int>(@"
                INSERT INTO ""SCM_ContractDetailItems"" (""ContractID"", ""Cost"", ""VatAmount"", ""TotalAmount"", ""BillOfQuantityID"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
                VALUES (@ContractID, @Cost, @VatAmount, @TotalAmount, @BillOfQuantityID, @Enabled, NOW(), 1)
                RETURNING ""ContractDetailItems_ID""", p);
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
            p.Add("Cost", body.GetValueOrDefault("Cost") ?? body.GetValueOrDefault("cost"));
            p.Add("VatAmount", body.GetValueOrDefault("VatAmount") ?? body.GetValueOrDefault("vatAmount"));
            p.Add("TotalAmount", body.GetValueOrDefault("TotalAmount") ?? body.GetValueOrDefault("totalAmount"));
            p.Add("BillOfQuantityID", body.GetValueOrDefault("BillOfQuantityID") ?? body.GetValueOrDefault("billOfQuantityId"));
            p.Add("Enabled", body.GetValueOrDefault("Enabled") ?? body.GetValueOrDefault("enabled") ?? 1);
            p.Add("ModifierID", this.GetCapturerId());
            var rows = await conn.ExecuteAsync(@"
                UPDATE ""SCM_ContractDetailItems""
                SET ""ContractID"" = @ContractID, ""Cost"" = @Cost, ""VatAmount"" = @VatAmount,
                    ""TotalAmount"" = @TotalAmount, ""BillOfQuantityID"" = @BillOfQuantityID,
                    ""Enabled"" = @Enabled, ""DateModified"" = NOW(), ""ModifierID"" = @ModifierID
                WHERE ""ContractDetailItems_ID"" = @id", p);
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
                @"DELETE FROM ""SCM_ContractDetailItems"" WHERE ""ContractDetailItems_ID"" = @id", new { id });
            return rows == 0 ? NotFound() : NoContent();
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }
}
