using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IWorkflowService
{
    Task<object> GetWorkflowStepsAsync(string entityType);
    Task<object> GetApprovalChainAsync(string entityType, int entityId);
    Task<bool> AdvanceWorkflowAsync(int entityId, string entityType, object approvalDto);
    Task<bool> RejectAsync(int entityId, string entityType, object rejectionDto);
    Task<bool> ReturnAsync(int entityId, string entityType, object returnDto);
    Task<object> GetPendingApprovalsAsync(int userId, int page, int pageSize);
    Task<object> GetApprovalHistoryAsync(string entityType, int entityId);
}
