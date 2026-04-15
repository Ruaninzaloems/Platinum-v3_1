using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/workflow")]
public class WorkflowController : ControllerBase
{
    private readonly IWorkflowService _service;

    public WorkflowController(IWorkflowService service) { _service = service; }

    [HttpGet("steps/{entityType}")]
    public async Task<ActionResult<ApiResponse<object>>> GetSteps(string entityType)
    {
        var result = await _service.GetWorkflowStepsAsync(entityType);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("chain/{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetApprovalChain(string entityType, int entityId)
    {
        var result = await _service.GetApprovalChainAsync(entityType, entityId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("advance")]
    public async Task<ActionResult<ApiResponse<object>>> Advance([FromQuery] int entityId, [FromQuery] string entityType, [FromBody] object dto)
    {
        var success = await _service.AdvanceWorkflowAsync(entityId, entityType, dto);
        return Ok(ApiResponse.Ok("Workflow advanced"));
    }

    [HttpPost("reject")]
    public async Task<ActionResult<ApiResponse<object>>> Reject([FromQuery] int entityId, [FromQuery] string entityType, [FromBody] object dto)
    {
        await _service.RejectAsync(entityId, entityType, dto);
        return Ok(ApiResponse.Ok("Rejected"));
    }

    [HttpPost("return")]
    public async Task<ActionResult<ApiResponse<object>>> Return([FromQuery] int entityId, [FromQuery] string entityType, [FromBody] object dto)
    {
        await _service.ReturnAsync(entityId, entityType, dto);
        return Ok(ApiResponse.Ok("Returned"));
    }

    [HttpGet("pending")]
    public async Task<ActionResult<ApiResponse<object>>> GetPending([FromQuery] int userId = 1, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetPendingApprovalsAsync(userId, page, pageSize);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("history/{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetHistory(string entityType, int entityId)
    {
        var result = await _service.GetApprovalHistoryAsync(entityType, entityId);
        return Ok(ApiResponse<object>.Ok(result));
    }
}
