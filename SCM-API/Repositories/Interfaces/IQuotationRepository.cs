using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IQuotationRepository : IRepository<Quotation>
{
    Task<Quotation?> GetWithDetailsAsync(int id);
    Task<PagedResult<Quotation>> GetFilteredAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
    Task<IEnumerable<QuotationServiceDetail>> GetServiceDetailsAsync(int quotationId);
}
