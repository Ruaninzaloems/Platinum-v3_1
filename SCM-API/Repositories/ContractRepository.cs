using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class ContractRepository : Repository<ContractDetail>, IContractRepository
{
    public ContractRepository(ApplicationDbContext context, ILogger<ContractRepository> logger) : base(context, logger) { }

    public async Task<ContractDetail?> GetWithDetailsAsync(int id)
    {
        return await _context.ContractDetails
            .Include(c => c.ContractDocuments)
            .Include(c => c.Milestones)
            .Include(c => c.PaymentCertificates).ThenInclude(p => p.Details)
            .Include(c => c.DetailItems)
            .FirstOrDefaultAsync(c => c.ContractDetailsId == id);
    }

    public async Task<PagedResult<ContractDetail>> GetFilteredAsync(
        string? financialYear, int? statusId, string? search, int page, int pageSize)
    {
        var query = _context.ContractDetails.Where(c => c.Enabled == true);

        if (statusId.HasValue)
            query = query.Where(c => c.StatusId == statusId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.ContractNumber!.Contains(search) || c.ContractDescription!.Contains(search));

        query = query.OrderByDescending(c => c.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }
}
