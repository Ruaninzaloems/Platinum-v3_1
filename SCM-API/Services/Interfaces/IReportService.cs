using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IReportService
{
    Task<object> GetAvailableReportsAsync();
    Task<object> GenerateReportAsync(string reportType, object parameters);
    Task<object> GetReportByIdAsync(int reportId);
    Task<PagedResult<object>> GetReportHistoryAsync(int page, int pageSize);
}
