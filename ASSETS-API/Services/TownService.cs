using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class TownService : ITownService
{
    private readonly ITownRepository _repo;

    public TownService(ITownRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<TownLookup>> GetAllAsync() => _repo.GetAllAsync();
    public Task<TownLookup?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(TownLookup entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(TownLookup entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
