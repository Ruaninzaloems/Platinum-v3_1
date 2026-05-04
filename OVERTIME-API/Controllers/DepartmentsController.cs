using Microsoft.AspNetCore.Mvc;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Controllers;

[ApiController]
[Route("api/departments")]
public class DepartmentsController : ControllerBase
{
    private readonly IPlatinumIntegrationService _platinum;
    public DepartmentsController(IPlatinumIntegrationService platinum) => _platinum = platinum;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(ApiResponse<object>.Success(await _platinum.GetDepartmentsAsync(ct)));
}
