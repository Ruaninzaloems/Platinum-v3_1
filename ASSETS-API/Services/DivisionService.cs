using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class DivisionService : IDivisionService
{
    private readonly IDivisionRepository _repo;

    public DivisionService(IDivisionRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<Division>> GetAllAsync() => _repo.GetAllAsync();
    public Task<Division?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(Division entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(Division entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
