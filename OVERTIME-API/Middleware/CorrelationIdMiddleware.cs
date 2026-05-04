using Serilog.Context;

namespace PlatinumOvertime_API.Middleware;

/// <summary>
/// Reads or generates an X-Correlation-Id header, echoes it on the response,
/// and pushes it onto the Serilog LogContext so every log line for the request
/// is tagged with the same id.
/// </summary>
public class CorrelationIdMiddleware
{
    public const string HeaderName = "X-Correlation-Id";
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext ctx)
    {
        var id = ctx.Request.Headers.TryGetValue(HeaderName, out var v) && !string.IsNullOrWhiteSpace(v)
            ? v.ToString()
            : Guid.NewGuid().ToString("N");

        ctx.Response.Headers[HeaderName] = id;
        ctx.Items[HeaderName] = id;

        using (LogContext.PushProperty("CorrelationId", id))
        {
            await _next(ctx);
        }
    }
}
