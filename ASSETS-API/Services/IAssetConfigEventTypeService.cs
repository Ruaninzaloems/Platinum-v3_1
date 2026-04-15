namespace MssqlApi.Services;

public interface IAssetConfigEventTypeService
{
    Task<IEnumerable<dynamic>> GetAllAsync();
    Task<dynamic?> GetByIdAsync(int id);
}
