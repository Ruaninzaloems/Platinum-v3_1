using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface ITenderRepository : IRepository<Tender>
{
    Task<Tender?> GetWithDetailsAsync(int id);
    Task<PagedResult<Tender>> GetFilteredAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
    Task<IEnumerable<TenderVendor>> GetBidsAsync(int tenderId);
}
