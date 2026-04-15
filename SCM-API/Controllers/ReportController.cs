using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/reports")]
public class ReportController : ControllerBase
{
    private readonly IReportService _service;

    public ReportController(IReportService service) { _service = service; }

    [HttpGet]
    public ActionResult GetAvailable()
        => Ok(Array.Empty<object>());

    [HttpPost("generate")]
    public async Task<ActionResult<ApiResponse<object>>> Generate([FromQuery] string reportType, [FromBody] object parameters)
    {
        var result = await _service.GenerateReportAsync(reportType, parameters);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById(int id)
    {
        var result = await _service.GetReportByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("history")]
    public async Task<ActionResult<PagedApiResponse<object>>> GetHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetReportHistoryAsync(page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("scheduled")]
    public ActionResult GetScheduled()
        => Ok(Array.Empty<object>());

    [HttpPost("{id}/generate")]
    public ActionResult GenerateById(int id)
        => Ok(ApiResponse<object>.Ok(new { reportId = id, status = "Queued", estimatedCompletion = DateTime.UtcNow.AddMinutes(5) }, "Report generation queued"));

    [HttpPost("schedule")]
    public ActionResult Schedule([FromBody] object dto)
        => Ok(ApiResponse.Ok("Report scheduled"));
}
