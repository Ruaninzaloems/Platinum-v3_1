using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/buildings")]
[Route("mssql-api/buildings")]
public class BuildingController : ControllerBase
{
    private readonly IBuildingService _svc;
    public BuildingController(IBuildingService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _svc.GetAllAsync();
        return Ok(items.Select(x => (object)new { id = x.Building_ID, description = x.BuildingDesc }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
