using MssqlApi.Models;

namespace MssqlApi.Services;

public interface ITownService
{
    Task<IEnumerable<TownLookup>> GetAllAsync();
    Task<TownLookup?> GetByIdAsync(int id);
    Task<int> CreateAsync(TownLookup entity);
    Task<bool> UpdateAsync(TownLookup entity);
    Task<bool> DeleteAsync(int id);
}
