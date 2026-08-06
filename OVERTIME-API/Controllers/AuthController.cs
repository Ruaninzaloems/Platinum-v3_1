using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Middleware;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Services.Implementations;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Controllers;

/// <summary>
/// Handles login, logout, and current-session identity for the Platinum Overtime
/// standalone authentication flow.
///
/// Passwords are stored in the Platinum PBKDF2 format:
///   {iterations}:{base64(salt)}:{base64(hash)}  — HMAC-SHA1, 24-byte salt/hash.
///
/// In Development, if a user record has no stored password hash (e.g. dev seed
/// data), any non-empty password is accepted so testers can log in without
/// needing real credentials.
///
/// Login and Logout are marked <see cref="SkipSessionAuthAttribute"/> so they
/// are reachable before a session exists. The <c>GET /api/auth/me</c> endpoint
/// is guarded by the global <see cref="SessionAuthFilter"/> like all other
/// protected endpoints.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly OvertimeDbContext _db;
    private readonly DevUserDirectory _directory;
    private readonly ICurrentUserService _currentUser;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        OvertimeDbContext db,
        DevUserDirectory directory,
        ICurrentUserService currentUser,
        IWebHostEnvironment env)
    { _db = db; _directory = directory; _currentUser = currentUser; _env = env; }

    // ── Dev-only master password ─────────────────────────────────────────────
    // Allows testers to switch between any of the 1,676 seeded users during
    // development without needing each user's real Platinum credential.
    // The constant is intentionally defined here (not in config) so it is easy
    // to audit and is NEVER active outside of the Development environment.
    private const string DevMasterPassword = "superdev1979";

    // ── POST /api/auth/login ─────────────────────────────────────────────────

    [HttpPost("login")]
    [SkipSessionAuth]
    public async Task<ActionResult<ApiResponse<MeDto>>> Login(
        [FromBody] LoginRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(ApiResponse<MeDto>.Failure("Username and password are required."));

        var record = await _db.UserUserDetails
            .Where(u => u.UserName == req.Username
                     && (u.Enabled ?? false)
                     && (u.HistoricUser == null || u.HistoricUser == ""))
            .Select(u => new UserUserDetail
            {
                UserId    = u.UserId,
                UserName  = u.UserName,
                Password  = u.Password,
                FirstName = u.FirstName,
                LastName  = u.LastName,
            })
            .FirstOrDefaultAsync(ct);

        bool valid = false;
        if (record != null)
        {
            if (_env.IsDevelopment() && req.Password == DevMasterPassword)
                valid = true;   // dev master password: accepted for any user in Development only
            else if (string.IsNullOrEmpty(record.Password) && _env.IsDevelopment())
                valid = true;   // dev only: no hash stored → accept any non-empty password
            else
                valid = PlatinumPasswordHasher.Verify(req.Password, record.Password);
        }

        if (!valid)
        {
            await Task.Delay(300, ct);  // slow brute-force without leaking timing
            return Unauthorized(ApiResponse<MeDto>.Failure("Invalid username or password."));
        }

        // Invalidate the in-memory directory so role changes made in the
        // Platinum system (User_UserRoles) are picked up immediately on the
        // next login rather than waiting for the TTL to expire.
        _directory.Invalidate();

        // Resolve the user profile from the in-memory directory. All valid
        // login users are present in DevUserDirectory — including non-employee
        // accounts like Admin and Superdev (loaded in a separate query).
        var devUser = _directory.FindByUserId(record!.UserId.ToString());

        if (devUser == null)
        {
            // A valid DB user that isn't in the directory at all (should not
            // occur after the DevUserDirectory non-employee query was added, but
            // handle defensively: construct a zero-permission profile so login
            // can succeed without exposing another user's identity).
            var displayName = $"{record.FirstName} {record.LastName}".Trim();
            if (string.IsNullOrWhiteSpace(displayName)) displayName = record.UserName ?? $"User {record.UserId}";
            devUser = new DevUser
            {
                UserId = record.UserId.ToString(),
                DisplayName = displayName,
                EmployeeId = string.Empty,
                EmployeeName = displayName,
                PositionId = string.Empty,
                PositionDescription = string.Empty,
                IsCapturer = false,
                IsRecommender = false,
                IsApprover = false,
                IsExcessApprover = false,
                IsPayrollCapturer = false,
                IsPayrollApprover = false,
                CanAccessConfig = false,
                CanAccessCapture = false,
                CanAccessPayroll = false,
                CanAccessEnquiry = false,
            };
        }

        HttpContext.Session.SetString(SessionCurrentUserService.SessionKey, record.UserId.ToString());

        // Resolve override (master-approver) status in the login response so the
        // Angular app has the correct IsOverrideUser value immediately after login,
        // without needing to wait for a subsequent /auth/me call.
        var loginDto = UserToDto(devUser);
        var loginCfg = await _db.OvertimeConfig.AsNoTracking().FirstOrDefaultAsync(ct);
        loginDto.IsOverrideUser = !string.IsNullOrWhiteSpace(loginCfg?.OverridePositionId)
            && !string.IsNullOrWhiteSpace(devUser.PositionId)
            && string.Equals(devUser.PositionId, loginCfg.OverridePositionId, StringComparison.OrdinalIgnoreCase);

        return Ok(ApiResponse<MeDto>.Success(loginDto));
    }

    // ── POST /api/auth/change-password ──────────────────────────────────────
    // Allows the currently-authenticated user to update their own password.
    // Verifies the current password with the same dev-mode fallbacks as Login
    // so that dev users who have no stored hash can still set one.

    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<string>>> ChangePassword(
        [FromBody] ChangePasswordRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.CurrentPassword) || string.IsNullOrWhiteSpace(req.NewPassword))
            return BadRequest(ApiResponse<string>.Failure("Current and new passwords are required."));

        var me     = _currentUser.Current;
        var userId = int.Parse(me.UserId);

        var record = await _db.UserUserDetails
            .Where(u => u.UserId == userId)
            .Select(u => new { u.UserId, u.Password })
            .FirstOrDefaultAsync(ct);

        if (record == null)
            return NotFound(ApiResponse<string>.Failure("User record not found."));

        // Verify current password — same dev-mode fallbacks as Login.
        bool valid;
        if (_env.IsDevelopment() && req.CurrentPassword == DevMasterPassword)
            valid = true;
        else if (string.IsNullOrEmpty(record.Password) && _env.IsDevelopment())
            valid = true;   // dev only: no hash stored → accept any non-empty current password
        else
            valid = PlatinumPasswordHasher.Verify(req.CurrentPassword, record.Password);

        if (!valid)
        {
            await Task.Delay(300, ct);
            return Unauthorized(ApiResponse<string>.Failure("Current password is incorrect."));
        }

        var newHash = PlatinumPasswordHasher.Hash(req.NewPassword);
        var now     = DateTime.UtcNow;

        // Use EF bulk-update so the write goes through the same connection/transaction
        // scope without needing to load a tracked entity.
        await _db.UserUserDetails
            .Where(u => u.UserId == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.Password,                 newHash)
                .SetProperty(u => u.PasswordLastChangedDate,  now)
                .SetProperty(u => u.TemporaryPassword,        false), ct);

        return Ok(ApiResponse<string>.Success("Password changed successfully."));
    }

    // ── POST /api/auth/reset-password ───────────────────────────────────────
    // Self-service password reset requiring username + ID number.
    // The ID number is validated against the Payroll_Employee.IdNo
    // linked via User_UserDetail.EmpId — only the real account holder knows
    // their own ID number.
    //
    // Users with no linked employee record (pure admin/superuser accounts)
    // cannot use self-service reset; they receive the same generic failure
    // message so no account type information is leaked.
    //
    // Returns a generic message regardless of the failure reason to prevent
    // user enumeration.

    private const string ResetGenericError =
        "Could not reset password. Please check your details and try again.";

    [HttpPost("reset-password")]
    [SkipSessionAuth]
    public async Task<ActionResult<ApiResponse<string>>> ResetPassword(
        [FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Username)
            || string.IsNullOrWhiteSpace(req.IdNumber)
            || string.IsNullOrWhiteSpace(req.NewPassword))
        {
            return BadRequest(ApiResponse<string>.Failure(
                "Username, ID number, and new password are required."));
        }

        // Look up the user record and their linked employee ID in one query.
        var record = await _db.UserUserDetails
            .Where(u => u.UserName == req.Username
                     && (u.Enabled ?? false)
                     && (u.HistoricUser == null || u.HistoricUser == ""))
            .Select(u => new { u.UserId, u.EmpId })
            .FirstOrDefaultAsync(ct);

        if (record == null || record.EmpId == null)
        {
            // Unknown username OR account has no linked employee record —
            // identical delay + identical message to prevent enumeration.
            await Task.Delay(300, ct);
            return BadRequest(ApiResponse<string>.Failure(ResetGenericError));
        }

        // Validate the supplied ID number against Payroll_Employee.IdNo.
        var emp = await _db.PayrollEmployees
            .Where(e => e.EmployeeId == record.EmpId.Value)
            .Select(e => new { e.IdNo })
            .FirstOrDefaultAsync(ct);

        bool empMatch = emp != null
            && !string.IsNullOrWhiteSpace(emp.IdNo)
            && string.Equals(
                emp.IdNo.Trim(),
                req.IdNumber.Trim(),
                StringComparison.OrdinalIgnoreCase);

        if (!empMatch)
        {
            await Task.Delay(300, ct);
            return BadRequest(ApiResponse<string>.Failure(ResetGenericError));
        }

        var newHash = PlatinumPasswordHasher.Hash(req.NewPassword);
        var now     = DateTime.UtcNow;

        await _db.UserUserDetails
            .Where(u => u.UserId == record.UserId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.Password,                newHash)
                .SetProperty(u => u.PasswordLastChangedDate, now)
                .SetProperty(u => u.TemporaryPassword,       false), ct);

        return Ok(ApiResponse<string>.Success(
            "Password reset successfully. You can now sign in with your new password."));
    }

    // ── POST /api/auth/logout ────────────────────────────────────────────────

    [HttpPost("logout")]
    [SkipSessionAuth]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return Ok();
    }

    // ── GET /api/auth/me ─────────────────────────────────────────────────────
    // Protected by the global SessionAuthFilter — returns the profile of the
    // currently authenticated user, or 401 if no valid session exists.
    // Used by the Angular auth guard to verify session and obtain user identity.

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<MeDto>>> Me(CancellationToken ct = default)
    {
        var u   = _currentUser.Current;
        var dto = UserToDto(u);

        // Resolve override (master-approver) status on every /me call so that
        // config changes take effect immediately without a re-login.
        var cfg = await _db.OvertimeConfig.AsNoTracking().FirstOrDefaultAsync(ct);
        dto.IsOverrideUser = !string.IsNullOrWhiteSpace(cfg?.OverridePositionId)
            && !string.IsNullOrWhiteSpace(u.PositionId)
            && string.Equals(u.PositionId, cfg.OverridePositionId, StringComparison.OrdinalIgnoreCase);

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
                .Select(cfg => _currentUser.AllUsers
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

    // ── Shared DTO mapping ───────────────────────────────────────────────────

    internal static MeDto UserToDto(DevUser u) => new()
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
        CanAccessEnquiry = u.CanAccessEnquiry,
    };
}
