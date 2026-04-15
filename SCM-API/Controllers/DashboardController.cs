using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetDashboard([FromQuery] string? financialYear)
    {
        var result = await _service.GetDashboardStatsAsync(financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("executive")]
    public async Task<ActionResult<ApiResponse<object>>> GetExecutiveDashboard([FromQuery] string? financialYear)
    {
        var result = await _service.GetExecutiveDashboardAsync(financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("compliance")]
    public async Task<ActionResult<ApiResponse<object>>> GetComplianceDashboard([FromQuery] string? financialYear)
    {
        var result = await _service.GetComplianceDashboardAsync(financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("operational")]
    public async Task<ActionResult<ApiResponse<object>>> GetOperationalDashboard([FromQuery] string? financialYear)
    {
        var result = await _service.GetOperationalDashboardAsync(financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("control-tower")]
    public async Task<ActionResult<ApiResponse<object>>> GetControlTowerDashboard([FromQuery] string? financialYear)
    {
        var result = await _service.GetControlTowerDashboardAsync(financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("ai-insights")]
    public async Task<ActionResult<ApiResponse<object>>> GetAiInsights([FromQuery] string? financialYear)
    {
        var result = await _service.GetAiInsightsAsync(financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("requisitions")]
    public async Task<ActionResult<ApiResponse<object>>> GetRequisitionStats([FromQuery] string? financialYear)
    {
        var result = await _service.GetRequisitionStatsAsync(financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("orders")]
    public async Task<ActionResult<ApiResponse<object>>> GetOrderStats([FromQuery] string? financialYear)
    {
        var result = await _service.GetOrderStatsAsync(financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("invoices")]
    public async Task<ActionResult<ApiResponse<object>>> GetInvoiceStats([FromQuery] string? financialYear)
    {
        var result = await _service.GetInvoiceStatsAsync(financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }
}
