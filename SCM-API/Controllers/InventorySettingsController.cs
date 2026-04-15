using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/inventory-settings")]
public class InventorySettingsController : ControllerBase
{
    private readonly IInventorySettingsService _service;

    public InventorySettingsController(IInventorySettingsService service) { _service = service; }

    [HttpGet("{settingType}")]
    public async Task<ActionResult> GetSettings(string settingType)
    {
        var result = await _service.GetSettingsAsync(settingType);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{settingType}/{id}")]
    public async Task<ActionResult> GetSettingById(string settingType, int id)
    {
        var result = await _service.GetSettingByIdAsync(settingType, id);
        if (result == null) return NotFound();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("{settingType}")]
    public async Task<ActionResult> CreateSetting(string settingType, [FromBody] object dto)
    {
        var result = await _service.CreateSettingAsync(settingType, dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("{settingType}/{id}")]
    public async Task<ActionResult> UpdateSetting(string settingType, int id, [FromBody] object dto)
    {
        var result = await _service.UpdateSettingAsync(settingType, id, dto);
        return Ok(ApiResponse.Ok(result ? "Updated" : "Not found"));
    }

    [HttpPut("{settingType}/{id}/toggle")]
    public async Task<ActionResult> ToggleSetting(string settingType, int id, [FromQuery] bool enabled = true)
    {
        var result = await _service.ToggleSettingAsync(settingType, id, enabled);
        return Ok(ApiResponse.Ok(result ? "Toggled" : "Not found"));
    }
}
