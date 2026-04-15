using System.Diagnostics;
using SCM_API.Services;

namespace SCM_API.Middleware;

public class PerformanceMonitoringMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PerformanceMonitoringMiddleware> _logger;
    private readonly int _slowRequestThresholdMs;

    public PerformanceMonitoringMiddleware(
        RequestDelegate next,
        ILogger<PerformanceMonitoringMiddleware> logger,
        IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _slowRequestThresholdMs = configuration.GetValue("PerformanceMonitoring:SlowRequestThresholdMs", 2000);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        var isError = false;

        try
        {
            await _next(context);
            if (context.Response.StatusCode >= 400) isError = true;
        }
        catch
        {
            isError = true;
            throw;
        }
        finally
        {
            sw.Stop();
            var metrics = context.RequestServices.GetRequiredService<PerformanceMetricsService>();
            metrics.RecordRequest(sw.ElapsedMilliseconds, isError);

            if (sw.ElapsedMilliseconds > _slowRequestThresholdMs)
            {
                _logger.LogWarning(
                    "SLOW REQUEST: {Method} {Path} took {ElapsedMs}ms (threshold: {ThresholdMs}ms)",
                    context.Request.Method,
                    context.Request.Path,
                    sw.ElapsedMilliseconds,
                    _slowRequestThresholdMs);
            }
        }
    }
}
