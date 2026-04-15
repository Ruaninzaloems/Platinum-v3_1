using MssqlApi.Models;

namespace MssqlApi.Services;

public interface IMonthService
{
    Task<IEnumerable<MonthLookup>> GetAllAsync();
    Task<MonthLookup?> GetByIdAsync(int id);
    Task<int> CreateAsync(MonthLookup entity);
    Task<bool> UpdateAsync(MonthLookup entity);
    Task<bool> DeleteAsync(int id);
}
