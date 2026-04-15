using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/suburbs")]
[Route("mssql-api/suburbs")]
public class SuburbController : ControllerBase
{
    private readonly ISuburbService _svc;
    public SuburbController(ISuburbService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? townId)
    {
        var items = await _svc.GetAllAsync(townId);
        return Ok(items.Select(x => (object)new { id = x.Suburb_ID, description = x.SuburbName, townId = x.TownID }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
