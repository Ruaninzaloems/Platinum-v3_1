using MssqlApi.Models;

namespace MssqlApi.Repositories;

public interface IScmUnbundlingHeaderRepository
{
    Task<IEnumerable<ScmUnbundlingHeader>> GetAllAsync();
    Task<ScmUnbundlingHeader?> GetByIdAsync(int id);
    Task<int> CreateAsync(ScmUnbundlingHeader entity);
    Task<bool> UpdateAsync(ScmUnbundlingHeader entity);
    Task<bool> DeleteAsync(int id);
}
