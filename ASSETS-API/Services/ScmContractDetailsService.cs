using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class ScmContractDetailsService : IScmContractDetailsService
{
    private readonly IScmContractDetailsRepository _repo;

    public ScmContractDetailsService(IScmContractDetailsRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<ScmContractDetails>> GetAllAsync() => _repo.GetAllAsync();
    public Task<ScmContractDetails?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(ScmContractDetails entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(ScmContractDetails entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
