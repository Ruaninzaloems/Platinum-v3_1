using MssqlApi.Models;

namespace MssqlApi.Repositories;

public interface IScmContractDetailsRepository
{
    Task<IEnumerable<ScmContractDetails>> GetAllAsync();
    Task<ScmContractDetails?> GetByIdAsync(int id);
    Task<int> CreateAsync(ScmContractDetails entity);
    Task<bool> UpdateAsync(ScmContractDetails entity);
    Task<bool> DeleteAsync(int id);
}
