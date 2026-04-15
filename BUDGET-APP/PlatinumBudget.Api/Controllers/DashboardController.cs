using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;
    private readonly ValidationService _validationService;
    private readonly AiInsightsService _aiInsightsService;

    public DashboardController(DashboardService dashboardService, ValidationService validationService, AiInsightsService aiInsightsService)
    {
        _dashboardService = dashboardService;
        _validationService = validationService;
        _aiInsightsService = aiInsightsService;
    }

    [HttpGet("cfo")]
    public async Task<IActionResult> GetCfoDashboard([FromQuery] int? financialYearId) =>
        Ok(await _dashboardService.GetCfoDashboardAsync(financialYearId));

    [HttpGet("validation")]
    public async Task<IActionResult> GetValidationDashboard([FromQuery] int? versionId) =>
        Ok(await _validationService.GetDashboardAsync(versionId));

    [HttpGet("budget-overview/{versionId}")]
    public async Task<IActionResult> GetBudgetOverview(int versionId)
    {
        var result = await _dashboardService.GetBudgetOverviewAsync(versionId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("mtref-summary/{versionId}")]
    public async Task<IActionResult> GetMtrefSummary(int versionId) =>
        Ok(await _dashboardService.GetMtrefSummaryAsync(versionId));

    [HttpGet("ai-insights")]
    public async Task<IActionResult> GetAiInsights([FromQuery] int? financialYearId) =>
        Ok(await _aiInsightsService.GetAiAnalyticsAsync(financialYearId));
}
