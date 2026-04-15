using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/water-inventory")]
public class WaterInventoryController : ControllerBase
{
    private readonly IWaterInventoryService _service;

    public WaterInventoryController(IWaterInventoryService service) { _service = service; }

    [HttpGet("readings")]
    public async Task<ActionResult<PagedApiResponse<object>>> GetReadings([FromQuery] string? search, [FromQuery] int? zoneId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetMeterReadingsAsync(search, zoneId, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("readings/{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetReadingById(int id)
    {
        var result = await _service.GetMeterReadingByIdAsync(id);
        if (result == null) return NotFound(ApiResponse.Fail("Not found"));
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("readings")]
    public async Task<ActionResult<ApiResponse<object>>> CreateReading([FromBody] object dto)
    {
        var result = await _service.CreateMeterReadingAsync(dto);
        return Ok(ApiResponse<object>.Ok(result, "Reading created"));
    }

    [HttpGet("meters")]
    public async Task<ActionResult<PagedApiResponse<object>>> GetMeters([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetMetersAsync(search, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("meters")]
    public async Task<ActionResult<ApiResponse<object>>> CreateMeter([FromBody] object dto)
    {
        var result = await _service.CreateMeterAsync(dto);
        return Ok(ApiResponse<object>.Ok(result, "Meter created"));
    }

    [HttpGet("consumption/{meterId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetConsumption(int meterId, [FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        var result = await _service.GetConsumptionReportAsync(meterId, fromDate, toDate);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("zones")]
    public async Task<ActionResult<ApiResponse<object>>> GetZones()
    {
        var result = await _service.GetZonesAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }
}
