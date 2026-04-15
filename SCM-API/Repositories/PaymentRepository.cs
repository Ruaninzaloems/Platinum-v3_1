using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class PaymentRepository : Repository<PaymentHeader>, IPaymentRepository
{
    public PaymentRepository(ApplicationDbContext context, ILogger<PaymentRepository> logger) : base(context, logger) { }

    public async Task<PaymentHeader?> GetWithDetailsAsync(int id)
    {
        return await _context.PaymentHeaders
            .Include(p => p.PaymentDetails)
            .FirstOrDefaultAsync(p => p.PaymentHeaderId == id);
    }

    public async Task<PagedResult<PaymentHeader>> GetFilteredAsync(
        string? financialYear, int? statusId, string? search, int page, int pageSize)
    {
        var query = _context.PaymentHeaders.Where(p => p.Enabled == true);

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(p => p.FinancialYear == financialYear);
        if (statusId.HasValue)
            query = query.Where(p => p.StatusId == statusId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.PaymentReferenceNumber!.Contains(search));

        query = query.OrderByDescending(p => p.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<IEnumerable<PaymentDetail>> GetBatchesAsync(string? financialYear, int page, int pageSize)
    {
        var query = from d in _context.PaymentDetails
                    join h in _context.PaymentHeaders on d.PaymentHeaderId equals h.PaymentHeaderId
                    where h.Enabled == true
                    select new { Detail = d, Header = h };

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(x => x.Header.FinancialYear == financialYear);

        return await query.OrderByDescending(x => x.Header.DateCaptured)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => x.Detail).ToListAsync();
    }
}
