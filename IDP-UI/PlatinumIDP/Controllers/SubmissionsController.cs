using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubmissionsController : ControllerBase
{
    private readonly IdpDbContext _context;
    public SubmissionsController(IdpDbContext context) => _context = context;

    [HttpGet("cycle/{cycleId}")]
    public async Task<ActionResult<IEnumerable<IdpSubmissionLog>>> GetByCycle(int cycleId)
    {
        return await _context.IdpSubmissionLogs
            .Where(s => s.CycleId == cycleId)
            .OrderByDescending(s => s.CreatedDate)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IdpSubmissionLog>> GetById(int id)
    {
        var sub = await _context.IdpSubmissionLogs.FindAsync(id);
        if (sub == null) return NotFound();
        return sub;
    }

    [HttpPost]
    public async Task<ActionResult<IdpSubmissionLog>> Create(IdpSubmissionLog submission)
    {
        var cycle = await _context.IdpCycles.FindAsync(submission.CycleId);
        if (cycle == null) return NotFound("Cycle not found.");
        if (cycle.Status != "Adopted")
            return BadRequest("IDP must be Adopted before GoMuni submission.");

        var errors = new List<string>();
        if (string.IsNullOrEmpty(submission.AdoptedIdpFileName)) errors.Add("Adopted IDP document required");
        if (string.IsNullOrEmpty(submission.CouncilResolutionFileName)) errors.Add("Council Resolution required");
        if (string.IsNullOrEmpty(submission.MinutesFileName)) errors.Add("Council Minutes required");

        if (errors.Any())
            return BadRequest($"Pre-upload validation failed: {string.Join("; ", errors)}");

        submission.SubmissionDate = DateTime.UtcNow;
        submission.ValidationStatus = "Pending";
        submission.Status = "Submitted";
        submission.CreatedDate = DateTime.UtcNow;
        submission.ModifiedDate = DateTime.UtcNow;
        _context.IdpSubmissionLogs.Add(submission);

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpSubmissionLog", EntityId = submission.Id, Action = "GoMuni Submission Created",
            NewValue = $"Submission pack uploaded for cycle {cycle.Name}", PerformedBy = submission.CreatedBy
        });

        await _context.SaveChangesAsync();
        return Ok(submission);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SubmissionUpdate update)
    {
        var sub = await _context.IdpSubmissionLogs.FindAsync(id);
        if (sub == null) return NotFound();

        if (!string.IsNullOrEmpty(update.ReferenceNumber))
            sub.ReferenceNumber = update.ReferenceNumber;
        if (!string.IsNullOrEmpty(update.ValidationStatus))
            sub.ValidationStatus = update.ValidationStatus;
        if (!string.IsNullOrEmpty(update.ValidationFeedback))
            sub.ValidationFeedback = update.ValidationFeedback;

        sub.ModifiedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class SubmissionUpdate
{
    public string? ReferenceNumber { get; set; }
    public string? ValidationStatus { get; set; }
    public string? ValidationFeedback { get; set; }
}
