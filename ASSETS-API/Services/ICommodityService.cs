namespace MssqlApi.Services;

public interface ICommodityService
{
    Task<IEnumerable<dynamic>> GetAllAsync();
    Task<dynamic?> GetByIdAsync(int id);
}
