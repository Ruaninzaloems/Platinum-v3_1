using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;

namespace PlatinumOvertime_API.Services.Interfaces;

public interface IWorkflowService
{
    Task<ApiResponse<OvertimeTransactionDto>> SubmitAsync(Guid transactionId, WorkflowActionRequest req, CancellationToken ct = default);
    Task<ApiResponse<OvertimeTransactionDto>> ApproveAsync(Guid transactionId, WorkflowActionRequest req, CancellationToken ct = default);
    Task<ApiResponse<OvertimeTransactionDto>> ReturnAsync(Guid transactionId, WorkflowActionRequest req, CancellationToken ct = default);
    Task<ApiResponse<OvertimeTransactionDto>> RejectAsync(Guid transactionId, WorkflowActionRequest req, CancellationToken ct = default);
    Task<ApiResponse<List<WorkflowEventDto>>> HistoryAsync(Guid transactionId, CancellationToken ct = default);
}
