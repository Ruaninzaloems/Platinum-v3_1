namespace MssqlApi.Services;

public interface IFloorService
{
    Task<IEnumerable<dynamic>> GetAllAsync(int? buildingId);
    Task<dynamic?> GetByIdAsync(int id);
}
