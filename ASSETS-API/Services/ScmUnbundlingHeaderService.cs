using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class ScmUnbundlingHeaderService : IScmUnbundlingHeaderService
{
    private readonly IScmUnbundlingHeaderRepository _repo;

    public ScmUnbundlingHeaderService(IScmUnbundlingHeaderRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<ScmUnbundlingHeader>> GetAllAsync() => _repo.GetAllAsync();
    public Task<ScmUnbundlingHeader?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(ScmUnbundlingHeader entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(ScmUnbundlingHeader entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
