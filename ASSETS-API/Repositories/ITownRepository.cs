using MssqlApi.Models;

namespace MssqlApi.Repositories;

public interface ITownRepository
{
    Task<IEnumerable<TownLookup>> GetAllAsync();
    Task<TownLookup?> GetByIdAsync(int id);
    Task<int> CreateAsync(TownLookup entity);
    Task<bool> UpdateAsync(TownLookup entity);
    Task<bool> DeleteAsync(int id);
}
