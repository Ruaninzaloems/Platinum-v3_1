using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class InvoiceRepository : Repository<Invoice>, IInvoiceRepository
{
    public InvoiceRepository(ApplicationDbContext context, ILogger<InvoiceRepository> logger) : base(context, logger) { }

    public async Task<Invoice?> GetWithDetailsAsync(int id)
    {
        return await _context.Invoices
            .Include(i => i.InvoiceDetails)
            .Include(i => i.InvoiceDocuments)
            .FirstOrDefaultAsync(i => i.InvoiceId == id);
    }

    public async Task<PagedResult<Invoice>> GetFilteredAsync(
        string? financialYear, int? statusId, string? search, int page, int pageSize)
    {
        var query = _context.Invoices.Where(i => i.Enabled == true);

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(i => i.FinancialYear == financialYear);
        if (statusId.HasValue)
            query = query.Where(i => i.StatusId == statusId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(i => i.VendorInvoiceNumber!.Contains(search) || i.DocNumber!.Contains(search));

        query = query.OrderByDescending(i => i.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<IEnumerable<InvoiceDetail>> GetInvoiceDetailsAsync(int invoiceId)
    {
        return await _context.InvoiceDetails
            .Where(d => d.InvoiceId == invoiceId)
            .ToListAsync();
    }
}
