using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/informal-tenders")]
public class InformalTenderController : ControllerBase
{
    private readonly IInformalTenderService _service;

    public InformalTenderController(IInformalTenderService service) { _service = service; }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? financialYear, [FromQuery] int? statusId, [FromQuery] string? status,
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (!string.IsNullOrEmpty(status) && !statusId.HasValue)
        {
            statusId = Helpers.StatusMapper.ToStatusId("informal_tender", status);
        }
        var result = await _service.GetAllAsync(financialYear, statusId, search, page, pageSize);
        var summary = await _service.GetSummaryAsync(financialYear);
        return Ok(new
        {
            data = result.Items,
            total = result.TotalCount,
            totalPages = (int)Math.Ceiling((double)result.TotalCount / pageSize),
            page = result.Page,
            pageSize = result.PageSize,
            summary
        });
    }

    [HttpGet("config")]
    public IActionResult GetConfig()
        => Ok(new
        {
            config = new
            {
                thresholds = new { min = 2000, max = 200000 },
                evaluationCriteria = Array.Empty<object>(),
                defaultValidityDays = 30,
                minVendors = 3
            }
        });

    [HttpGet("reports/exception")]
    public IActionResult GetExceptionReport([FromQuery] string? status, [FromQuery] string? closingFromDate, [FromQuery] string? closingToDate)
        => Ok(new { exceptions = Array.Empty<object>() });

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard([FromQuery] string? financialYear)
    {
        var summary = await _service.GetSummaryAsync(financialYear);
        var total = summary.Values.Sum();
        return Ok(new
        {
            total,
            open = summary.GetValueOrDefault("published", 0),
            pendingAward = summary.GetValueOrDefault("adjudicated", 0),
            completed = summary.GetValueOrDefault("completed", 0),
            totalValue = 0m,
            avgDays = 0,
            draft = summary.GetValueOrDefault("draft", 0),
            published = summary.GetValueOrDefault("published", 0),
            closed = summary.GetValueOrDefault("closed", 0),
            adjudicated = summary.GetValueOrDefault("adjudicated", 0),
            awarded = summary.GetValueOrDefault("awarded", 0),
            approved = summary.GetValueOrDefault("approved", 0),
            voided = summary.GetValueOrDefault("voided", 0)
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(new { error = "Not found" });
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] object dto)
    {
        var result = await _service.CreateAsync(dto);
        return Ok(new { tender = result });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] object dto)
    {
        var success = await _service.UpdateAsync(id, dto);
        if (!success) return NotFound(new { error = "Not found" });
        var updated = await _service.GetByIdAsync(id);
        return Ok(new { tender = updated });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success) return NotFound(new { error = "Not found" });
        return Ok(new { message = "Deleted" });
    }

    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(int id)
    {
        var result = await _service.TransitionStatusAsync(id, "published");
        if (result == null) return NotFound(new { error = "Not found" });
        return Ok(new { tender = result });
    }

    [HttpPost("{id}/close")]
    public async Task<IActionResult> Close(int id)
    {
        var result = await _service.TransitionStatusAsync(id, "closed");
        if (result == null) return NotFound(new { error = "Not found" });
        return Ok(new { tender = result });
    }

    [HttpPost("{id}/adjudicate")]
    public async Task<IActionResult> Adjudicate(int id, [FromBody] object dto)
    {
        var result = await _service.AdjudicateAsync(id, dto);
        if (result == null) return NotFound(new { error = "Not found" });
        return Ok(new { tender = result });
    }

    [HttpPost("{id}/award")]
    public async Task<IActionResult> Award(int id)
    {
        var result = await _service.TransitionStatusAsync(id, "awarded");
        if (result == null) return NotFound(new { error = "Not found" });
        return Ok(new { tender = result });
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] object dto)
    {
        var result = await _service.TransitionStatusAsync(id, "approved", dto);
        if (result == null) return NotFound(new { error = "Not found" });
        return Ok(new { tender = result });
    }

    [HttpPost("{id}/void")]
    public async Task<IActionResult> VoidTender(int id, [FromBody] object dto)
    {
        var result = await _service.TransitionStatusAsync(id, "voided", dto);
        if (result == null) return NotFound(new { error = "Not found" });
        return Ok(new { tender = result });
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> Complete(int id)
    {
        var result = await _service.TransitionStatusAsync(id, "completed");
        if (result == null) return NotFound(new { error = "Not found" });
        return Ok(new { tender = result });
    }

    [HttpPost("{id}/select-vendors")]
    public async Task<IActionResult> SelectVendors(int id, [FromBody] object dto)
    {
        var result = await _service.SelectVendorsAsync(id, dto);
        if (result == null) return NotFound(new { error = "Not found" });
        return Ok(result);
    }

    [HttpPost("{id}/vendor-response")]
    public async Task<IActionResult> VendorResponse(int id, [FromBody] object dto)
    {
        var result = await _service.RecordVendorResponseAsync(id, dto);
        if (result == null) return NotFound(new { error = "Not found" });
        return Ok(new { tender = result });
    }

    [HttpGet("{id}/bids")]
    public async Task<IActionResult> GetBids(int id)
    {
        var result = await _service.GetVendorsAsync(id);
        return Ok(new { data = result });
    }

    [HttpGet("{id}/evaluation")]
    public async Task<IActionResult> GetEvaluation(int id)
    {
        var result = await _service.GetEvaluationAsync(id);
        return Ok(result);
    }
}
