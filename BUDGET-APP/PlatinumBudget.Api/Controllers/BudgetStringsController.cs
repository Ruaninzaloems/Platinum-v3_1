using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BudgetStringsController : ControllerBase
{
    private readonly BudgetStringService _service;
    private readonly ValidationService _validation;

    public BudgetStringsController(BudgetStringService service, ValidationService validation)
    {
        _service = service;
        _validation = validation;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? versionId, [FromQuery] string? module, [FromQuery] int? itemId, [FromQuery] int? fundId, [FromQuery] int? functionId, [FromQuery] int? projectId)
        => Ok(await _service.GetAllAsync(versionId, module, itemId, fundId, functionId, projectId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBudgetStringDto dto)
    {
        var result = await _service.CreateAsync(dto, "system");
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBudgetStringDto dto)
    {
        var result = await _service.UpdateAsync(id, dto, "system");
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
        => await _service.DeleteAsync(id) ? NoContent() : NotFound();

    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromQuery] int versionId)
        => Ok(await _validation.ValidateVersionAsync(versionId, "system"));

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] int versionId, [FromQuery] string groupBy = "item")
        => Ok(await _service.GetSummaryAsync(versionId, groupBy));
}
