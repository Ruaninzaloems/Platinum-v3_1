using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/ems/budget-versions")]
public class EmsBudgetVersionController : ControllerBase
{
    private readonly EmsBudgetVersionService _svc;

    public EmsBudgetVersionController(EmsBudgetVersionService svc)
    {
        _svc = svc;
    }

    [HttpGet]
    public async Task<IActionResult> GetVersions([FromQuery] string? finYear)
    {
        var result = await _svc.GetVersionsAsync(finYear);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetVersionDetail(int id)
    {
        var result = await _svc.GetVersionDetailAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateVersion([FromBody] CreateVersionRequest req)
    {
        var result = await _svc.CreateVersionAsync(
            req.VersionNumber, req.VersionName, req.Comments, req.FinYear, req.UserId);
        return Ok(result);
    }

    [HttpPost("approve")]
    public async Task<IActionResult> InitiateBudgetApproval([FromBody] ApproveVersionRequest req)
    {
        var result = await _svc.InitiateBudgetApprovalAsync(req.FinYear, req.UserId);
        return Ok(result);
    }
}

public class CreateVersionRequest
{
    public string VersionNumber { get; set; } = "";
    public string VersionName { get; set; } = "";
    public string Comments { get; set; } = "";
    public string FinYear { get; set; } = "";
    public int UserId { get; set; } = 1;
}

public class ApproveVersionRequest
{
    public string FinYear { get; set; } = "";
    public int UserId { get; set; } = 1;
}
