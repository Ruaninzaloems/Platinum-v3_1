using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IOrderRepository : IRepository<Order>
{
    Task<Order?> GetWithDetailsAsync(int id);
    Task<PagedResult<Order>> GetFilteredAsync(string? financialYear, int? statusId, int? vendorId, string? search, int page, int pageSize);
    Task<IEnumerable<OrderTypeDetail>> GetOrderDetailsAsync(int orderId);
}
