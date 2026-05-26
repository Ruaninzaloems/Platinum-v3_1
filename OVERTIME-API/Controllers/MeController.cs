using Microsoft.AspNetCore.Mvc;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Controllers;

/// <summary>
/// Reflects the current authenticated user back to the UI.
/// Returns 401 when no session is active so the Angular auth guard can redirect
/// unauthenticated requests to the login page.
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
        if (!_user.IsAuthenticated)
            return Unauthorized(ApiResponse<MeDto>.Failure("Not authenticated."));

        var dto = ToDto(_user.Current);
        return Ok(ApiResponse<MeDto>.Success(dto));
    }

    internal static MeDto ToDto(DevUser u) => new()
    {
        UserId              = u.UserId,
        DisplayName         = u.DisplayName,
        EmployeeId          = u.EmployeeId,
        EmployeeName        = u.EmployeeName,
        PositionId          = u.PositionId,
        PositionDescription = u.PositionDescription,
        IsCapturer          = u.IsCapturer,
        IsRecommender       = u.IsRecommender,
        IsApprover          = u.IsApprover,
        IsExcessApprover    = u.IsExcessApprover,
        IsPayrollCapturer   = u.IsPayrollCapturer,
        IsPayrollApprover   = u.IsPayrollApprover,
        CanAccessConfig     = u.CanAccessConfig,
        CanAccessCapture    = u.CanAccessCapture,
        CanAccessPayroll    = u.CanAccessPayroll,
        CanAccessEnquiry    = u.CanAccessEnquiry,
    };
}
