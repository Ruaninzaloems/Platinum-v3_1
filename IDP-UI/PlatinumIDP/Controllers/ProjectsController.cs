using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IdpDbContext _context;
    public ProjectsController(IdpDbContext context) => _context = context;

    [HttpGet("cycle/{cycleId}")]
    public async Task<ActionResult<IEnumerable<IdpProject>>> GetByCycle(int cycleId)
    {
        return await _context.IdpProjects
            .Where(p => p.CycleId == cycleId)
            .Include(p => p.Indicators)
            .Include(p => p.ObjectiveLinks).ThenInclude(l => l.Objective)
            .OrderBy(p => p.PriorityRanking)
            .ThenBy(p => p.Name)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IdpProject>> GetById(int id)
    {
        var project = await _context.IdpProjects
            .Include(p => p.Indicators)
            .Include(p => p.Objective)
            .Include(p => p.ObjectiveLinks).ThenInclude(l => l.Objective)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (project == null) return NotFound();
        return project;
    }

    [HttpPost]
    public async Task<ActionResult<IdpProject>> Create(IdpProject project)
    {
        var cycle = await _context.IdpCycles.FindAsync(project.CycleId);
        if (cycle == null) return BadRequest("Invalid CycleId: cycle not found");
        if (cycle.IsLocked) return BadRequest("Cannot add projects to a locked/adopted cycle");

        project.CreatedDate = DateTime.UtcNow;
        project.ModifiedDate = DateTime.UtcNow;
        _context.IdpProjects.Add(project);

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpProject", EntityId = project.Id, Action = "Created",
            NewValue = $"Project '{project.Name}' created", PerformedBy = project.CreatedBy
        });

        await _context.SaveChangesAsync();
        return Ok(project);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, IdpProject project)
    {
        var existing = await _context.IdpProjects.FindAsync(id);
        if (existing == null) return NotFound();

        var mscoaCodes = new[] { project.MscoaProjectSegment, project.MscoaFundSegment, project.MscoaRegionSegment }
            .Where(c => !string.IsNullOrEmpty(c)).ToList();
        if (mscoaCodes.Any())
        {
            var validCodes = await _context.MscoaSegments
                .Where(s => mscoaCodes.Contains(s.Code) && s.IsPostingLevel)
                .Select(s => s.Code)
                .ToListAsync();
            var invalidCodes = mscoaCodes.Except(validCodes!).ToList();
            if (invalidCodes.Any())
                return BadRequest($"Invalid MSCOA segment codes (must be posting level): {string.Join(", ", invalidCodes)}");
        }

        existing.Name = project.Name;
        existing.Description = project.Description;
        existing.ObjectiveId = project.ObjectiveId;
        existing.Classification = project.Classification;
        existing.Department = project.Department;
        existing.Ward = project.Ward;
        existing.Region = project.Region;
        existing.Priority = project.Priority;
        existing.PriorityRanking = project.PriorityRanking;
        existing.BudgetAmount = project.BudgetAmount;
        existing.FundingSource = project.FundingSource;
        existing.FundingSourceSummary = project.FundingSourceSummary;
        existing.MscoaProjectSegment = project.MscoaProjectSegment;
        existing.MscoaFundSegment = project.MscoaFundSegment;
        existing.MscoaRegionSegment = project.MscoaRegionSegment;
        existing.StartDate = project.StartDate;
        existing.EndDate = project.EndDate;
        existing.Latitude = project.Latitude;
        existing.Longitude = project.Longitude;
        existing.Status = project.Status;
        existing.ModifiedBy = project.ModifiedBy;
        existing.ModifiedDate = DateTime.UtcNow;
        existing.VersionNo++;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var project = await _context.IdpProjects.FindAsync(id);
        if (project == null) return NotFound();
        _context.IdpProjects.Remove(project);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/objective-links")]
    public async Task<ActionResult<IEnumerable<ProjectObjectiveLink>>> GetObjectiveLinks(int id)
    {
        return await _context.ProjectObjectiveLinks
            .Where(l => l.ProjectId == id)
            .Include(l => l.Objective)
            .OrderBy(l => l.Objective!.Code)
            .ToListAsync();
    }

    [HttpPost("{id}/objective-links")]
    public async Task<IActionResult> SetObjectiveLinks(int id, [FromBody] List<ObjectiveLinkDto> links)
    {
        var project = await _context.IdpProjects.FindAsync(id);
        if (project == null) return NotFound();

        var totalPct = links.Sum(l => l.Percentage);
        if (totalPct > 100)
            return BadRequest("Total percentage across all objectives cannot exceed 100%.");

        var objectiveIds = links.Select(l => l.ObjectiveId).Distinct().ToList();
        var validObjectives = await _context.IdpStrategicObjectives
            .Where(o => objectiveIds.Contains(o.Id))
            .Select(o => o.Id)
            .ToListAsync();
        var invalidIds = objectiveIds.Except(validObjectives).ToList();
        if (invalidIds.Any())
            return BadRequest($"Invalid objective IDs: {string.Join(", ", invalidIds)}");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var existing = await _context.ProjectObjectiveLinks.Where(l => l.ProjectId == id).ToListAsync();
            _context.ProjectObjectiveLinks.RemoveRange(existing);

            foreach (var link in links)
            {
                _context.ProjectObjectiveLinks.Add(new ProjectObjectiveLink
                {
                    ProjectId = id,
                    ObjectiveId = link.ObjectiveId,
                    Percentage = link.Percentage,
                    CreatedBy = null,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow
                });
            }

            if (links.Any())
                project.ObjectiveId = links.OrderByDescending(l => l.Percentage).First().ObjectiveId;

            _context.IdpAuditLogs.Add(new IdpAuditLog
            {
                EntityType = "IdpProject", EntityId = id, Action = "Objective Links Updated",
                NewValue = $"{links.Count} objectives linked (total {totalPct}%)", PerformedBy = null
            });

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return Ok(new { message = "Objective links updated", count = links.Count, totalPercentage = totalPct });
        }
        catch
        {
            await transaction.RollbackAsync();
            return StatusCode(500, "Failed to update objective links. Existing links preserved.");
        }
    }

    [HttpGet("cycle/{cycleId}/kpi-validation")]
    public async Task<ActionResult<object>> ValidateKpis(int cycleId)
    {
        var projectsMissingKpis = await _context.IdpProjects
            .Where(p => p.CycleId == cycleId && !p.Indicators.Any())
            .Select(p => new { p.Id, p.Name })
            .ToListAsync();

        return new
        {
            canGenerateDraft = !projectsMissingKpis.Any(),
            projectsMissingKpis
        };
    }
}

public class ObjectiveLinkDto
{
    public int ObjectiveId { get; set; }
    public decimal Percentage { get; set; }
}
