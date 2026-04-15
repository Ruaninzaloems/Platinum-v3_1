using MssqlApi.Models;

namespace MssqlApi.Services;

public interface IDepartmentService
{
    Task<IEnumerable<Department>> GetAllAsync();
    Task<Department?> GetByIdAsync(int id);
    Task<int> CreateAsync(Department entity);
    Task<bool> UpdateAsync(Department entity);
    Task<bool> DeleteAsync(int id);
}
