namespace MssqlApi.Services;

public interface IBuildingService
{
    Task<IEnumerable<dynamic>> GetAllAsync();
    Task<dynamic?> GetByIdAsync(int id);
}
