using MssqlApi.Models;

namespace MssqlApi.Services;

public interface IUnitOfIssueService
{
    Task<IEnumerable<UnitOfIssue>> GetAllAsync();
    Task<UnitOfIssue?> GetByIdAsync(int id);
    Task<int> CreateAsync(UnitOfIssue entity);
    Task<bool> UpdateAsync(UnitOfIssue entity);
    Task<bool> DeleteAsync(int id);
}
