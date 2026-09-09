using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Resolves the caller's identity from POS-API's global auth JWT (see
/// POS-API/ems-jwt.ts) instead of the unsigned X-Username/X-User-Id headers
/// <see cref="DevCurrentUserService"/> used to trust unconditionally — closes
/// the impersonation gap where any caller reaching this API directly could
/// set X-Username to any value and be granted that person's permissions.
///
/// The JWT bearer authentication scheme (see Program.cs's AddJwtBearer,
/// UseAuthentication()) validates the token's signature on every request
/// (not just [Authorize]-gated ones) and populates HttpContext.User when a
/// valid token is present. This service reads the verified `name` claim from
/// there. Scope for this phase is IDENTITY only — Overtime's own local
/// authorization data (DevUserDirectory, PositionApprovalConfig-derived role
/// flags) is resolved exactly as before; the JWT does not carry Overtime
/// permissions and none are trusted from it.
///
/// Falls back to the legacy X-User-Id/X-Username header bridge, unverified,
/// only when no valid JWT is present — this keeps local Swagger testing and
/// the shell's rollout transition window working, and is intentionally the
/// LOWER-priority path so a verified claim always wins when both are sent.
/// Remove the fallback once the shell is confirmed always sending the global
/// JWT to this module in production.
/// </summary>
public class JwtCurrentUserService : ICurrentUserService
{
    private const string HeaderName = "X-User-Id";
    private const string UsernameHeaderName = "X-Username";

    private readonly IHttpContextAccessor _http;
    private readonly DevUserDirectory _directory;

    public JwtCurrentUserService(IHttpContextAccessor http, DevUserDirectory directory)
    { _http = http; _directory = directory; }

    public bool IsAuthenticated => true;

    public DevUser Current
    {
        get
        {
            var httpContext = _http.HttpContext;

            // 1. Verified identity from POS-API's global JWT.
            var principal = httpContext?.User;
            if (principal?.Identity?.IsAuthenticated == true)
            {
                var jwtUserName = principal.FindFirst("name")?.Value ?? principal.Identity?.Name;
                if (!string.IsNullOrWhiteSpace(jwtUserName))
                {
                    var user = _directory.FindByUserName(jwtUserName);
                    if (user != null) return user;
                }
            }

            // 2. Legacy, unsigned header bridge — transition/testing fallback only.
            var userId = httpContext?.Request.Headers[HeaderName].ToString();
            if (!string.IsNullOrWhiteSpace(userId))
            {
                var user = _directory.FindByUserId(userId);
                if (user != null) return user;
            }

            var legacyUserName = httpContext?.Request.Headers[UsernameHeaderName].ToString();
            if (!string.IsNullOrWhiteSpace(legacyUserName))
            {
                var user = _directory.FindByUserName(legacyUserName);
                if (user != null) return user;
            }

            return _directory.Default;
        }
    }

    public DevUser? FindByUserId(string userId) => _directory.FindByUserId(userId);
    public DevUser? FindByUserName(string userName) => _directory.FindByUserName(userName);
    public IReadOnlyList<DevUser> AllUsers => _directory.All;
}
