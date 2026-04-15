using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly IConfigService _configService;

    public ConfigController(IConfigService configService)
    {
        _configService = configService;
    }

    [HttpGet("departments")]
    public async Task<ActionResult<ApiResponse<object>>> GetDepartments()
        => Ok(ApiResponse<object>.Ok(await _configService.GetDepartmentsAsync()));

    [HttpGet("divisions")]
    public async Task<ActionResult<ApiResponse<object>>> GetDivisions([FromQuery] int? departmentId)
        => Ok(ApiResponse<object>.Ok(await _configService.GetDivisionsAsync(departmentId)));

    [HttpGet("employees")]
    public async Task<ActionResult<ApiResponse<object>>> GetEmployees([FromQuery] int? departmentId)
        => Ok(ApiResponse<object>.Ok(await _configService.GetEmployeesAsync(departmentId)));

    [HttpGet("stores")]
    public async Task<ActionResult<ApiResponse<object>>> GetStores()
        => Ok(ApiResponse<object>.Ok(await _configService.GetStoresAsync()));

    [HttpGet("financial-years")]
    public async Task<ActionResult<ApiResponse<object>>> GetFinancialYears()
        => Ok(ApiResponse<object>.Ok(await _configService.GetFinancialYearsAsync()));

    [HttpGet("banks")]
    public async Task<ActionResult<ApiResponse<object>>> GetBanks()
        => Ok(ApiResponse<object>.Ok(await _configService.GetBanksAsync()));

    [HttpGet("vendor-statuses")]
    public async Task<ActionResult<ApiResponse<object>>> GetVendorStatuses()
        => Ok(ApiResponse<object>.Ok(await _configService.GetVendorStatusesAsync()));

    [HttpGet("process-boundaries")]
    public async Task<ActionResult<ApiResponse<object>>> GetProcessBoundaries()
        => Ok(ApiResponse<object>.Ok(await _configService.GetProcessBoundariesAsync()));

    [HttpGet("votes")]
    public async Task<ActionResult<ApiResponse<object>>> GetVotes()
        => Ok(ApiResponse<object>.Ok(await _configService.GetVotesAsync()));

    [HttpGet("settings/{key}")]
    public async Task<ActionResult<ApiResponse<object>>> GetConfigValue(string key)
        => Ok(ApiResponse<object>.Ok(await _configService.GetConfigValueAsync(key)));
}
