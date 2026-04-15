using Microsoft.AspNetCore.Mvc;
using MssqlApi.Models;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("mssql-api/vendors")]
[Route("api/vendors")]
public class ConsVendorController : ControllerBase
{
    private readonly IConsVendorService _service;

    public ConsVendorController(IConsVendorService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _service.GetAllAsync();
        return Ok(items.Select(x => new { vendorId = x.Vendor_ID, vendorName = x.VendorName }));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ConsVendor entity)
    {
        var id = await _service.CreateAsync(entity);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ConsVendor entity)
    {
        entity.Vendor_ID = id;
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
