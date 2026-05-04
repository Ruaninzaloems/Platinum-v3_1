using Microsoft.AspNetCore.Mvc;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Controllers;

[ApiController]
[Route("api/workflow")]
public class WorkflowController : ControllerBase
{
    private readonly IWorkflowService _service;
    public WorkflowController(IWorkflowService service) => _service = service;

    [HttpPost("{transactionId:guid}/submit")]
    public async Task<ActionResult<ApiResponse<OvertimeTransactionDto>>> Submit(
        Guid transactionId, [FromBody] WorkflowActionRequest? req, CancellationToken ct = default)
    {
        var resp = await _service.SubmitAsync(transactionId, req ?? new WorkflowActionRequest(), ct);
        return resp.IsSuccess ? Ok(resp) : BadRequest(resp);
    }

    [HttpPost("{transactionId:guid}/approve")]
    public async Task<ActionResult<ApiResponse<OvertimeTransactionDto>>> Approve(
        Guid transactionId, [FromBody] WorkflowActionRequest? req, CancellationToken ct = default)
    {
        var resp = await _service.ApproveAsync(transactionId, req ?? new WorkflowActionRequest(), ct);
        return resp.IsSuccess ? Ok(resp) : BadRequest(resp);
    }

    [HttpPost("{transactionId:guid}/return")]
    public async Task<ActionResult<ApiResponse<OvertimeTransactionDto>>> Return(
        Guid transactionId, [FromBody] WorkflowActionRequest? req, CancellationToken ct = default)
    {
        var resp = await _service.ReturnAsync(transactionId, req ?? new WorkflowActionRequest(), ct);
        return resp.IsSuccess ? Ok(resp) : BadRequest(resp);
    }

    [HttpPost("{transactionId:guid}/reject")]
    public async Task<ActionResult<ApiResponse<OvertimeTransactionDto>>> Reject(
        Guid transactionId, [FromBody] WorkflowActionRequest? req, CancellationToken ct = default)
    {
        var resp = await _service.RejectAsync(transactionId, req ?? new WorkflowActionRequest(), ct);
        return resp.IsSuccess ? Ok(resp) : BadRequest(resp);
    }

    [HttpGet("{transactionId:guid}/history")]
    public async Task<ActionResult<ApiResponse<List<WorkflowEventDto>>>> History(
        Guid transactionId, CancellationToken ct = default)
        => Ok(await _service.HistoryAsync(transactionId, ct));
}
