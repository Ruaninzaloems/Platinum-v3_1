using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommentsController : ControllerBase
{
    private readonly IdpDbContext _context;
    private static readonly string[] ValidStatuses = { "Received", "Under Review", "Responded", "Closed", "Escalated" };

    public CommentsController(IdpDbContext context) => _context = context;

    [HttpGet("cycle/{cycleId}")]
    public async Task<ActionResult<IEnumerable<IdpPublicComment>>> GetByCycle(int cycleId)
    {
        return await _context.IdpPublicComments
            .Where(c => c.CycleId == cycleId)
            .Include(c => c.Responses)
            .OrderByDescending(c => c.SubmissionDate)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IdpPublicComment>> GetById(int id)
    {
        var comment = await _context.IdpPublicComments
            .Include(c => c.Responses)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (comment == null) return NotFound();
        return comment;
    }

    [HttpPost]
    public async Task<ActionResult<IdpPublicComment>> Create(IdpPublicComment comment)
    {
        var cycle = await _context.IdpCycles.FindAsync(comment.CycleId);
        if (cycle == null) return BadRequest("Invalid CycleId: cycle not found");

        comment.Status = "Received";
        comment.CreatedDate = DateTime.UtcNow;
        comment.ModifiedDate = DateTime.UtcNow;
        _context.IdpPublicComments.Add(comment);

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpPublicComment", EntityId = comment.Id, Action = "Created",
            NewValue = $"Comment from {comment.SubmitterName ?? "Anonymous"} received via {comment.SourceChannel}",
            PerformedBy = comment.CreatedBy
        });

        await _context.SaveChangesAsync();
        return Ok(comment);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdate update)
    {
        var comment = await _context.IdpPublicComments.FindAsync(id);
        if (comment == null) return NotFound();

        if (!ValidStatuses.Contains(update.Status))
            return BadRequest($"Invalid status. Valid statuses: {string.Join(", ", ValidStatuses)}");

        var allowedTransitions = new Dictionary<string, string[]>
        {
            { "Received", new[] { "Under Review", "Escalated" } },
            { "Under Review", new[] { "Responded", "Escalated", "Closed" } },
            { "Responded", new[] { "Closed", "Escalated" } },
            { "Escalated", new[] { "Under Review", "Closed" } },
            { "Closed", Array.Empty<string>() }
        };

        if (!allowedTransitions.ContainsKey(comment.Status) || !allowedTransitions[comment.Status].Contains(update.Status))
            return BadRequest($"Invalid transition from '{comment.Status}' to '{update.Status}'.");

        var oldStatus = comment.Status;
        comment.Status = update.Status;
        comment.ModifiedDate = DateTime.UtcNow;

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpPublicComment", EntityId = comment.Id, Action = "Status Changed",
            OldValue = oldStatus, NewValue = update.Status, PerformedBy = null
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/respond")]
    public async Task<ActionResult<IdpCommentResponse>> Respond(int id, IdpCommentResponse response)
    {
        var comment = await _context.IdpPublicComments.FindAsync(id);
        if (comment == null) return NotFound();

        response.CommentId = id;
        response.CreatedDate = DateTime.UtcNow;
        response.ModifiedDate = DateTime.UtcNow;
        _context.IdpCommentResponses.Add(response);

        comment.Status = "Responded";
        comment.ModifiedDate = DateTime.UtcNow;

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpPublicComment", EntityId = comment.Id, Action = "Response Added",
            NewValue = $"Response by {response.ResponsibleOfficial}", PerformedBy = response.CreatedBy
        });

        await _context.SaveChangesAsync();
        return Ok(response);
    }
}
