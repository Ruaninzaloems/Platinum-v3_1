using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/integration")]
public class IntegrationController : ControllerBase
{
    private readonly IIntegrationService _service;

    public IntegrationController(IIntegrationService service) { _service = service; }

    [HttpGet("dashboard")]
    public ActionResult GetDashboard()
        => Ok(ApiResponse<object>.Ok(new { status = "Connected", lastSync = DateTime.UtcNow.AddHours(-1), systems = Array.Empty<object>() }));

    [HttpGet("posting-log")]
    public ActionResult GetPostingLog([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(Array.Empty<object>());

    [HttpGet("gl/entries")]
    public ActionResult GetGlEntries([FromQuery] string? financialYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new { data = Array.Empty<object>(), totalPages = 1, total = 0, page, pageSize });

    [HttpGet("gl/trial-balance")]
    public ActionResult GetTrialBalance([FromQuery] string? financialYear)
        => Ok(ApiResponse<object>.Ok(new { items = Array.Empty<object>(), totalDebit = 0m, totalCredit = 0m }));

    [HttpGet("budget/summary")]
    public ActionResult GetBudgetSummary([FromQuery] string? financialYear)
        => Ok(ApiResponse<object>.Ok(new { totalBudget = 0m, spent = 0m, committed = 0m, available = 0m }));

    [HttpGet("budget/vote-balances")]
    public ActionResult GetVoteBalances()
        => Ok(Array.Empty<object>());

    [HttpGet("mscoa/chart")]
    public ActionResult GetMscoaChart()
        => Ok(ApiResponse<object>.Ok(new { segments = Array.Empty<object>() }));

    [HttpGet("mscoa/inventory-mappings")]
    public ActionResult GetMscoaMappings()
        => Ok(Array.Empty<object>());

    [HttpPost("mscoa/validate")]
    public ActionResult ValidateMscoa([FromBody] object dto)
        => Ok(ApiResponse<object>.Ok(new { valid = true, errors = Array.Empty<string>() }));

    [HttpGet("period-close/status")]
    public ActionResult GetPeriodCloseStatus()
        => Ok(ApiResponse<object>.Ok(new { currentPeriod = DateTime.UtcNow.ToString("yyyy-MM"), status = "Open", items = Array.Empty<object>() }));

    [HttpPost("period-close/items/{itemId}/complete")]
    public ActionResult CompletePeriodCloseItem(int itemId)
        => Ok(ApiResponse.Ok("Item completed"));

    [HttpPost("period-close/approve")]
    public ActionResult ApprovePeriodClose()
        => Ok(ApiResponse.Ok("Period close approved"));

    [HttpGet("mfma/section71-report")]
    public ActionResult GetSection71Report()
        => Ok(ApiResponse<object>.Ok(new { reportDate = DateTime.UtcNow, sections = Array.Empty<object>() }));

    [HttpGet("mfma/section52-report")]
    public ActionResult GetSection52Report()
        => Ok(ApiResponse<object>.Ok(new { reportDate = DateTime.UtcNow, sections = Array.Empty<object>() }));

    [HttpGet("mfma/section65-compliance")]
    public ActionResult GetSection65Compliance()
        => Ok(ApiResponse<object>.Ok(new { complianceRate = 100.0, items = Array.Empty<object>() }));

    [HttpGet("mfma/unauthorized-expenditure")]
    public ActionResult GetUnauthorizedExpenditure()
        => Ok(ApiResponse<object>.Ok(new { total = 0m, items = Array.Empty<object>() }));

    [HttpGet("status")]
    public async Task<ActionResult<ApiResponse<object>>> GetStatus()
    {
        var result = await _service.GetIntegrationStatusAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("sync/vendors")]
    public async Task<ActionResult<ApiResponse<object>>> SyncVendors()
    {
        var result = await _service.SyncVendorsAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("sync/employees")]
    public async Task<ActionResult<ApiResponse<object>>> SyncEmployees()
    {
        var result = await _service.SyncEmployeesAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("csd/import")]
    public async Task<ActionResult<ApiResponse<object>>> ImportCsd([FromBody] object dto)
    {
        var result = await _service.ImportCsdDataAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("csd/verify/{registrationNumber}")]
    public async Task<ActionResult<ApiResponse<object>>> VerifyCsd(string registrationNumber)
    {
        var result = await _service.GetCsdVerificationAsync(registrationNumber);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("gl/export")]
    public async Task<ActionResult<ApiResponse<object>>> ExportToGl([FromQuery] string financialYear)
    {
        var result = await _service.ExportToGlAsync(financialYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("gl/postings")]
    public async Task<ActionResult<ApiResponse<object>>> GetGlPostings([FromQuery] string financialYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetGlPostingsAsync(financialYear, page, pageSize);
        return Ok(ApiResponse<object>.Ok(result));
    }
}
