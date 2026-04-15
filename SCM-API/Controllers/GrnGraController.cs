using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GrnGraController : ControllerBase
{
    private readonly IGrnGraService _service;

    public GrnGraController(IGrnGraService service) { _service = service; }

    [HttpGet("grn")]
    public async Task<ActionResult<PagedApiResponse<object>>> GetGrns(
        [FromQuery] string? financialYear, [FromQuery] int? statusId, [FromQuery] int? orderId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllAsync(financialYear, statusId, orderId, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("grn/{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetGrnById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<object>.Fail("GRN not found"));
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("grn")]
    public async Task<ActionResult<ApiResponse<object>>> CreateGrn([FromBody] object dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetGrnById), new { id = 0 }, ApiResponse<object>.Ok(result, "GRN created"));
    }

    [HttpGet("gra")]
    public async Task<ActionResult<PagedApiResponse<object>>> GetGras(
        [FromQuery] string? financialYear, [FromQuery] int? statusId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetGrasAsync(financialYear, statusId, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }
}
