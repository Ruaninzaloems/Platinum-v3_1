using Microsoft.AspNetCore.Mvc;
using MssqlApi.Models;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("mssql-api/unit-of-issue")]
[Route("api/unit-of-issue")]
public class UnitOfIssueController : ControllerBase
{
    private readonly IUnitOfIssueService _service;

    public UnitOfIssueController(IUnitOfIssueService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UnitOfIssue entity)
    {
        var id = await _service.CreateAsync(entity);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UnitOfIssue entity)
    {
        entity.UnitOfIssue_ID = id;
        var updated = await _service.UpdateAsync(entity);
        if (!updated) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
