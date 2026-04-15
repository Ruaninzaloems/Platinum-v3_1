namespace MssqlApi.Services;

public interface IStreetService
{
    Task<IEnumerable<dynamic>> GetAllAsync(int? suburbId);
    Task<dynamic?> GetByIdAsync(int id);
}
