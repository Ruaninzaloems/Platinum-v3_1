using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/scm-unbundling-details")]
public class ScmUnbundlingDetailController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public ScmUnbundlingDetailController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""SCM_AssetUnbundling_Detail"" ORDER BY ""AssetContractDetail_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""SCM_AssetUnbundling_Detail"" WHERE ""AssetContractDetail_ID"" = @id", new { id });
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
            p.Add("AssetContractHeaderId", body.GetValueOrDefault("AssetContractHeaderId") ?? body.GetValueOrDefault("assetContractHeaderId"));
            p.Add("ContractDetailItemId", body.GetValueOrDefault("ContractDetailItemId") ?? body.GetValueOrDefault("contractDetailItemId"));
            p.Add("GoodsServiceDescription", body.GetValueOrDefault("GoodsServiceDescription") ?? body.GetValueOrDefault("goodsServiceDescription"));
            p.Add("UOM", body.GetValueOrDefault("UOM") ?? body.GetValueOrDefault("uom"));
            p.Add("Quantity", body.GetValueOrDefault("Quantity") ?? body.GetValueOrDefault("quantity"));
            p.Add("Rate", body.GetValueOrDefault("Rate") ?? body.GetValueOrDefault("rate"));
            p.Add("Amount", body.GetValueOrDefault("Amount") ?? body.GetValueOrDefault("amount"));
            p.Add("IsAsset", body.GetValueOrDefault("IsAsset") ?? body.GetValueOrDefault("isAsset") ?? 0);
            p.Add("AssetDescription", body.GetValueOrDefault("AssetDescription") ?? body.GetValueOrDefault("assetDescription"));
            p.Add("Enabled", body.GetValueOrDefault("Enabled") ?? body.GetValueOrDefault("enabled") ?? 1);
            var id = await conn.ExecuteScalarAsync<int>(@"
                INSERT INTO ""SCM_AssetUnbundling_Detail""
                    (""AssetContractHeaderId"", ""ContractDetailItemId"", ""GoodsServiceDescription"", ""UOM"",
                     ""Quantity"", ""Rate"", ""Amount"", ""IsAsset"", ""AssetDescription"", ""Enabled"",
                     ""DateCaptured"", ""CapturerID"")
                VALUES
                    (@AssetContractHeaderId, @ContractDetailItemId, @GoodsServiceDescription, @UOM,
                     @Quantity, @Rate, @Amount, @IsAsset, @AssetDescription, @Enabled,
                     NOW(), 1)
                RETURNING ""AssetContractDetail_ID""", p);
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
            p.Add("AssetContractHeaderId", body.GetValueOrDefault("AssetContractHeaderId") ?? body.GetValueOrDefault("assetContractHeaderId"));
            p.Add("ContractDetailItemId", body.GetValueOrDefault("ContractDetailItemId") ?? body.GetValueOrDefault("contractDetailItemId"));
            p.Add("GoodsServiceDescription", body.GetValueOrDefault("GoodsServiceDescription") ?? body.GetValueOrDefault("goodsServiceDescription"));
            p.Add("UOM", body.GetValueOrDefault("UOM") ?? body.GetValueOrDefault("uom"));
            p.Add("Quantity", body.GetValueOrDefault("Quantity") ?? body.GetValueOrDefault("quantity"));
            p.Add("Rate", body.GetValueOrDefault("Rate") ?? body.GetValueOrDefault("rate"));
            p.Add("Amount", body.GetValueOrDefault("Amount") ?? body.GetValueOrDefault("amount"));
            p.Add("IsAsset", body.GetValueOrDefault("IsAsset") ?? body.GetValueOrDefault("isAsset") ?? 0);
            p.Add("AssetDescription", body.GetValueOrDefault("AssetDescription") ?? body.GetValueOrDefault("assetDescription"));
            p.Add("Enabled", body.GetValueOrDefault("Enabled") ?? body.GetValueOrDefault("enabled") ?? 1);
            var rows = await conn.ExecuteAsync(@"
                UPDATE ""SCM_AssetUnbundling_Detail""
                SET ""AssetContractHeaderId"" = @AssetContractHeaderId,
                    ""ContractDetailItemId"" = @ContractDetailItemId,
                    ""GoodsServiceDescription"" = @GoodsServiceDescription,
                    ""UOM"" = @UOM, ""Quantity"" = @Quantity, ""Rate"" = @Rate,
                    ""Amount"" = @Amount, ""IsAsset"" = @IsAsset,
                    ""AssetDescription"" = @AssetDescription, ""Enabled"" = @Enabled,
                    ""DateModified"" = NOW(), ""ModifierID"" = 1
                WHERE ""AssetContractDetail_ID"" = @id", p);
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
                @"DELETE FROM ""SCM_AssetUnbundling_Detail"" WHERE ""AssetContractDetail_ID"" = @id", new { id });
            return rows == 0 ? NotFound() : NoContent();
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet("by-header")]
    public async Task<IActionResult> GetByHeader([FromQuery] int headerId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            @"SELECT * FROM ""SCM_AssetUnbundling_Detail"" WHERE ""AssetContractHeaderId"" = @headerId AND ""Enabled"" = 1 ORDER BY ""AssetContractDetail_ID""",
            new { headerId });
        return Ok(items);
    }

    [HttpGet("by-contract")]
    public async Task<IActionResult> GetByContract([FromQuery] int contractId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT
                d.""AssetContractDetail_ID""   AS ""assetContractDetailId"",
                d.""AssetContractHeaderId""    AS ""assetContractHeaderId"",
                d.""GoodsServiceDescription""  AS ""goodsServiceDescription"",
                d.""UOM""                      AS ""uom"",
                d.""Quantity""                 AS ""quantity"",
                d.""Rate""                     AS ""rate"",
                d.""Amount""                   AS ""amount"",
                d.""RequisitionBillOfQuantityId"" AS ""requisitionBillOfQuantityId""
            FROM ""SCM_AssetUnbundling_Detail"" d
            INNER JOIN ""SCM_AssetUnbundling_Header"" h ON h.""AssetContractHeader_ID"" = d.""AssetContractHeaderId""
            WHERE h.""ContractID"" = @contractId
              AND d.""Enabled"" = 1
              AND d.""RequisitionBillOfQuantityId"" IS NOT NULL
              AND d.""RequisitionBillOfQuantityId"" <> 0
            ORDER BY d.""AssetContractDetail_ID""",
            new { contractId });
        return Ok(items);
    }

    [HttpGet("by-contract-via-items")]
    public async Task<IActionResult> GetByContractViaItems([FromQuery] int contractId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT d.""AssetContractDetail_ID""   AS ""assetContractDetailId"",
                   d.""AssetContractHeaderId""    AS ""assetContractHeaderId"",
                   d.""ContractDetailItemId""     AS ""contractDetailItemId"",
                   d.""GoodsServiceDescription""  AS ""goodsServiceDescription"",
                   d.""UOM""                      AS ""uom"",
                   d.""Quantity""                 AS ""quantity"",
                   d.""Rate""                     AS ""rate"",
                   d.""Amount""                   AS ""amount"",
                   d.""IsAsset""                  AS ""isAsset"",
                   d.""AssetDescription""         AS ""assetDescription"",
                   d.""CIDMS_Sub_Component_Type"" AS ""cidmsSubComponentType"",
                   d.""Asset_Type""               AS ""assetType"",
                   d.""Asset_Category""           AS ""assetCategory"",
                   d.""Asset_Sub_Category""       AS ""assetSubCategory"",
                   d.""Measurement_Type""         AS ""measurementType"",
                   d.""Asset_Status""             AS ""assetStatus"",
                   i.""BillOfQuantityID""         AS ""billOfQuantityId""
            FROM ""SCM_AssetUnbundling_Detail"" d
            INNER JOIN ""SCM_ContractDetailItems"" i ON i.""ContractDetailItems_ID"" = d.""ContractDetailItemId""
            INNER JOIN ""SCM_AssetUnbundling_Header"" h ON h.""AssetContractHeader_ID"" = d.""AssetContractHeaderId""
            WHERE i.""ContractID"" = @contractId
              AND d.""Enabled"" = 1
            ORDER BY d.""AssetContractDetail_ID""",
            new { contractId });
        return Ok(items);
    }
}
