using Microsoft.AspNetCore.Mvc;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Controllers;

/// <summary>
/// Reflects the current authenticated user back to the UI. The dev shim
/// reads X-User-Id; the response also lists every available dev user so the
/// "switch user" widget in the UI doesn't need a separate endpoint.
/// </summary>
[ApiController]
[Route("api/me")]
public class MeController : ControllerBase
{
    private readonly ICurrentUserService _user;
    public MeController(ICurrentUserService user) => _user = user;

    [HttpGet]
    public ActionResult<ApiResponse<MeDto>> Get()
    {
        var u = _user.Current;
        var dto = ToDto(u);
        dto.AvailableUsers = _user.AllUsers.Select(ToDto).ToList();
        return Ok(ApiResponse<MeDto>.Success(dto));
    }

    private static MeDto ToDto(DevUser u) => new()
    {
        UserId = u.UserId,
        DisplayName = u.DisplayName,
        EmployeeId = u.EmployeeId,
        EmployeeName = u.EmployeeName,
        PositionId = u.PositionId,
        PositionDescription = u.PositionDescription,
        IsCapturer = u.IsCapturer,
        IsRecommender = u.IsRecommender,
        IsApprover = u.IsApprover,
        IsExcessApprover = u.IsExcessApprover,
        IsPayrollCapturer = u.IsPayrollCapturer,
        IsPayrollApprover = u.IsPayrollApprover,
        CanAccessConfig = u.CanAccessConfig,
        CanAccessCapture = u.CanAccessCapture,
        CanAccessPayroll = u.CanAccessPayroll,
        CanAccessEnquiry = u.CanAccessEnquiry
    };
}
