using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IInformalTenderService
{
    Task<object?> GetByIdAsync(int id);
    Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
    Task<object> CreateAsync(object dto);
    Task<bool> UpdateAsync(int id, object dto);
    Task<bool> DeleteAsync(int id);
    Task<object?> TransitionStatusAsync(int id, string newStatus, object? dto = null);
    Task<object> GetVendorsAsync(int informalTenderId);
    Task<object?> SelectVendorsAsync(int id, object dto);
    Task<object?> RecordVendorResponseAsync(int id, object dto);
    Task<object?> AdjudicateAsync(int id, object dto);
    Task<object> GetEvaluationAsync(int informalTenderId);
    Task<Dictionary<string, int>> GetSummaryAsync(string? financialYear);
}
