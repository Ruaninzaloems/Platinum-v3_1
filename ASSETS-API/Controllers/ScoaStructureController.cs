using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/scoa-structure")]
[Route("mssql-api/scoa-structure")]
public class ScoaStructureController : ControllerBase
{
    private readonly IScoaStructureService _svc;
    public ScoaStructureController(IScoaStructureService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? tableId) =>
        Ok(await _svc.GetAllAsync(tableId));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
