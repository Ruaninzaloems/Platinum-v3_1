using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class ConfigService : IConfigService
{
    private readonly IConfigRepository _repository;
    private readonly ILogger<ConfigService> _logger;

    public ConfigService(IConfigRepository repository, ILogger<ConfigService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<object> GetDepartmentsAsync() => await _repository.GetDepartmentsAsync();
    public async Task<object> GetDivisionsAsync(int? departmentId) => await _repository.GetDivisionsAsync(departmentId);
    public async Task<object> GetEmployeesAsync(int? departmentId) => await _repository.GetEmployeesAsync(departmentId);
    public async Task<object> GetStoresAsync() => await _repository.GetStoresAsync();
    public async Task<object> GetFinancialYearsAsync() => await _repository.GetFinancialYearsAsync();
    public async Task<object> GetBanksAsync() => await _repository.GetBanksAsync();
    public async Task<object> GetVendorStatusesAsync() => await _repository.GetVendorStatusesAsync();
    public async Task<object> GetProcessBoundariesAsync() => await _repository.GetProcessBoundariesAsync();
    public async Task<object> GetVotesAsync() => await _repository.GetVotesAsync();

    public async Task<object> GetConfigValueAsync(string key)
    {
        var config = await _repository.GetByKeyAsync(key);
        return config != null
            ? new { KeyName = (string?)config.KeyName, KeyValue = (string?)config.KeyValue, KeyDescription = (string?)config.KeyDescription }
            : new { KeyName = (string?)key, KeyValue = (string?)null, KeyDescription = (string?)"Not found" };
    }
}
