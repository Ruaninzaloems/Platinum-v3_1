using Microsoft.AspNetCore.Mvc;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Controllers;

[ApiController]
[Route("api/employees")]
public class EmployeesController : ControllerBase
{
    private readonly IPlatinumIntegrationService _platinum;
    public EmployeesController(IPlatinumIntegrationService platinum) => _platinum = platinum;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, CancellationToken ct)
        => Ok(ApiResponse<object>.Success(await _platinum.GetEmployeesAsync(search, ct)));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, CancellationToken ct)
    {
        var e = await _platinum.GetEmployeeAsync(id, ct);
        return e is null
            ? NotFound(ApiResponse<object>.Failure($"Employee '{id}' not found."))
            : Ok(ApiResponse<object>.Success(e));
    }
}
