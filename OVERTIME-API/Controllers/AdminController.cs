using Microsoft.AspNetCore.Mvc;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Services.Implementations;

namespace PlatinumOvertime_API.Controllers;

/// <summary>
/// Operational endpoints for managing server-side caches.
/// No permission guard — these actions are read-only against the database
/// and expose no data, so any caller (or ops tooling) may invoke them.
/// </summary>
[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly DevUserDirectory _directory;
    private readonly ILogger<AdminController> _log;

    public AdminController(DevUserDirectory directory, ILogger<AdminController> log)
    {
        _directory = directory;
        _log = log;
    }

    /// <summary>
    /// Invalidates the in-memory user directory and triggers an immediate
    /// reload from the database. Call this after onboarding new users,
    /// changing role assignments, or enabling/disabling employee records —
    /// without needing a full API process restart.
    /// </summary>
    [HttpPost("refresh-users")]
    public ActionResult<ApiResponse<RefreshUsersResult>> RefreshUsers()
    {
        _directory.Invalidate();
        var users = _directory.All;
        _log.LogInformation("User directory refreshed via API; {Count} users loaded.", users.Count);
        return Ok(ApiResponse<RefreshUsersResult>.Success(new RefreshUsersResult
        {
            UsersLoaded = users.Count,
            RefreshedAt = DateTime.UtcNow,
        }));
    }
}

public sealed class RefreshUsersResult
{
    public int UsersLoaded { get; init; }
    public DateTime RefreshedAt { get; init; }
}
