using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/scm-invoices")]
public class ScmInvoiceController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public ScmInvoiceController(DbConnectionFactory db) => _db = db;

    [HttpGet("total-by-contract/{contractId:int}")]
    public async Task<IActionResult> TotalByContract(int contractId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var total = await conn.QuerySingleAsync<decimal>(@"
            SELECT COALESCE(SUM(COALESCE(i.""Calculated_Invoice_Amount"", 0)), 0)
            FROM ""SCM_Invoice"" i
            WHERE i.""ContractID"" = @contractId
              AND i.""Enabled"" = 1
              AND i.""FinalApprovedDate"" IS NOT NULL",
            new { contractId });
        return Ok(total);
    }

    [HttpGet("for-wip-insertion/{contractId:int}")]
    public async Task<IActionResult> ForWipInsertion(int contractId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<ScmInvoiceWipRow>(@"
            SELECT
                i.""Invoice_ID""           AS ""InvoiceId"",
                (SELECT d2.""ItemDescription""
                 FROM ""SCM_InvoiceDetail"" d2
                 WHERE d2.""InvoiceID"" = i.""Invoice_ID""
                 ORDER BY d2.""InvoiceDetail_ID"" LIMIT 1)  AS ""Description"",
                i.""VendorInvoiceNumber""  AS ""InvoiceNumber"",
                i.""InvoiceDate""          AS ""InvoiceDate"",
                i.""VendorCreditorID""     AS ""VendorId"",
                COALESCE(SUM(d.""Amount""),      0) AS ""Amount"",
                COALESCE(SUM(d.""VatAmount""),   0) AS ""VatAmount"",
                COALESCE(SUM(d.""TotalAmount""), 0) AS ""TotalAmount"",
                i.""DocNumber""            AS ""DocNumber"",
                i.""PaymentReference""     AS ""PaymentReference""
            FROM ""SCM_Invoice"" i
            JOIN ""SCM_InvoiceDetail"" d ON d.""InvoiceID"" = i.""Invoice_ID""
            WHERE i.""ContractID"" = @contractId
              AND i.""StatusID"" NOT IN (44, 83, 95, 2053)
            GROUP BY i.""Invoice_ID"", i.""VendorInvoiceNumber"", i.""InvoiceDate"",
                     i.""VendorCreditorID"", i.""DocNumber"", i.""PaymentReference""",
            new { contractId });
        return Ok(rows);
    }
}
