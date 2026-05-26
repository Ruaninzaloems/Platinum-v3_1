using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Production implementation of <see cref="ICurrentUserService"/> that reads
/// the authenticated user from an ASP.NET Core server-side session.
///
/// The session key <see cref="SessionKey"/> is written by
/// <c>AuthController.Login</c> after successful PBKDF2 credential verification
/// and cleared by <c>AuthController.Logout</c>.
///
/// <c>IsAuthenticated</c> is checked by the global <c>SessionAuthFilter</c>
/// before action methods run, so <c>Current</c> is only called on authenticated
/// requests. If the session userId can no longer be resolved in the directory
/// (e.g. the user was deleted between login and this request), a zero-permission
/// sentinel is returned rather than falling back to the default user, preventing
/// privilege escalation.
///
/// Registered as Scoped (depends on IHttpContextAccessor).
/// DevUserDirectory is kept as a Singleton for the user-profile lookup so the
/// expensive DB query runs only once per process.
/// </summary>
public class SessionCurrentUserService : ICurrentUserService
{
    internal const string SessionKey = "platinum_ot_user_id";

    private static readonly DevUser UnresolvableSessionUser = new()
    {
        UserId              = string.Empty,
        DisplayName         = "Unknown User",
        EmployeeId          = string.Empty,
        EmployeeName        = string.Empty,
        PositionId          = string.Empty,
        PositionDescription = string.Empty,
        IsCapturer          = false,
        IsRecommender       = false,
        IsApprover          = false,
        IsExcessApprover    = false,
        IsPayrollCapturer   = false,
        IsPayrollApprover   = false,
        CanAccessConfig     = false,
        CanAccessCapture    = false,
        CanAccessPayroll    = false,
        CanAccessEnquiry    = false,
    };

    private readonly IHttpContextAccessor _http;
    private readonly DevUserDirectory     _directory;

    public SessionCurrentUserService(IHttpContextAccessor http, DevUserDirectory directory)
    { _http = http; _directory = directory; }

    public bool IsAuthenticated
    {
        get
        {
            var ctx = _http.HttpContext;
            if (ctx == null) return false;
            return !string.IsNullOrEmpty(ctx.Session.GetString(SessionKey));
        }
    }

    public DevUser Current
    {
        get
        {
            var userId = _http.HttpContext?.Session.GetString(SessionKey);
            if (!string.IsNullOrEmpty(userId))
            {
                var user = _directory.FindByUserId(userId);
                // Return the directory entry when found; otherwise return a
                // zero-permission sentinel rather than any other user's profile.
                return user ?? UnresolvableSessionUser;
            }
            // IsAuthenticated should have been checked first (by SessionAuthFilter).
            // Return the sentinel rather than an arbitrary default user.
            return UnresolvableSessionUser;
        }
    }

    public DevUser? FindByUserId(string userId) => _directory.FindByUserId(userId);
    public IReadOnlyList<DevUser> AllUsers => _directory.All;
}
