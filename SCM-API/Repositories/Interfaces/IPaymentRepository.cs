using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IPaymentRepository : IRepository<PaymentHeader>
{
    Task<PaymentHeader?> GetWithDetailsAsync(int id);
    Task<PagedResult<PaymentHeader>> GetFilteredAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
    Task<IEnumerable<PaymentDetail>> GetBatchesAsync(string? financialYear, int page, int pageSize);
}
