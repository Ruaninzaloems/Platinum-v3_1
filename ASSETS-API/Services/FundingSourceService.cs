using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class FundingSourceService : IFundingSourceService
{
    private readonly IFundingSourceRepository _repo;

    public FundingSourceService(IFundingSourceRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<FundingSource>> GetAllAsync() => _repo.GetAllAsync();
    public Task<FundingSource?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(FundingSource entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(FundingSource entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
