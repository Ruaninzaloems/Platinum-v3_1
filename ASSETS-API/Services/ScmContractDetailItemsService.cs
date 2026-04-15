using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class ScmContractDetailItemsService : IScmContractDetailItemsService
{
    private readonly IScmContractDetailItemsRepository _repo;

    public ScmContractDetailItemsService(IScmContractDetailItemsRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<ScmContractDetailItems>> GetAllAsync() => _repo.GetAllAsync();
    public Task<ScmContractDetailItems?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(ScmContractDetailItems entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(ScmContractDetailItems entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
