using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class QuotationRepository : Repository<Quotation>, IQuotationRepository
{
    public QuotationRepository(ApplicationDbContext context, ILogger<QuotationRepository> logger) : base(context, logger) { }

    public async Task<Quotation?> GetWithDetailsAsync(int id)
    {
        return await _context.Quotations
            .Include(q => q.ServiceDetails)
            .Include(q => q.Vendors)
            .FirstOrDefaultAsync(q => q.QuotationId == id);
    }

    public async Task<PagedResult<Quotation>> GetFilteredAsync(
        string? financialYear, int? statusId, string? search, int page, int pageSize)
    {
        var query = _context.Quotations.Where(q => q.Enabled == true);

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(q => q.FinancialYear == financialYear);
        if (statusId.HasValue)
            query = query.Where(q => q.StatusId == statusId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(q => q.QuotationNumber!.Contains(search) || q.QuotationDescription!.Contains(search));

        query = query.OrderByDescending(q => q.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<IEnumerable<QuotationServiceDetail>> GetServiceDetailsAsync(int quotationId)
    {
        return await _context.QuotationServiceDetails
            .Where(d => d.QuotationId == quotationId)
            .ToListAsync();
    }
}
