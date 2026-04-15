using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class MonthService : IMonthService
{
    private readonly IMonthRepository _repo;

    public MonthService(IMonthRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<MonthLookup>> GetAllAsync() => _repo.GetAllAsync();
    public Task<MonthLookup?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(MonthLookup entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(MonthLookup entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
