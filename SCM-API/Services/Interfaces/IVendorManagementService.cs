using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IVendorManagementService
{
    Task<object?> GetRegistrationByIdAsync(string id);
    Task<PagedResult<object>> GetRegistrationsAsync(string? status, string? search, int page, int pageSize);
    Task<object> StartRegistrationAsync(object dto);
    Task<bool> UpdateRegistrationAsync(string id, object dto);
    Task<bool> SubmitRegistrationAsync(string id);
    Task<bool> ApproveRegistrationAsync(string id, object dto);
    Task<bool> RejectRegistrationAsync(string id, object dto);
    Task<object> GetRegistrationDocumentsAsync(string id);
    Task<bool> UploadRegistrationDocumentAsync(string id, object dto);
    Task<object> GetRegistrationDirectorsAsync(string id);
    Task<bool> AddDirectorAsync(string id, object dto);
    Task<bool> RemoveDirectorAsync(string id, string directorId);
    Task<object> GetRegistrationAccreditationsAsync(string id);
    Task<object> ImportFromCsdAsync(string registrationNumber);
    Task<object> GetRegistrationStatusAsync(string id);
}
