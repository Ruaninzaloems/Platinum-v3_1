using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IInformalTenderRepository : IRepository<InformalTender>
{
    Task<InformalTender?> GetWithDetailsAsync(int id);
    Task<PagedResult<InformalTender>> GetFilteredAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
    Task<IEnumerable<InformalTenderVendor>> GetVendorsAsync(int informalTenderId);
}
