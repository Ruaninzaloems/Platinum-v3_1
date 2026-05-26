using System.Net;
using System.Text.Json;

namespace PlatinumOvertime_API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await _next(ctx);
        }
        catch (KeyNotFoundException knf)
        {
            _logger.LogWarning(knf, "Resource not found");
            await Write(ctx, HttpStatusCode.NotFound, knf.Message, null);
        }
        catch (ArgumentException ae)
        {
            _logger.LogWarning(ae, "Validation error");
            await Write(ctx, HttpStatusCode.BadRequest, ae.Message, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            // Internal exception details are logged server-side only. Clients
            // receive a generic message to avoid information disclosure.
            await Write(ctx, HttpStatusCode.InternalServerError, "An unexpected error occurred.", null);
        }
    }

    private static Task Write(HttpContext ctx, HttpStatusCode status, string message, string[]? errors)
    {
        ctx.Response.StatusCode = (int)status;
        ctx.Response.ContentType = "application/json";
        var body = JsonSerializer.Serialize(new
        {
            isSuccess = false,
            data      = (object?)null,
            message,
            errors    = errors ?? Array.Empty<string>(),
            timestamp = DateTime.UtcNow
        }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        return ctx.Response.WriteAsync(body);
    }
}
