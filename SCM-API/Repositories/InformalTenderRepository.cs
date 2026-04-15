using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class InformalTenderRepository : Repository<InformalTender>, IInformalTenderRepository
{
    public InformalTenderRepository(ApplicationDbContext context, ILogger<InformalTenderRepository> logger) : base(context, logger) { }

    public async Task<InformalTender?> GetWithDetailsAsync(int id)
    {
        return await _context.InformalTenders
            .Include(it => it.Vendors)
            .FirstOrDefaultAsync(it => it.InformalTenderId == id);
    }

    public async Task<PagedResult<InformalTender>> GetFilteredAsync(
        string? financialYear, int? statusId, string? search, int page, int pageSize)
    {
        var query = _context.InformalTenders.Where(it => it.Enabled == true);

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(it => it.FinancialYear == financialYear);
        if (statusId.HasValue)
            query = query.Where(it => it.StatusId == statusId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(it => (it.InformalTenderNumber != null && it.InformalTenderNumber.Contains(search))
                                   || (it.Comments != null && it.Comments.Contains(search)));

        query = query.OrderByDescending(it => it.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<IEnumerable<InformalTenderVendor>> GetVendorsAsync(int informalTenderId)
    {
        return await _context.InformalTenderVendors
            .Where(v => v.InformalTenderId == informalTenderId && v.Enabled)
            .ToListAsync();
    }
}
