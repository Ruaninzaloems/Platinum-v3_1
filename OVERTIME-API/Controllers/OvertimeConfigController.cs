using Microsoft.AspNetCore.Mvc;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Controllers;

[ApiController]
[Route("api/overtime-config")]
public class OvertimeConfigController : ControllerBase
{
    private readonly IOvertimeConfigService _service;
    public OvertimeConfigController(IOvertimeConfigService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var data = await _service.GetAsync(ct);
        return Ok(ApiResponse<object>.Success(data));
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateOvertimeConfigRequest request, CancellationToken ct)
    {
        var updatedBy = User?.Identity?.Name;
        var data = await _service.UpdateAsync(request, updatedBy, ct);
        return Ok(ApiResponse<object>.Success(data, "Overtime configuration saved."));
    }
}
