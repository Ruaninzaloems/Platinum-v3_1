using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IConfigRepository : IRepository<ConfigSetting>
{
    Task<IEnumerable<Department>> GetDepartmentsAsync();
    Task<IEnumerable<Division>> GetDivisionsAsync(int? departmentId = null);
    Task<IEnumerable<Employee>> GetEmployeesAsync(int? departmentId = null);
    Task<IEnumerable<Store>> GetStoresAsync();
    Task<IEnumerable<FinancialYear>> GetFinancialYearsAsync();
    Task<IEnumerable<Bank>> GetBanksAsync();
    Task<IEnumerable<ScmVendorStatus>> GetVendorStatusesAsync();
    Task<IEnumerable<ProcessBoundary>> GetProcessBoundariesAsync();
    Task<IEnumerable<Vote>> GetVotesAsync();
    Task<ConfigSetting?> GetByKeyAsync(string keyName);
}
