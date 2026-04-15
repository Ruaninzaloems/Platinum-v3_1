using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IInvoiceRepository : IRepository<Invoice>
{
    Task<Invoice?> GetWithDetailsAsync(int id);
    Task<PagedResult<Invoice>> GetFilteredAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
    Task<IEnumerable<InvoiceDetail>> GetInvoiceDetailsAsync(int invoiceId);
}
