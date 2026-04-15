using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IRequisitionRepository : IRepository<Requisition>
{
    Task<Requisition?> GetWithDetailsAsync(int id);
    Task<PagedResult<Requisition>> GetFilteredAsync(string? financialYear, int? statusId, int? departmentId, string? search, int page, int pageSize);
    Task<IEnumerable<RequisitionServiceDetail>> GetServiceDetailsAsync(int requisitionId);
}
