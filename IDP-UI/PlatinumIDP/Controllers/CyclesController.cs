using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CyclesController : ControllerBase
{
    private readonly IdpDbContext _context;
    private static readonly string[] ValidStatuses = { "Draft", "In Review", "Approved for Distribution", "Adopted", "Revised" };

    public CyclesController(IdpDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<IdpCycle>>> GetAll()
    {
        return await _context.IdpCycles.OrderByDescending(c => c.StartYear).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IdpCycle>> GetById(int id)
    {
        var cycle = await _context.IdpCycles.FindAsync(id);
        if (cycle == null) return NotFound();
        return cycle;
    }

    [HttpPost]
    public async Task<ActionResult<IdpCycle>> Create(IdpCycle cycle)
    {
        cycle.Status = "Draft";
        cycle.RevisionNumber = 1;
        cycle.IsLocked = false;
        cycle.CreatedDate = DateTime.UtcNow;
        cycle.ModifiedDate = DateTime.UtcNow;
        _context.IdpCycles.Add(cycle);

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpCycle", EntityId = cycle.Id, Action = "Created",
            NewValue = $"Cycle '{cycle.Name}' created", PerformedBy = cycle.CreatedBy
        });

        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = cycle.Id }, cycle);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, IdpCycle cycle)
    {
        var existing = await _context.IdpCycles.FindAsync(id);
        if (existing == null) return NotFound();
        if (existing.IsLocked) return BadRequest("Cycle is locked after adoption. No edits allowed.");

        existing.Name = cycle.Name;
        existing.StartYear = cycle.StartYear;
        existing.EndYear = cycle.EndYear;
        existing.MunicipalityName = cycle.MunicipalityName;
        existing.Description = cycle.Description;
        existing.ModifiedBy = cycle.ModifiedBy;
        existing.ModifiedDate = DateTime.UtcNow;
        existing.VersionNo++;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdate update)
    {
        var cycle = await _context.IdpCycles.FindAsync(id);
        if (cycle == null) return NotFound();
        if (cycle.IsLocked && update.Status != "Revised") return BadRequest("Cycle is locked. Only revision is allowed.");

        if (!ValidStatuses.Contains(update.Status))
            return BadRequest($"Invalid status. Valid statuses: {string.Join(", ", ValidStatuses)}");

        var allowedTransitions = new Dictionary<string, string[]>
        {
            { "Draft", new[] { "In Review" } },
            { "In Review", new[] { "Approved for Distribution", "Draft" } },
            { "Approved for Distribution", new[] { "Adopted", "In Review" } },
            { "Adopted", new[] { "Revised" } },
            { "Revised", new[] { "In Review" } }
        };

        if (!allowedTransitions.ContainsKey(cycle.Status) || !allowedTransitions[cycle.Status].Contains(update.Status))
            return BadRequest($"Invalid transition from '{cycle.Status}' to '{update.Status}'. Allowed: {string.Join(", ", allowedTransitions.GetValueOrDefault(cycle.Status, Array.Empty<string>()))}");

        var oldStatus = cycle.Status;
        cycle.Status = update.Status;
        cycle.ModifiedDate = DateTime.UtcNow;

        if (update.Status == "Adopted")
        {
            cycle.IsLocked = true;
        }
        else if (update.Status == "Revised")
        {
            cycle.RevisionNumber++;
            cycle.IsLocked = false;
        }

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpCycle", EntityId = cycle.Id, Action = "Status Changed",
            OldValue = oldStatus, NewValue = update.Status, PerformedBy = null
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/dashboard")]
    public async Task<ActionResult<object>> GetDashboard(int id)
    {
        var cycle = await _context.IdpCycles.FindAsync(id);
        if (cycle == null) return NotFound();

        var totalProjects = await _context.IdpProjects.CountAsync(p => p.CycleId == id);
        var capitalProjects = await _context.IdpProjects.CountAsync(p => p.CycleId == id && p.Classification == "Capital");
        var operationalProjects = await _context.IdpProjects.CountAsync(p => p.CycleId == id && p.Classification == "Operational");
        var totalComments = await _context.IdpPublicComments.CountAsync(c => c.CycleId == id);
        var pendingComments = await _context.IdpPublicComments.CountAsync(c => c.CycleId == id && (c.Status == "Received" || c.Status == "Under Review"));
        var respondedComments = await _context.IdpPublicComments.CountAsync(c => c.CycleId == id && c.Status == "Responded");
        var closedComments = await _context.IdpPublicComments.CountAsync(c => c.CycleId == id && c.Status == "Closed");
        var escalatedComments = await _context.IdpPublicComments.CountAsync(c => c.CycleId == id && c.Status == "Escalated");
        var totalObjectives = await _context.IdpStrategicObjectives.CountAsync(o => o.CycleId == id);
        var totalMilestones = await _context.IdpMilestones.CountAsync(m => m.CycleId == id);
        var completedMilestones = await _context.IdpMilestones.CountAsync(m => m.CycleId == id && m.Status == "Completed");
        var overdueMilestones = await _context.IdpMilestones.CountAsync(m => m.CycleId == id && m.DueDate < DateTime.UtcNow && m.Status != "Completed");
        var totalBudget = await _context.IdpProjects.Where(p => p.CycleId == id).SumAsync(p => p.BudgetAmount ?? 0);
        var phases = await _context.IdpProcessPhases.Where(p => p.CycleId == id).OrderBy(p => p.OrderIndex).ToListAsync();
        var documentVersions = await _context.IdpDocumentVersions.CountAsync(d => d.CycleId == id);
        var submissions = await _context.IdpSubmissionLogs.CountAsync(s => s.CycleId == id);
        var recentAuditLogs = await _context.IdpAuditLogs
            .Where(a => a.EntityId == id || _context.IdpProjects.Where(p => p.CycleId == id).Select(p => p.Id).Contains(a.EntityId))
            .OrderByDescending(a => a.PerformedDate)
            .Take(10)
            .ToListAsync();

        return new
        {
            cycle,
            totalProjects,
            capitalProjects,
            operationalProjects,
            totalComments,
            pendingComments,
            respondedComments,
            closedComments,
            escalatedComments,
            totalObjectives,
            totalMilestones,
            completedMilestones,
            overdueMilestones,
            totalBudget,
            phases,
            documentVersions,
            submissions,
            recentAuditLogs
        };
    }
}

public class StatusUpdate
{
    public string Status { get; set; } = string.Empty;
}
