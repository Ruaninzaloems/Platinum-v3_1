using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
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
    private readonly OvertimeDbContext _db;

    public MeController(ICurrentUserService user, OvertimeDbContext db)
    {
        _user = user;
        _db   = db;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<MeDto>>> Get(CancellationToken ct = default)
    {
        if (!_user.IsAuthenticated)
            return Unauthorized(ApiResponse<MeDto>.Failure("Not authenticated."));

        var u   = _user.Current;
        var dto = ToDto(u);

        // Resolve which primary-position-holder userIds this user is actively deputising for.
        if (!string.IsNullOrWhiteSpace(u.EmployeeId))
        {
            var now = DateTime.UtcNow;
            var actingConfigs = await _db.PositionApprovalConfigs
                .Include(c => c.ActingAppointments)
                .Where(c => c.ActingAppointments.Any(a =>
                    a.ActingEmployeeId == u.EmployeeId
                    && a.StartDate <= now
                    && a.EndDate   >= now))
                .AsNoTracking()
                .ToListAsync(ct);

            dto.ActingForUserIds = actingConfigs
                .Select(cfg => _user.AllUsers
                    .FirstOrDefault(u2 => string.Equals(
                        u2.PositionId, cfg.PositionId,
                        StringComparison.OrdinalIgnoreCase))?.UserId)
                .Where(uid => !string.IsNullOrWhiteSpace(uid))
                .Select(uid => uid!)
                .Distinct()
                .ToList();
        }

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
