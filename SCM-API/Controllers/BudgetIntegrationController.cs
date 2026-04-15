using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/budget")]
public class BudgetIntegrationController : ControllerBase
{
    private readonly IBudgetIntegrationService _service;

    public BudgetIntegrationController(IBudgetIntegrationService service) { _service = service; }

    [HttpGet("check")]
    public async Task<ActionResult<ApiResponse<object>>> CheckAvailability([FromQuery] string voteNumber, [FromQuery] decimal amount, [FromQuery] string financialYear)
    {
        var result = await _service.CheckBudgetAvailabilityAsync(voteNumber, amount, financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<object>>> GetSummary([FromQuery] string? financialYear, [FromQuery] int? departmentId)
    {
        var result = await _service.GetBudgetSummaryAsync(financialYear, departmentId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("reserve")]
    public async Task<ActionResult<ApiResponse<object>>> Reserve([FromBody] object dto)
    {
        var success = await _service.ReserveBudgetAsync(dto);
        return Ok(ApiResponse.Ok("Budget reserved"));
    }

    [HttpPost("release/{reservationId}")]
    public async Task<ActionResult<ApiResponse<object>>> Release(int reservationId)
    {
        var success = await _service.ReleaseBudgetAsync(reservationId);
        return Ok(ApiResponse.Ok("Budget released"));
    }

    [HttpGet("votes")]
    public async Task<ActionResult<ApiResponse<object>>> GetVoteBalances([FromQuery] string financialYear, [FromQuery] int? departmentId)
    {
        var result = await _service.GetVoteBalancesAsync(financialYear, departmentId);
        return Ok(ApiResponse<object>.Ok(result));
    }
}
