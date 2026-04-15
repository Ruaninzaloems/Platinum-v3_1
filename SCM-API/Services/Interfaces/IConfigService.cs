namespace SCM_API.Services.Interfaces;

public interface IConfigService
{
    Task<object> GetDepartmentsAsync();
    Task<object> GetDivisionsAsync(int? departmentId);
    Task<object> GetEmployeesAsync(int? departmentId);
    Task<object> GetStoresAsync();
    Task<object> GetFinancialYearsAsync();
    Task<object> GetBanksAsync();
    Task<object> GetVendorStatusesAsync();
    Task<object> GetProcessBoundariesAsync();
    Task<object> GetVotesAsync();
    Task<object> GetConfigValueAsync(string key);
}
