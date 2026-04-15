using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/streets")]
[Route("mssql-api/streets")]
public class StreetController : ControllerBase
{
    private readonly IStreetService _svc;
    public StreetController(IStreetService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? suburbId)
    {
        var items = await _svc.GetAllAsync(suburbId);
        return Ok(items.Select(x => (object)new { id = x.Street_ID, description = x.StreetName, suburbId = x.SuburbID }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
