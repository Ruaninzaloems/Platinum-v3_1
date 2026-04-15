using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IIntegrationService
{
    Task<object> GetIntegrationStatusAsync();
    Task<object> SyncVendorsAsync();
    Task<object> SyncEmployeesAsync();
    Task<object> ImportCsdDataAsync(object importDto);
    Task<object> ExportToGlAsync(string financialYear);
    Task<object> GetGlPostingsAsync(string financialYear, int page, int pageSize);
    Task<object> GetCsdVerificationAsync(string registrationNumber);
}
