using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class GrnGraRepository : Repository<Grn>, IGrnGraRepository
{
    public GrnGraRepository(ApplicationDbContext context, ILogger<GrnGraRepository> logger) : base(context, logger) { }

    public async Task<Grn?> GetWithDetailsAsync(int id)
    {
        return await _context.Grns
            .Include(g => g.GrnDetails)
            .Include(g => g.GrnDocuments)
            .FirstOrDefaultAsync(g => g.GrnId == id);
    }

    public async Task<PagedResult<Grn>> GetFilteredAsync(
        string? financialYear, int? statusId, int? orderId, int page, int pageSize)
    {
        var query = _context.Grns.Where(g => g.Enabled == true);

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(g => g.FinancialYear == financialYear);
        if (statusId.HasValue)
            query = query.Where(g => g.StatusId == statusId.Value);
        if (orderId.HasValue)
            query = query.Where(g => g.OrderId == orderId.Value);

        query = query.OrderByDescending(g => g.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<PagedResult<Gra>> GetGrasAsync(
        string? financialYear, int? statusId, int page, int pageSize)
    {
        var query = _context.Gras.Where(g => g.Enabled == true);

        if (statusId.HasValue)
            query = query.Where(g => g.StatusId == statusId.Value);

        query = query.OrderByDescending(g => g.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<Gra?> GetGraByIdAsync(int id)
    {
        return await _context.Gras
            .Include(g => g.GraDetails)
            .FirstOrDefaultAsync(g => g.GraId == id);
    }

    public async Task AddGraAsync(Gra entity)
    {
        await _context.Gras.AddAsync(entity);
    }
}
