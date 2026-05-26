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
        return Ok(ApiResponse<MeDto>.Success(UserToDto(devUser)));
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
    public ActionResult<ApiResponse<MeDto>> Me()
    {
        return Ok(ApiResponse<MeDto>.Success(UserToDto(_currentUser.Current)));
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
