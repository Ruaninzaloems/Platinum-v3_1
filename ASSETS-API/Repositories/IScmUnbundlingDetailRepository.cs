using MssqlApi.Models;

namespace MssqlApi.Repositories;

public interface IScmUnbundlingDetailRepository
{
    Task<IEnumerable<ScmUnbundlingDetail>> GetAllAsync();
    Task<ScmUnbundlingDetail?> GetByIdAsync(int id);
    Task<int> CreateAsync(ScmUnbundlingDetail entity);
    Task<bool> UpdateAsync(ScmUnbundlingDetail entity);
    Task<bool> DeleteAsync(int id);
}
