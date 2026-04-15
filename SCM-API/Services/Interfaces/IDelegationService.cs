namespace SCM_API.Services.Interfaces;

public interface IDelegationService
{
    Task<object> GetAllDelegationsAsync(string? type, string? status, int page, int pageSize);
    Task<object> GetDelegationByIdAsync(int id);
    Task<object> CreateDelegationAsync(object dto);
    Task<bool> UpdateDelegationAsync(int id, object dto);
    Task<bool> RevokeDelegationAsync(int id, object dto);
    Task<object> GetThresholdsAsync();
    Task<bool> UpdateThresholdAsync(int id, object dto);
    Task<bool> ValidateDelegationAuthorityAsync(int userId, decimal amount, string entityType);
}
