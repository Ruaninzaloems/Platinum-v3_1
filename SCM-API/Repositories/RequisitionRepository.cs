using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class RequisitionRepository : Repository<Requisition>, IRequisitionRepository
{
    public RequisitionRepository(ApplicationDbContext context, ILogger<RequisitionRepository> logger) : base(context, logger) { }

    public async Task<Requisition?> GetWithDetailsAsync(int id)
    {
        return await _context.Requisitions
            .Include(r => r.ServiceDetails)
            .Include(r => r.Documents)
            .FirstOrDefaultAsync(r => r.RequisitionId == id);
    }

    public async Task<PagedResult<Requisition>> GetFilteredAsync(
        string? financialYear, int? statusId, int? departmentId, string? search, int page, int pageSize)
    {
        var query = _context.Requisitions.Where(r => r.Enabled == true);

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(r => r.FinancialYear == financialYear);
        if (statusId.HasValue)
            query = query.Where(r => r.SavedStatusId == statusId.Value);
        if (departmentId.HasValue)
            query = query.Where(r => r.DepartmentId == departmentId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(r => r.RequisitionNumber!.Contains(search) || r.ServiceDescription!.Contains(search));

        query = query.OrderByDescending(r => r.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<IEnumerable<RequisitionServiceDetail>> GetServiceDetailsAsync(int requisitionId)
    {
        return await _context.RequisitionServiceDetails
            .Where(d => d.RequisitionId == requisitionId)
            .ToListAsync();
    }
}
