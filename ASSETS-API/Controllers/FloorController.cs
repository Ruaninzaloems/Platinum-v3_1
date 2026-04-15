using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/floors")]
[Route("mssql-api/floors")]
public class FloorController : ControllerBase
{
    private readonly IFloorService _svc;
    public FloorController(IFloorService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? buildingId)
    {
        var items = await _svc.GetAllAsync(buildingId);
        return Ok(items.Select(x => (object)new { id = x.Floor_ID, description = x.FloorDesc, buildingId = x.BuildingID }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
