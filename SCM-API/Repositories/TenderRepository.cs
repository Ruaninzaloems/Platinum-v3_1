using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class TenderRepository : Repository<Tender>, ITenderRepository
{
    public TenderRepository(ApplicationDbContext context, ILogger<TenderRepository> logger) : base(context, logger) { }

    public async Task<Tender?> GetWithDetailsAsync(int id)
    {
        return await _context.Tenders
            .Include(t => t.TenderVendors)
            .Include(t => t.TenderDocuments)
            .Include(t => t.TenderEvaluations)
            .Include(t => t.TenderAdjudications)
            .FirstOrDefaultAsync(t => t.TenderId == id);
    }

    public async Task<PagedResult<Tender>> GetFilteredAsync(
        string? financialYear, int? statusId, string? search, int page, int pageSize)
    {
        var query = _context.Tenders.Where(t => t.Enabled == true);

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(t => t.FinancialYear == financialYear);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(t => t.TenderNumber!.Contains(search) || t.TenderDescription!.Contains(search));

        query = query.OrderByDescending(t => t.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<IEnumerable<TenderVendor>> GetBidsAsync(int tenderId)
    {
        return await _context.TenderVendors
            .Where(tv => tv.TenderId == tenderId)
            .ToListAsync();
    }
}
