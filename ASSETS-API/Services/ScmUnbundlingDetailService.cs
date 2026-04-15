using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class ScmUnbundlingDetailService : IScmUnbundlingDetailService
{
    private readonly IScmUnbundlingDetailRepository _repo;

    public ScmUnbundlingDetailService(IScmUnbundlingDetailRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<ScmUnbundlingDetail>> GetAllAsync() => _repo.GetAllAsync();
    public Task<ScmUnbundlingDetail?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(ScmUnbundlingDetail entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(ScmUnbundlingDetail entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
