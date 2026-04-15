using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/ems/budget-consumption")]
public class EmsBudgetConsumptionController : ControllerBase
{
    private readonly EmsBudgetConsumptionService _svc;

    public EmsBudgetConsumptionController(EmsBudgetConsumptionService svc)
    {
        _svc = svc;
    }

    [HttpGet("report")]
    public async Task<IActionResult> GetReport(
        [FromQuery] string finYear,
        [FromQuery] int? divisionId,
        [FromQuery] int? projectId)
    {
        var result = await _svc.GetBudgetConsumptionReportAsync(finYear, divisionId, projectId);
        return Ok(result);
    }

    [HttpGet("balance/{planProjectItemId:int}")]
    public async Task<IActionResult> GetBalance(int planProjectItemId, [FromQuery] string finYear)
    {
        var result = await _svc.GetCurrentBalanceAsync(planProjectItemId, finYear);
        if (result == null) return Ok(new { planProjectItemId, message = "No consumption history" });
        return Ok(result);
    }

    [HttpGet("history/{planProjectItemId:int}")]
    public async Task<IActionResult> GetHistory(int planProjectItemId, [FromQuery] string finYear)
    {
        var result = await _svc.GetConsumptionHistoryAsync(planProjectItemId, finYear);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> InsertConsumption([FromBody] EmsConsumptionInsertRequest req)
    {
        var result = await _svc.InsertConsumptionAsync(req);
        return Ok(result);
    }
}
