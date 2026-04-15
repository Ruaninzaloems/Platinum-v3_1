using MssqlApi.Models;

namespace MssqlApi.Services;

public interface IScmContractDetailItemsService
{
    Task<IEnumerable<ScmContractDetailItems>> GetAllAsync();
    Task<ScmContractDetailItems?> GetByIdAsync(int id);
    Task<int> CreateAsync(ScmContractDetailItems entity);
    Task<bool> UpdateAsync(ScmContractDetailItems entity);
    Task<bool> DeleteAsync(int id);
}
