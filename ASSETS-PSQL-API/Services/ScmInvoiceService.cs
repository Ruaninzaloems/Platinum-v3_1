using System.Data.Common;
using Dapper;

namespace AssetManagement.Services;

public class ScmInvoiceService
{
    private readonly InternalApiClient _api;

    public ScmInvoiceService(InternalApiClient api) => _api = api;

    public async Task<decimal> GetContractTotalExpenditureAsync(int contractId)
    {
        return await _api.GetDecimalAsync($"api/scm-invoices/total-by-contract/{contractId}");
    }

    public async Task<IEnumerable<ScmInvoiceWipRow>> GetInvoicesForWipInsertionAsync(int contractId)
    {
        var rows = await _api.GetAsync<List<ScmInvoiceWipRow>>(
            $"api/scm-invoices/for-wip-insertion/{contractId}");
        return rows ?? Enumerable.Empty<ScmInvoiceWipRow>();
    }

    public async Task InsertWipDetailsFromPreFetchedAsync(
        DbConnection conn, int wipId,
        IEnumerable<ScmInvoiceWipRow> invoices,
        DbTransaction? txn = null)
    {
        foreach (var inv in invoices)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_WIP_Register_Details"" (
                    ""WIPRegister_ID"", ""Description"", ""InvoiceId"", ""InvoiceNumber"",
                    ""InvoiceDate"", ""VendorID"", ""Amount"", ""VatAmount"", ""TotalAmount"",
                    ""DocumentNumber"", ""PaymentReference"", ""TransactionDate"",
                    ""DateCaptured"", ""CapturerID"")
                SELECT @wipId, @description, @invoiceId, @invoiceNumber,
                       @invoiceDate, @vendorId, @amount, @vatAmount, @totalAmount,
                       @docNumber, @paymentReference, @transactionDate,
                       NOW(), 1
                WHERE NOT EXISTS (
                    SELECT 1 FROM ""Asset_WIP_Register_Details"" x
                    WHERE x.""WIPRegister_ID"" = @wipId AND x.""InvoiceId"" = @invoiceId
                )",
                new
                {
                    wipId,
                    description      = inv.Description,
                    invoiceId        = inv.InvoiceId,
                    invoiceNumber    = inv.InvoiceNumber,
                    invoiceDate      = inv.InvoiceDate,
                    vendorId         = inv.VendorId,
                    amount           = inv.Amount,
                    vatAmount        = inv.VatAmount,
                    totalAmount      = inv.TotalAmount,
                    docNumber        = inv.DocNumber,
                    paymentReference = inv.PaymentReference,
                    transactionDate  = inv.InvoiceDate
                }, txn);
        }
    }
}
