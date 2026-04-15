using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IVendorManagementRepository
{
    Task<VendorRegistration?> GetRegistrationByIdAsync(int id);
    Task<VendorRegistration?> GetRegistrationWithDetailsAsync(int id);
    Task<PagedResult<VendorRegistration>> GetRegistrationsFilteredAsync(bool? status, string? search, int page, int pageSize);
    Task<VendorRegistration> CreateRegistrationAsync(VendorRegistration registration);
    Task<bool> UpdateRegistrationAsync(VendorRegistration registration);
    Task<IEnumerable<VendorDocumentDetail>> GetDocumentsByVendorIdAsync(int vendorId);
    Task<VendorDocumentDetail> CreateDocumentAsync(VendorDocumentDetail document);
    Task<IEnumerable<VendorShareHolderDetail>> GetShareHoldersByVendorIdAsync(int vendorId);
    Task<VendorShareHolderDetail> CreateShareHolderAsync(VendorShareHolderDetail shareHolder);
    Task<bool> RemoveShareHolderAsync(int shareHolderId);
    Task<IEnumerable<VendorIssueRegister>> GetIssuesByVendorIdAsync(int vendorId);
    Task<IEnumerable<VendorBusinessArea>> GetBusinessAreasByVendorIdAsync(int vendorId);
    Task<IEnumerable<VendorProfessionalBody>> GetAccreditationsByVendorIdAsync(int vendorId);
    Task SaveChangesAsync();
}
