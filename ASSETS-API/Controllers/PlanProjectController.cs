using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/plan-projects")]
[Route("mssql-api/plan-projects")]
public class PlanProjectController : ControllerBase
{
    private readonly IPlanProjectService _svc;
    public PlanProjectController(IPlanProjectService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetProjects([FromQuery] string? finYear) =>
        Ok(await _svc.GetProjectsAsync(finYear));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProject(int id)
    {
        var item = await _svc.GetProjectAsync(id);
        return item is null ? NotFound(new { error = "Project not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] Dictionary<string, object?> model) =>
        Ok(await _svc.CreateProjectAsync(model));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] Dictionary<string, object?> model) =>
        await _svc.UpdateProjectAsync(id, model) ? Ok(new { success = 1 }) : NotFound(new { error = "Not found" });

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProject(int id) =>
        await _svc.DeleteProjectAsync(id) ? Ok(new { success = 1 }) : NotFound(new { error = "Not found" });
}

[ApiController]
[Route("api/plan-project-items")]
[Route("mssql-api/plan-project-items")]
public class PlanProjectItemController : ControllerBase
{
    private readonly IPlanProjectService _svc;
    public PlanProjectItemController(IPlanProjectService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetProjectItems([FromQuery] int? projectId, [FromQuery] string? finYear) =>
        Ok(await _svc.GetProjectItemsAsync(projectId, finYear));

    [HttpGet("scoa")]
    public async Task<IActionResult> GetProjectItemsScoa([FromQuery] int? projectId, [FromQuery] string? finYear) =>
        Ok(await _svc.GetProjectItemsScoaAsync(projectId, finYear));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProjectItem(int id)
    {
        var item = await _svc.GetProjectItemAsync(id);
        return item is null ? NotFound(new { error = "Project item not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProjectItem([FromBody] Dictionary<string, object?> model) =>
        Ok(await _svc.CreateProjectItemAsync(model));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProjectItem(int id, [FromBody] Dictionary<string, object?> model) =>
        await _svc.UpdateProjectItemAsync(id, model) ? Ok(new { success = 1 }) : NotFound(new { error = "Not found" });

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProjectItem(int id) =>
        await _svc.DeleteProjectItemAsync(id) ? Ok(new { success = 1 }) : NotFound(new { error = "Not found" });
}
