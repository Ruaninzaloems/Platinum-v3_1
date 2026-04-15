namespace MssqlApi.Services;

public interface IConstFundingSourceService
{
    Task<IEnumerable<dynamic>> GetAllAsync(string? finYear);
    Task<dynamic?> GetByIdAsync(int id);
    Task<int> CreateAsync(string fundingSourceDesc, int enabled, string? finYear, int? previousReferenceId);
    Task<bool> UpdateAsync(int id, string fundingSourceDesc, int enabled, string? finYear);
    Task<bool> DeleteAsync(int id);
}
