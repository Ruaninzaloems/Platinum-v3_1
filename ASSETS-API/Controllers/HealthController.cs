using Microsoft.AspNetCore.Mvc;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api")]
[Route("mssql-api")]
public class HealthController : ControllerBase
{
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new { status = "ok", timestamp = DateTime.UtcNow, version = "2.0.0-dotnet" });
    }
}
