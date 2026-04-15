namespace MssqlApi.Services;

public interface IScoaStructureService
{
    Task<IEnumerable<dynamic>> GetAllAsync(string? tableId);
    Task<dynamic?> GetByIdAsync(int id);
}
