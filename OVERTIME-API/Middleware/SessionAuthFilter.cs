using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Middleware;

/// <summary>
/// Global MVC action filter that enforces session authentication on every API
/// endpoint. Endpoints decorated with <see cref="SkipSessionAuthAttribute"/>
/// (on either the action or its controller class) are exempted — use this for
/// <c>POST /api/auth/login</c> and <c>POST /api/auth/logout</c>.
///
/// The filter runs before the action method so unauthenticated requests never
/// reach business logic regardless of whether the endpoint checks
/// <c>ICurrentUserService.IsAuthenticated</c> itself.
/// </summary>
public class SessionAuthFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        var skip = context.ActionDescriptor.EndpointMetadata
            .OfType<SkipSessionAuthAttribute>()
            .Any();
        if (skip) return;

        var userService = context.HttpContext.RequestServices
            .GetRequiredService<ICurrentUserService>();

        if (!userService.IsAuthenticated)
        {
            context.Result = new UnauthorizedObjectResult(
                ApiResponse<object>.Failure("Not authenticated."));
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}
