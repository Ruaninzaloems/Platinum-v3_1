using MssqlApi.Models;

namespace MssqlApi.Services;

public interface IScmContractDetailsService
{
    Task<IEnumerable<ScmContractDetails>> GetAllAsync();
    Task<ScmContractDetails?> GetByIdAsync(int id);
    Task<int> CreateAsync(ScmContractDetails entity);
    Task<bool> UpdateAsync(ScmContractDetails entity);
    Task<bool> DeleteAsync(int id);
}
