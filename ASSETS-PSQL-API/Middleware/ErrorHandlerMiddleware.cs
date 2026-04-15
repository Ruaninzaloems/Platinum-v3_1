using System.Net;
using System.Text.Json;

namespace AssetManagement.Middleware;

public class ErrorHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlerMiddleware> _logger;

    public ErrorHandlerMiddleware(RequestDelegate next, ILogger<ErrorHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "23503")
        {
            _logger.LogWarning(ex, "Foreign key constraint violation");
            context.Response.StatusCode = (int)HttpStatusCode.Conflict;
            context.Response.ContentType = "application/json";
            var result = JsonSerializer.Serialize(new { error = "Cannot complete operation: record is referenced by other data" });
            await context.Response.WriteAsync(result);
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
        {
            _logger.LogWarning(ex, "Unique constraint violation");
            context.Response.StatusCode = (int)HttpStatusCode.Conflict;
            context.Response.ContentType = "application/json";
            var result = JsonSerializer.Serialize(new { error = "A record with these values already exists" });
            await context.Response.WriteAsync(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            var errorMessage = context.RequestServices.GetService<IWebHostEnvironment>()?.IsDevelopment() == true
                ? ex.Message
                : "An internal error occurred";
            var result = JsonSerializer.Serialize(new { error = errorMessage });
            await context.Response.WriteAsync(result);
        }
    }
}
