namespace MssqlApi.Services;

public interface IRoomService
{
    Task<IEnumerable<dynamic>> GetAllAsync(int? floorId);
    Task<dynamic?> GetByIdAsync(int id);
}
