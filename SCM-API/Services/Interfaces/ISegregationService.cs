namespace SCM_API.Services.Interfaces;

public interface ISegregationService
{
    Task<object> GetAllRulesAsync();
    Task<bool> ValidateSegregationAsync(int userId, string entityType, string action, int entityId);
}
