using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IContractRepository : IRepository<ContractDetail>
{
    Task<ContractDetail?> GetWithDetailsAsync(int id);
    Task<PagedResult<ContractDetail>> GetFilteredAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
}
