namespace MssqlApi.Services;

public interface IPropertyTypeOfUseService
{
    Task<IEnumerable<dynamic>> GetAllAsync();
    Task<dynamic?> GetByIdAsync(int id);
}
