using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IGrnGraRepository : IRepository<Grn>
{
    Task<Grn?> GetWithDetailsAsync(int id);
    Task<PagedResult<Grn>> GetFilteredAsync(string? financialYear, int? statusId, int? orderId, int page, int pageSize);
    Task<PagedResult<Gra>> GetGrasAsync(string? financialYear, int? statusId, int page, int pageSize);
    Task<Gra?> GetGraByIdAsync(int id);
    Task AddGraAsync(Gra entity);
}
