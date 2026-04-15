using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class UnitOfIssueService : IUnitOfIssueService
{
    private readonly IUnitOfIssueRepository _repo;

    public UnitOfIssueService(IUnitOfIssueRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<UnitOfIssue>> GetAllAsync() => _repo.GetAllAsync();
    public Task<UnitOfIssue?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(UnitOfIssue entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(UnitOfIssue entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
