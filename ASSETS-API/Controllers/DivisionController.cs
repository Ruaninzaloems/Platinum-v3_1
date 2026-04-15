using Microsoft.AspNetCore.Mvc;
using MssqlApi.Models;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("mssql-api/divisions")]
[Route("api/divisions")]
public class DivisionController : ControllerBase
{
    private readonly IDivisionService _service;

    public DivisionController(IDivisionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? departmentId)
    {
        var items = await _service.GetAllAsync();
        IEnumerable<Division> filtered = departmentId.HasValue ? items.Where(x => x.DepartmentID == departmentId.Value) : items;
        return Ok(filtered.Select(x => new { id = x.Division_ID, description = x.DivisionDesc, departmentId = (int?)x.DepartmentID }));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Division entity)
    {
        var id = await _service.CreateAsync(entity);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Division entity)
    {
        entity.Division_ID = id;
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
