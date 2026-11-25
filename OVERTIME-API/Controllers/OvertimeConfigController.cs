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
    private readonly ICurrentUserService _currentUser;

    public OvertimeConfigController(IOvertimeConfigService service, ICurrentUserService currentUser)
    {
        _service     = service;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var data = await _service.GetAsync(ct);
        return Ok(ApiResponse<object>.Success(data));
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateOvertimeConfigRequest request, CancellationToken ct)
    {
        // Only users with config-admin access may write overtime configuration.
        // Because OverridePositionId now controls global workflow-action authority,
        // this check is a hard security boundary — not just a UI convenience.
        if (!_currentUser.Current.CanAccessConfig)
            return StatusCode(403, ApiResponse<object>.Failure(
                "You do not have permission to update overtime configuration."));

        var updatedBy = _currentUser.Current.DisplayName;
        var data = await _service.UpdateAsync(request, updatedBy, ct);
        return Ok(ApiResponse<object>.Success(data, "Overtime configuration saved."));
    }
}
