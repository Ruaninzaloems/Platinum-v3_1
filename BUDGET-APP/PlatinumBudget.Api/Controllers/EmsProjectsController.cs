using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.Models;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/ems/projects")]
public class EmsProjectsController : ControllerBase
{
    private readonly EmsProjectService _svc;

    public EmsProjectsController(EmsProjectService svc)
    {
        _svc = svc;
    }

    [HttpGet]
    public async Task<IActionResult> GetProjects(
        [FromQuery] string? finYear,
        [FromQuery] int? divisionId,
        [FromQuery] int? status)
    {
        var result = await _svc.GetProjectsAsync(finYear, divisionId, status);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProject(int id)
    {
        var result = await _svc.GetProjectDetailAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] Plan_Project project)
    {
        var result = await _svc.CreateProjectAsync(project);
        return CreatedAtAction(nameof(GetProject), new { id = result.Project_ID }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] Plan_Project project)
    {
        var result = await _svc.UpdateProjectAsync(id, project);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        var deleted = await _svc.DeleteProjectAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpGet("{id:int}/items")]
    public async Task<IActionResult> GetProjectItems(int id)
    {
        var items = await _svc.GetProjectItemsAsync(id);
        return Ok(items);
    }

    [HttpPost("{id:int}/items")]
    public async Task<IActionResult> AddProjectItem(int id, [FromBody] Plan_ProjectItem item)
    {
        item.ProjectID = id;
        var result = await _svc.AddProjectItemAsync(item);
        return Ok(result);
    }

    [HttpPut("{id:int}/items/{itemId:int}")]
    public async Task<IActionResult> UpdateProjectItem(int id, int itemId, [FromBody] Plan_ProjectItem item)
    {
        item.ModifierID = 1;
        var result = await _svc.UpdateProjectItemAsync(itemId, item);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{id:int}/items/{itemId:int}")]
    public async Task<IActionResult> DeleteProjectItem(int id, int itemId)
    {
        var deleted = await _svc.DeleteProjectItemAsync(itemId);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpGet("items/{planProjectItemId:int}/budget-summary")]
    public async Task<IActionResult> GetBudgetSummary(int planProjectItemId)
    {
        var result = await _svc.GetAvailableBudgetSummaryAsync(planProjectItemId);
        return Ok(result);
    }
}
