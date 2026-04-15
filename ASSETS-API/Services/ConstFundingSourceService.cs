using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class ConstFundingSourceService : IConstFundingSourceService
{
    private readonly IConstFundingSourceRepository _repo;
    public ConstFundingSourceService(IConstFundingSourceRepository repo) => _repo = repo;

    public Task<IEnumerable<dynamic>> GetAllAsync(string? finYear) => _repo.GetAllAsync(finYear);
    public Task<dynamic?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(string fundingSourceDesc, int enabled, string? finYear, int? previousReferenceId)
        => _repo.CreateAsync(fundingSourceDesc, enabled, finYear, previousReferenceId);
    public Task<bool> UpdateAsync(int id, string fundingSourceDesc, int enabled, string? finYear)
        => _repo.UpdateAsync(id, fundingSourceDesc, enabled, finYear);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
