using MssqlApi.Models;

namespace MssqlApi.Services;

public interface IEmployeeService
{
    Task<IEnumerable<Employee>> GetAllAsync();
    Task<Employee?> GetByIdAsync(int id);
    Task<int> CreateAsync(Employee entity);
    Task<bool> UpdateAsync(Employee entity);
    Task<bool> DeleteAsync(int id);
}
