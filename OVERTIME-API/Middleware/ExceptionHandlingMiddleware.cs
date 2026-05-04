using System.Net;
using System.Text.Json;
using PlatinumOvertime_API.Models.Common;

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
            await Write(ctx, HttpStatusCode.NotFound, knf.Message);
        }
        catch (ArgumentException ae)
        {
            _logger.LogWarning(ae, "Validation error");
            await Write(ctx, HttpStatusCode.BadRequest, ae.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await Write(ctx, HttpStatusCode.InternalServerError, "An unexpected error occurred.");
        }
    }

    private static Task Write(HttpContext ctx, HttpStatusCode status, string message)
    {
        ctx.Response.StatusCode = (int)status;
        ctx.Response.ContentType = "application/json";
        var body = ApiResponse<object>.Failure(message);
        return ctx.Response.WriteAsync(JsonSerializer.Serialize(body, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}
