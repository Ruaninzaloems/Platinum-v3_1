using Microsoft.AspNetCore.Mvc;
using PlatinumAFS.Api.DTOs;
using PlatinumAFS.Api.Models;
using PlatinumAFS.Api.Services;

namespace PlatinumAFS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class GeneralLedgerController : ControllerBase
{
    private readonly GeneralLedgerService _service;

    public GeneralLedgerController(GeneralLedgerService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<GeneralLedgerEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GeneralLedgerEntry>>> GetAll(
        [FromQuery] string? finYear = null,
        [FromQuery] int? processingMonth = null,
        [FromQuery] string? documentNumber = null,
        [FromQuery] int? voteId = null,
        [FromQuery] string? scoaItemCode = null,
        [FromQuery] string? accountNo = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var (entries, totalCount) = await _service.GetEntriesAsync(
                finYear: finYear, processingMonth: processingMonth, documentNumber: documentNumber,
                voteId: voteId, scoaItemCode: scoaItemCode, accountNo: accountNo,
                page: page, pageSize: pageSize);
            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("by-financial-year/{**finYear}")]
    [ProducesResponseType(typeof(IEnumerable<GeneralLedgerEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GeneralLedgerEntry>>> GetByFinancialYear(
        string finYear,
        [FromQuery] int? processingMonth = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var (entries, totalCount) = await _service.GetEntriesAsync(
                finYear: finYear, processingMonth: processingMonth, page: page, pageSize: pageSize);
            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("by-document/{**documentNumber}")]
    [ProducesResponseType(typeof(IEnumerable<GeneralLedgerEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GeneralLedgerEntry>>> GetByDocumentNumber(
        string documentNumber,
        [FromQuery] string? finYear = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var (entries, totalCount) = await _service.GetEntriesAsync(
                finYear: finYear, documentNumber: documentNumber, page: page, pageSize: pageSize);
            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("by-vote/{voteId:int}")]
    [ProducesResponseType(typeof(IEnumerable<GeneralLedgerEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GeneralLedgerEntry>>> GetByVoteId(
        int voteId,
        [FromQuery] string? finYear = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var (entries, totalCount) = await _service.GetEntriesAsync(
                finYear: finYear, voteId: voteId, page: page, pageSize: pageSize);
            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("by-processing-month/{**finYearAndMonth}")]
    [ProducesResponseType(typeof(IEnumerable<GeneralLedgerEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GeneralLedgerEntry>>> GetByProcessingMonth(
        string finYearAndMonth,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var lastSlash = finYearAndMonth.LastIndexOf('/');
            if (lastSlash < 0 || !int.TryParse(finYearAndMonth[(lastSlash + 1)..], out var month))
                return BadRequest(new { error = "Invalid URL format. Expected: by-processing-month/{finYear}/{month}" });
            var finYear = finYearAndMonth[..lastSlash];
            var (entries, totalCount) = await _service.GetEntriesAsync(
                finYear: finYear, processingMonth: month, page: page, pageSize: pageSize);
            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("by-account/{accountNo}")]
    [ProducesResponseType(typeof(IEnumerable<GeneralLedgerEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GeneralLedgerEntry>>> GetByAccountNo(
        string accountNo,
        [FromQuery] string? finYear = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var (entries, totalCount) = await _service.GetEntriesAsync(
                finYear: finYear, accountNo: accountNo, page: page, pageSize: pageSize);
            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("by-scoa-item/{scoaItemCode}")]
    [ProducesResponseType(typeof(IEnumerable<GeneralLedgerEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GeneralLedgerEntry>>> GetByScoaItemCode(
        string scoaItemCode,
        [FromQuery] string? finYear = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var (entries, totalCount) = await _service.GetEntriesAsync(
                finYear: finYear, scoaItemCode: scoaItemCode, page: page, pageSize: pageSize);
            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(IEnumerable<GeneralLedgerSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GeneralLedgerSummaryDto>>> GetSummary(
        [FromQuery] string? finYear = null)
    {
        try
        {
            var results = await _service.GetSummaryAsync(finYear);
            var summary = results.Select(r => new GeneralLedgerSummaryDto
            {
                ProcessingMonth = r.Month,
                EntryCount = r.Count,
                TotalDebit = r.Debit,
                TotalCredit = r.Credit,
                TotalBalance = r.Balance
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
                api = "PlatinumAFS.Api (GeneralLedger)",
                dataSource = "Direct table access (Led_GeneralLedger, Led_Vote, Const_SCOA_*_Structure)"
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
