using Microsoft.AspNetCore.Mvc;
using MssqlApi.Models;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/gl-outbox-lines")]
[Route("mssql-api/gl-outbox-lines")]
public class GlOutboxLineController : ControllerBase
{
    private readonly IGlOutboxLineService _svc;
    public GlOutboxLineController(IGlOutboxLineService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? outboxId = null)
    {
        var items = await _svc.GetAllAsync(outboxId);
        return Ok(items);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] GlOutboxLineCreateRequest req)
    {
        var id = await _svc.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { id }, new { lineId = id });
    }
}
