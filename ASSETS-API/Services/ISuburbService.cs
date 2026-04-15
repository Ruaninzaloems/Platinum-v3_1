namespace MssqlApi.Services;

public interface ISuburbService
{
    Task<IEnumerable<dynamic>> GetAllAsync(int? townId);
    Task<dynamic?> GetByIdAsync(int id);
}
