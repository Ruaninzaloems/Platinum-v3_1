using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Models.Common;
using SCM_API.Services;

namespace SCM_API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly PerformanceMetricsService _metricsService;
    private readonly ApplicationDbContext _context;

    public HealthController(PerformanceMetricsService metricsService, ApplicationDbContext context)
    {
        _metricsService = metricsService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetHealth()
    {
        var dbConnected = false;
        try
        {
            dbConnected = await _context.Database.CanConnectAsync();
        }
        catch { }

        var health = new
        {
            Status = dbConnected ? "Healthy" : "Degraded",
            Database = dbConnected ? "Connected" : "Disconnected",
            Metrics = _metricsService.GetMetrics(),
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
            Version = "1.0.0"
        };

        return Ok(ApiResponse<object>.Ok(health));
    }
}
