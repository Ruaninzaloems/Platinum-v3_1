using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AssetManagement.Helpers;

/// <summary>
/// Extracts the calling user's ID for audit / capturer attribution.
///
/// Priority chain:
///   1. Authenticated identity (HttpContext.User claims, key "userId", "sub", or "id").
///      Populated automatically once JWT authentication middleware is added to
///      Program.cs — no code changes required here at that time.
///
///   2. X-User-Id request header — trusted-proxy channel: the Angular HTTP
///      interceptor sets this header after the session is validated, forwarding
///      the server-side session user ID to the bridge API.  This header should
///      only ever be set by the Angular application; do not expose this endpoint
///      directly to untrusted clients without adding network-level restrictions.
///
///   3. System fallback (1) — reserved for background / automated processes
///      that genuinely run without a user context (scheduled jobs, migrations).
///      Human-initiated requests should always satisfy path 1 or 2.
/// </summary>
public static class UserContextHelper
{
    private const string UserIdHeader = "X-User-Id";
    private static readonly string[] ClaimKeys = ["userId", ClaimTypes.NameIdentifier, "sub", "id"];

    public static int GetCapturerId(this ControllerBase controller)
    {
        // 1. Authenticated identity from middleware-populated claims
        var user = controller.HttpContext.User;
        if (user.Identity?.IsAuthenticated == true)
        {
            foreach (var key in ClaimKeys)
            {
                var val = user.FindFirstValue(key);
                if (val != null && int.TryParse(val, out var claimId) && claimId > 0)
                    return claimId;
            }
        }

        // 2. Forwarded header set by the Angular HTTP interceptor
        var raw = controller.Request.Headers[UserIdHeader].FirstOrDefault();
        if (raw != null && int.TryParse(raw, out var headerId) && headerId > 0)
            return headerId;

        // 3. System fallback — background / automated processes only
        return 1;
    }
}
