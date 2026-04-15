using MssqlApi.Models;

namespace MssqlApi.Repositories;

public interface IFundingSourceRepository
{
    Task<IEnumerable<FundingSource>> GetAllAsync();
    Task<FundingSource?> GetByIdAsync(int id);
    Task<int> CreateAsync(FundingSource entity);
    Task<bool> UpdateAsync(FundingSource entity);
    Task<bool> DeleteAsync(int id);
}
