using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IAuditService
{
    Task<PagedResult<object>> GetAuditLogsAsync(string? entityType, int? entityId, string? action, DateTime? fromDate, DateTime? toDate, int page, int pageSize);
    Task LogActionAsync(string entityType, int entityId, string action, string details, int userId);
    Task<object> GetEntityHistoryAsync(string entityType, int entityId);
    Task<object> GetAuditSummaryAsync();
    Task<object> GetUserAuditHistoryAsync(int userId, int page, int pageSize);
    Task<object> ExportAuditLogsAsync(string? entityType, string? action, DateTime? fromDate, DateTime? toDate);
}
