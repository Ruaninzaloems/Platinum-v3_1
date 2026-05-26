using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AssetManagement.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class AdminAuthorizeAttribute : ActionFilterAttribute
{
    // Stub-auth project: all users are system admin (ID = 1).
    // This set defines the admin user IDs recognised by the application.
    // Replace with claims/policy checks when a real identity provider is introduced.
    private static readonly IReadOnlySet<int> AdminUserIds = new HashSet<int> { 1 };

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.HttpContext.Request.Headers.TryGetValue("X-User-Id", out var h) ||
            !int.TryParse(h, out var uid) ||
            !AdminUserIds.Contains(uid))
        {
            context.Result = new ObjectResult(new { error = "Admin access required" })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }
        base.OnActionExecuting(context);
    }
}
