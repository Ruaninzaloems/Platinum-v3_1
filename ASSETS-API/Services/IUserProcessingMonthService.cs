namespace MssqlApi.Services;

public interface IUserProcessingMonthService
{
    Task<IEnumerable<dynamic>> GetAllAsync(int? userId);
    Task<dynamic?> GetByIdAsync(int id);
    Task<dynamic?> GetCurrentForUserAsync(int userId);
    Task<int> CreateAsync(Dictionary<string, object?> body);
    Task<bool> UpdateAsync(int id, Dictionary<string, object?> body);
}
