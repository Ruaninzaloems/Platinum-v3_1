using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PhasesController : ControllerBase
{
    private readonly IdpDbContext _context;
    public PhasesController(IdpDbContext context) => _context = context;

    [HttpGet("cycle/{cycleId}")]
    public async Task<ActionResult<IEnumerable<IdpProcessPhase>>> GetByCycle(int cycleId)
    {
        return await _context.IdpProcessPhases
            .Where(p => p.CycleId == cycleId)
            .Include(p => p.Milestones)
            .OrderBy(p => p.OrderIndex)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<IdpProcessPhase>> Create(IdpProcessPhase phase)
    {
        phase.CreatedDate = DateTime.UtcNow;
        phase.ModifiedDate = DateTime.UtcNow;
        _context.IdpProcessPhases.Add(phase);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetByCycle), new { cycleId = phase.CycleId }, phase);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, IdpProcessPhase phase)
    {
        var existing = await _context.IdpProcessPhases.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = phase.Name;
        existing.Description = phase.Description;
        existing.Owner = phase.Owner;
        existing.StartDate = phase.StartDate;
        existing.EndDate = phase.EndDate;
        existing.Progress = phase.Progress;
        existing.Status = phase.Status;
        existing.ModifiedBy = phase.ModifiedBy;
        existing.ModifiedDate = DateTime.UtcNow;
        existing.VersionNo++;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/can-progress")]
    public async Task<ActionResult<object>> CanProgress(int id)
    {
        var phase = await _context.IdpProcessPhases
            .Include(p => p.Milestones)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (phase == null) return NotFound();

        var mandatoryIncomplete = phase.Milestones
            .Where(m => m.IsMandatory && m.Status != "Completed")
            .Select(m => m.Title)
            .ToList();

        var missingEvidence = phase.Milestones
            .Where(m => m.IsMandatory && string.IsNullOrEmpty(m.EvidenceUrl))
            .Select(m => m.Title)
            .ToList();

        return new
        {
            canProgress = !mandatoryIncomplete.Any(),
            canApprove = !mandatoryIncomplete.Any() && !missingEvidence.Any(),
            mandatoryIncomplete,
            missingEvidence
        };
    }
}
