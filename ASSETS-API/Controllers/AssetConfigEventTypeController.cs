using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/asset-config-event-types")]
[Route("mssql-api/asset-config-event-types")]
public class AssetConfigEventTypeController : ControllerBase
{
    private readonly IAssetConfigEventTypeService _svc;
    public AssetConfigEventTypeController(IAssetConfigEventTypeService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _svc.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
