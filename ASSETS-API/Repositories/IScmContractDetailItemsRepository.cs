using MssqlApi.Models;

namespace MssqlApi.Repositories;

public interface IScmContractDetailItemsRepository
{
    Task<IEnumerable<ScmContractDetailItems>> GetAllAsync();
    Task<ScmContractDetailItems?> GetByIdAsync(int id);
    Task<int> CreateAsync(ScmContractDetailItems entity);
    Task<bool> UpdateAsync(ScmContractDetailItems entity);
    Task<bool> DeleteAsync(int id);
}
