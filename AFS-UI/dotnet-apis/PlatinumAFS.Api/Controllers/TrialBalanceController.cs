using Microsoft.AspNetCore.Mvc;
using PlatinumAFS.Api.DTOs;
using PlatinumAFS.Api.Models;
using PlatinumAFS.Api.Services;

namespace PlatinumAFS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class TrialBalanceController : ControllerBase
{
    private readonly TrialBalanceService _service;

    public TrialBalanceController(TrialBalanceService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TrialBalanceEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TrialBalanceEntry>>> GetAll(
        [FromQuery] string? finYear = null,
        [FromQuery] string? sortDesc = null,
        [FromQuery] string? scoaItemCode = null,
        [FromQuery] int? voteId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var (entries, totalCount) = await _service.GetTrialBalanceAsync(
                finYear: finYear, sortDesc: sortDesc, scoaItemCode: scoaItemCode,
                voteId: voteId, page: page, pageSize: pageSize);
            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("by-financial-year/{**finYear}")]
    [ProducesResponseType(typeof(IEnumerable<TrialBalanceEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TrialBalanceEntry>>> GetByFinancialYear(
        string finYear,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var (entries, totalCount) = await _service.GetTrialBalanceAsync(finYear: finYear, page: page, pageSize: pageSize);
            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("by-category/{sortDesc}")]
    [ProducesResponseType(typeof(IEnumerable<TrialBalanceEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TrialBalanceEntry>>> GetByCategory(
        string sortDesc,
        [FromQuery] string? finYear = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var (entries, totalCount) = await _service.GetTrialBalanceAsync(
                finYear: finYear, sortDesc: sortDesc, page: page, pageSize: pageSize);
            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("by-scoa-item/{scoaItemCode}")]
    [ProducesResponseType(typeof(IEnumerable<TrialBalanceEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TrialBalanceEntry>>> GetByScoaItemCode(
        string scoaItemCode,
        [FromQuery] string? finYear = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var (entries, totalCount) = await _service.GetTrialBalanceAsync(
                finYear: finYear, scoaItemCode: scoaItemCode, page: page, pageSize: pageSize);
            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("by-vote/{voteId:int}")]
    [ProducesResponseType(typeof(TrialBalanceEntry), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TrialBalanceEntry>> GetByVoteId(
        int voteId,
        [FromQuery] string? finYear = null)
    {
        try
        {
            var (entries, _) = await _service.GetTrialBalanceAsync(
                finYear: finYear, voteId: voteId, page: 1, pageSize: 1);

            if (entries.Count == 0)
                return NotFound();

            return Ok(entries[0]);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(IEnumerable<TrialBalanceSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TrialBalanceSummaryDto>>> GetSummaryByCategory(
        [FromQuery] string? finYear = null)
    {
        try
        {
            var results = await _service.GetSummaryAsync(finYear);
            var summary = results.Select(r => new TrialBalanceSummaryDto
            {
                SortDesc = r.SortDesc,
                EntryCount = r.Count,
                TotalOpeningBalance = r.OpenBal,
                TotalDebit = r.Debit,
                TotalCredit = r.Credit,
                TotalClosingBalance = r.CloseBal,
                TotalBudgetOriginal = r.BudgetOrig,
                TotalBudgetAdjusted = r.BudgetAdj
            });
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("financial-years")]
    [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<string>>> GetFinancialYears()
    {
        var years = await _service.GetAvailableFinancialYearsAsync();
        return Ok(years);
    }

    [HttpGet("health")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult> HealthCheck()
    {
        try
        {
            var years = await _service.GetAvailableFinancialYearsAsync();
            return Ok(new
            {
                status = "healthy",
                database = "connected",
                availableYears = years.Count,
                timestamp = DateTime.UtcNow,
                api = "PlatinumAFS.Api (TrialBalance)",
                dataSource = "Direct table access (Led_Vote, Led_GeneralLedger, Const_SCOA_Structure)"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                status = "unhealthy",
                database = "disconnected",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    private void SetPaginationHeaders(int totalCount, int page, int pageSize)
    {
        Response.Headers.Append("X-Total-Count", totalCount.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());
    }
}
