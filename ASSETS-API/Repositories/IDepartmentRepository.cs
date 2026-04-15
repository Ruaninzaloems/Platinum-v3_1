using MssqlApi.Models;

namespace MssqlApi.Repositories;

public interface IDepartmentRepository
{
    Task<IEnumerable<Department>> GetAllAsync();
    Task<Department?> GetByIdAsync(int id);
    Task<int> CreateAsync(Department entity);
    Task<bool> UpdateAsync(Department entity);
    Task<bool> DeleteAsync(int id);
}
