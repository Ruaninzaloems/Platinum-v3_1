using MssqlApi.Models;

namespace MssqlApi.Services;

public interface IFundingSourceService
{
    Task<IEnumerable<FundingSource>> GetAllAsync();
    Task<FundingSource?> GetByIdAsync(int id);
    Task<int> CreateAsync(FundingSource entity);
    Task<bool> UpdateAsync(FundingSource entity);
    Task<bool> DeleteAsync(int id);
}
