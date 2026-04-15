namespace MssqlApi.Services;

public interface IFinYearService
{
    Task<IEnumerable<dynamic>> GetAllAsync();
    Task<dynamic?> GetByIdAsync(int id);
    Task<dynamic?> GetDefaultAsync();
}
