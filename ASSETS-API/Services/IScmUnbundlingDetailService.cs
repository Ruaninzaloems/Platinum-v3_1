using MssqlApi.Models;

namespace MssqlApi.Services;

public interface IScmUnbundlingDetailService
{
    Task<IEnumerable<ScmUnbundlingDetail>> GetAllAsync();
    Task<ScmUnbundlingDetail?> GetByIdAsync(int id);
    Task<int> CreateAsync(ScmUnbundlingDetail entity);
    Task<bool> UpdateAsync(ScmUnbundlingDetail entity);
    Task<bool> DeleteAsync(int id);
}
