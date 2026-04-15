using Microsoft.AspNetCore.Mvc;
using MssqlApi.Models;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("mssql-api/scm-contract-detail-items")]
[Route("api/scm-contract-detail-items")]
public class ScmContractDetailItemsController : ControllerBase
{
    private readonly IScmContractDetailItemsService _service;

    public ScmContractDetailItemsController(IScmContractDetailItemsService service)
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
    public async Task<IActionResult> Create([FromBody] ScmContractDetailItems entity)
    {
        var id = await _service.CreateAsync(entity);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ScmContractDetailItems entity)
    {
        entity.ContractDetailItems_ID = id;
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
