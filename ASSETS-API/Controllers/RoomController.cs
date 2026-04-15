using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/rooms")]
[Route("mssql-api/rooms")]
public class RoomController : ControllerBase
{
    private readonly IRoomService _svc;
    public RoomController(IRoomService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? floorId)
    {
        var items = await _svc.GetAllAsync(floorId);
        return Ok(items.Select(x => (object)new { id = x.Room_ID, description = x.RoomDesc, floorId = x.FloorID }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
