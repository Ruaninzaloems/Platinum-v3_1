namespace MssqlApi.Services;

public interface IWardService
{
    Task<IEnumerable<dynamic>> GetAllAsync();
    Task<dynamic?> GetByIdAsync(int id);
}
