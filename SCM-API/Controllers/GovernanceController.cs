using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/governance")]
public class GovernanceController : ControllerBase
{
    private readonly IGovernanceService _service;

    public GovernanceController(IGovernanceService service) { _service = service; }

    [HttpGet("compliance/{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<object>>> CheckCompliance(string entityType, int entityId)
    {
        var result = await _service.GetComplianceCheckAsync(entityType, entityId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("deviations")]
    public async Task<ActionResult<ApiResponse<object>>> GetDeviations([FromQuery] string? financialYear, [FromQuery] int? statusId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetDeviationsAsync(financialYear, statusId, page, pageSize);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("deviations")]
    public async Task<ActionResult<ApiResponse<object>>> CreateDeviation([FromBody] object dto)
    {
        var result = await _service.CreateDeviationAsync(dto);
        return Ok(ApiResponse<object>.Ok(result, "Deviation created"));
    }

    [HttpPost("deviations/{id}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> ApproveDeviation(int id, [FromBody] object dto)
    {
        await _service.ApproveDeviationAsync(id, dto);
        return Ok(ApiResponse.Ok("Deviation approved"));
    }

    [HttpGet("regulations")]
    public async Task<ActionResult<ApiResponse<object>>> GetRegulations()
    {
        var result = await _service.GetRegulationsAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("thresholds")]
    public async Task<ActionResult<ApiResponse<object>>> GetThresholds()
    {
        var result = await _service.GetThresholdsAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("policy")]
    public async Task<ActionResult<ApiResponse<object>>> GetPolicy()
    {
        var result = await _service.GetScmPolicyAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("preferential")]
    public async Task<ActionResult<ApiResponse<object>>> GetPreferential([FromQuery] string? financialYear)
    {
        var result = await _service.GetPreferentialProcurementAsync(financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("bbbee/{vendorId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetBbbee(int vendorId)
    {
        var result = await _service.GetBbbeeComplianceAsync(vendorId);
        return Ok(ApiResponse<object>.Ok(result));
    }
}
