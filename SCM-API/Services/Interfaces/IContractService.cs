using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IContractService
{
    Task<object?> GetByIdAsync(int id);
    Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
    Task<object> CreateAsync(object dto);
    Task<bool> UpdateAsync(int id, object dto);
    Task<object> GetContractDetailsAsync(int contractId);
    Task<bool> TerminateAsync(int contractId, object terminateDto);
    Task<bool> RenewAsync(int contractId, object renewDto);
    Task<object> GetContractOrdersAsync(int contractId);
    Task<bool> ApproveAsync(int id, object dto);
    Task<bool> SubmitAsync(int id);
    Task<bool> ActivateAsync(int id);
    Task<object> GetApprovalChainAsync(int contractId);
    Task<object?> SubmitApprovalAsync(int contractId, int level, int userId, bool isApproved, string? comment);
    Task<object> GetVariationsAsync(int contractId);
    Task<object?> CreateVariationAsync(int contractId, string variationType, string description, decimal? variationValue, DateTime? newEndDate, string? reason);
    Task<bool> ApproveVariationAsync(int variationId, int userId);
    Task<object> GetPerformanceAsync(int contractId);
    Task<object?> RecordPerformanceAsync(int contractId, int quality, int delivery, int cost, int service, string? comments, string? period);
    Task<object> GetServiceRequestsAsync(int contractId);
    Task<object?> CreateServiceRequestAsync(int contractId, string description, decimal? requestedValue, DateTime? requiredDate, int? vendorId);
    Task<bool> ApproveServiceRequestAsync(int serviceRequestId, int userId, decimal? approvedValue);
    Task<object> GetValueExhaustionAsync(int contractId);
    Task<object> GetRetentionAsync(int contractId);
    Task<bool> ReleaseRetentionAsync(int retentionId, int userId);
    Task<object> GetContractDashboardAsync(int contractId);
    Task<object> GetExpiringAsync(int days);
    Task<object?> CompleteMilestoneAsync(int contractId, int milestoneId);
    Task<object> GetPenaltiesAsync(int contractId);
    Task<object?> RecordPenaltyAsync(int contractId, string type, decimal amount, string? reason);
    Task<object> GetDetailItemsAsync(int contractId);
}
