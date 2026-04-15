using MssqlApi.Models;

namespace MssqlApi.Repositories;

public interface IDivisionRepository
{
    Task<IEnumerable<Division>> GetAllAsync();
    Task<Division?> GetByIdAsync(int id);
    Task<int> CreateAsync(Division entity);
    Task<bool> UpdateAsync(Division entity);
    Task<bool> DeleteAsync(int id);
}
