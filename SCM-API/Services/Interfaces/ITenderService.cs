using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface ITenderService
{
    Task<object?> GetByIdAsync(int id);
    Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
    Task<object> CreateAsync(object dto);
    Task<bool> UpdateAsync(int id, object dto);
    Task<bool> DeleteAsync(int id);
    Task<object> GetTenderBidsAsync(int tenderId);
    Task<bool> AwardAsync(int tenderId, object awardDto);
    Task<object> GetEvaluationAsync(int tenderId);
    Task<bool> PublishAsync(int tenderId);
    Task<bool> CloseAsync(int tenderId);
    Task<bool> SubmitAsync(int id);
    Task<bool> ApproveAsync(int id, object dto);
    Task<bool> TransitionStatusAsync(int id, string newStatus);
    Task<object> GetDashboardSummaryAsync();
    Task<object> GetPipelineAsync();
}
