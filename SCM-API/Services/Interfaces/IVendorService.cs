using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IVendorService
{
    Task<object?> GetByIdAsync(int id);
    Task<PagedResult<object>> GetAllAsync(string? search, int? statusId, int page, int pageSize);
    Task<object> CreateAsync(object dto);
    Task<bool> UpdateAsync(int id, object dto);
    Task<object> GetVendorBankDetailsAsync(int vendorId);
    Task<object> GetVendorDirectorsAsync(int vendorId);
    Task<object> GetVendorDocumentsAsync(int vendorId);
    Task<object> GetVendorAccreditationsAsync(int vendorId);
    Task<object> GetVendorCommoditiesAsync(int vendorId);
    Task<bool> ActivateAsync(int vendorId);
    Task<bool> DeactivateAsync(int vendorId);
    Task<bool> BlacklistAsync(int vendorId, object blacklistDto);
}
