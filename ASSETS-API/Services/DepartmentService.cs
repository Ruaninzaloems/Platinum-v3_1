using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _repo;

    public DepartmentService(IDepartmentRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<Department>> GetAllAsync() => _repo.GetAllAsync();
    public Task<Department?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(Department entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(Department entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
