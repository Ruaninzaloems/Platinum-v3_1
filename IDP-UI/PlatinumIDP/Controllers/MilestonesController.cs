using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MilestonesController : ControllerBase
{
    private readonly IdpDbContext _context;
    public MilestonesController(IdpDbContext context) => _context = context;

    [HttpGet("cycle/{cycleId}")]
    public async Task<ActionResult<IEnumerable<IdpMilestone>>> GetByCycle(int cycleId)
    {
        return await _context.IdpMilestones
            .Where(m => m.CycleId == cycleId)
            .OrderBy(m => m.DueDate)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<IdpMilestone>> Create(IdpMilestone milestone)
    {
        milestone.CreatedDate = DateTime.UtcNow;
        milestone.ModifiedDate = DateTime.UtcNow;
        _context.IdpMilestones.Add(milestone);
        await _context.SaveChangesAsync();
        return Ok(milestone);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, IdpMilestone milestone)
    {
        var existing = await _context.IdpMilestones.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Title = milestone.Title;
        existing.Description = milestone.Description;
        existing.AssignedTo = milestone.AssignedTo;
        existing.DueDate = milestone.DueDate;
        existing.IsMandatory = milestone.IsMandatory;
        existing.EvidenceUrl = milestone.EvidenceUrl;
        existing.ModifiedBy = milestone.ModifiedBy;
        existing.ModifiedDate = DateTime.UtcNow;
        existing.VersionNo++;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdate update)
    {
        var milestone = await _context.IdpMilestones.FindAsync(id);
        if (milestone == null) return NotFound();

        if (update.Status == "Completed" && milestone.IsMandatory && string.IsNullOrEmpty(milestone.EvidenceUrl))
            return BadRequest("Cannot complete mandatory milestone without evidence attached.");

        var oldStatus = milestone.Status;
        milestone.Status = update.Status;
        milestone.Progress = update.Status == "Completed" ? 100 : milestone.Progress;
        milestone.ModifiedDate = DateTime.UtcNow;

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpMilestone", EntityId = milestone.Id, Action = "Status Changed",
            OldValue = oldStatus, NewValue = update.Status, PerformedBy = null
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
