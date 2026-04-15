using Microsoft.AspNetCore.Mvc;
using MssqlApi.Models;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/gl-outbox")]
[Route("mssql-api/gl-outbox")]
public class GlOutboxController : ControllerBase
{
    private readonly IGlOutboxService _svc;
    public GlOutboxController(IGlOutboxService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _svc.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] GlOutboxCreateRequest req)
    {
        var id = await _svc.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { id }, new { outboxId = id });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest req)
    {
        if (string.IsNullOrWhiteSpace(req?.Status))
            return BadRequest(new { error = "Status is required" });

        var status = req.Status.ToUpperInvariant();
        var validStatuses = new[] { "PENDING", "PROCESSING", "POSTED", "FAILED" };
        if (!Array.Exists(validStatuses, s => s == status))
            return BadRequest(new { error = $"Invalid status. Allowed: {string.Join(", ", validStatuses)}" });

        var updated = await _svc.UpdateStatusAsync(id, status, req.LastError);
        return updated ? NoContent() : NotFound();
    }
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = "";
    public string? LastError { get; set; }
}
