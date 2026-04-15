using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class EmployeeService : IEmployeeService
{
    private readonly IEmployeeRepository _repo;
    public EmployeeService(IEmployeeRepository repo) { _repo = repo; }

    public Task<IEnumerable<Employee>> GetAllAsync() => _repo.GetAllAsync();
    public Task<Employee?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(Employee entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(Employee entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
