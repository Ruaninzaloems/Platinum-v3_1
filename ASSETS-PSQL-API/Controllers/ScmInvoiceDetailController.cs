using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/scm-invoice-details")]
public class ScmInvoiceDetailController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public ScmInvoiceDetailController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? invoiceId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""SCM_InvoiceDetail"" WHERE 1=1";
        var p = new DynamicParameters();
        if (invoiceId.HasValue)
        {
            sql += @" AND ""InvoiceID"" = @invoiceId";
            p.Add("invoiceId", invoiceId.Value);
        }
        sql += @" ORDER BY ""InvoiceDetail_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""SCM_InvoiceDetail"" WHERE ""InvoiceDetail_ID"" = @id", new { id });
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("by-contract")]
    public async Task<IActionResult> GetByContract([FromQuery] int contractId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT d.*,
                   i.""Invoice_ID""          AS ""invoiceId"",
                   i.""VendorInvoiceNumber"" AS ""vendorInvoiceNumber"",
                   i.""InvoiceDate""         AS ""invoiceDate"",
                   i.""DocNumber""           AS ""docNumber"",
                   i.""PaymentReference""    AS ""paymentReference"",
                   i.""StatusID""           AS ""statusId""
            FROM ""SCM_InvoiceDetail"" d
            JOIN ""SCM_Invoice"" i ON i.""Invoice_ID"" = d.""InvoiceID""
            WHERE i.""ContractID"" = @contractId
              AND i.""StatusID"" NOT IN (44, 83, 95, 2053)
            ORDER BY i.""Invoice_ID"", d.""InvoiceDetail_ID""",
            new { contractId });
        return Ok(items);
    }
}
