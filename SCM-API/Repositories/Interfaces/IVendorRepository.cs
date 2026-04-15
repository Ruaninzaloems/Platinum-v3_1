using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IVendorRepository : IRepository<Vendor>
{
    Task<Vendor?> GetWithDetailsAsync(int id);
    Task<PagedResult<Vendor>> GetFilteredAsync(string? search, int? statusId, int page, int pageSize);
    Task<IEnumerable<VendorBankingDetail>> GetBankDetailsAsync(int vendorId);
    Task<IEnumerable<VendorOwner>> GetDirectorsAsync(int vendorId);
}
