namespace PlatinumOvertime_API.Middleware;

/// <summary>
/// When placed on a controller class or action method, tells
/// <see cref="SessionAuthFilter"/> to skip the session-authentication check
/// for that endpoint. Apply to endpoints that must be reachable without a
/// session (e.g. <c>AuthController.Login</c>, <c>AuthController.Logout</c>).
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class SkipSessionAuthAttribute : Attribute { }
