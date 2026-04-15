namespace MssqlApi.Services;

public interface IDocumentTypeService
{
    Task<IEnumerable<dynamic>> GetAllAsync();
    Task<dynamic?> GetByIdAsync(int id);
}
