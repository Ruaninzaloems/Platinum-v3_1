using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowController : ControllerBase
{
    private readonly IdpDbContext _context;
    public WorkflowController(IdpDbContext context) => _context = context;

    [HttpPost("{documentId}/submit-for-review")]
    public async Task<ActionResult<object>> SubmitForReview(int documentId)
    {
        var doc = await _context.IdpDocumentVersions.FindAsync(documentId);
        if (doc == null) return NotFound("Document not found.");
        if (doc.IsLocked) return BadRequest("Document is locked.");

        doc.Status = "In Review";
        doc.ModifiedDate = DateTime.UtcNow;

        var tasks = new[]
        {
            new IdpWorkflowTask { CycleId = doc.CycleId, DocumentVersionId = documentId, TaskType = "Review", AssignedRole = "Reviewer", AssignedTo = "IDP Manager", Status = "Pending", Sequence = 1, CreatedBy = null, CreatedDate = DateTime.UtcNow, ModifiedDate = DateTime.UtcNow },
            new IdpWorkflowTask { CycleId = doc.CycleId, DocumentVersionId = documentId, TaskType = "Approval", AssignedRole = "Approver", AssignedTo = "Municipal Manager", Status = "Pending", Sequence = 2, CreatedBy = null, CreatedDate = DateTime.UtcNow, ModifiedDate = DateTime.UtcNow },
            new IdpWorkflowTask { CycleId = doc.CycleId, DocumentVersionId = documentId, TaskType = "Governance", AssignedRole = "Governance Officer", AssignedTo = "Governance Office", Status = "Pending", Sequence = 3, CreatedBy = null, CreatedDate = DateTime.UtcNow, ModifiedDate = DateTime.UtcNow },
        };
        _context.IdpWorkflowTasks.AddRange(tasks);

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpDocumentVersion", EntityId = documentId, Action = "Submitted for Review",
            NewValue = "Document submitted for sequential approval", PerformedBy = null
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Submitted for review", tasks = tasks.Length });
    }

    [HttpGet("{documentId}/tasks")]
    public async Task<ActionResult<IEnumerable<IdpWorkflowTask>>> GetTasks(int documentId)
    {
        return await _context.IdpWorkflowTasks
            .Where(t => t.DocumentVersionId == documentId)
            .OrderBy(t => t.Sequence)
            .ToListAsync();
    }

    [HttpPost("task/{taskId}/approve")]
    public async Task<IActionResult> ApproveTask(int taskId, [FromBody] WorkflowAction action)
    {
        var task = await _context.IdpWorkflowTasks.FindAsync(taskId);
        if (task == null) return NotFound();

        var previousTasks = await _context.IdpWorkflowTasks
            .Where(t => t.DocumentVersionId == task.DocumentVersionId && t.Sequence < task.Sequence && t.Status != "Approved")
            .AnyAsync();
        if (previousTasks)
            return BadRequest("Previous approval steps must be completed first (sequential routing).");

        task.Status = "Approved";
        task.Comments = action.Comments;
        task.CompletedBy = action.CompletedBy;
        task.CompletedDate = DateTime.UtcNow;
        task.ModifiedDate = DateTime.UtcNow;

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpWorkflowTask", EntityId = taskId, Action = "Approved",
            NewValue = $"Task approved by user {task.CompletedBy}: {action.Comments}", PerformedBy = task.CompletedBy
        });

        var allApproved = !await _context.IdpWorkflowTasks
            .Where(t => t.DocumentVersionId == task.DocumentVersionId && t.Id != taskId && t.Status != "Approved")
            .AnyAsync();

        if (allApproved && task.DocumentVersionId.HasValue)
        {
            var doc = await _context.IdpDocumentVersions.FindAsync(task.DocumentVersionId.Value);
            if (doc != null)
            {
                if (doc.VersionType == "Draft")
                {
                    doc.Status = "Approved for Distribution";
                    doc.IsLocked = true;
                    doc.LockedDate = DateTime.UtcNow;
                    doc.LockedBy = task.CompletedBy;
                }
                else if (doc.VersionType == "Final")
                {
                    doc.Status = "Adopted";
                    doc.IsLocked = true;
                    doc.LockedDate = DateTime.UtcNow;
                    doc.LockedBy = task.CompletedBy;

                    var cycle = await _context.IdpCycles.FindAsync(doc.CycleId);
                    if (cycle != null)
                    {
                        cycle.Status = "Adopted";
                        cycle.IsLocked = true;
                    }
                }
                doc.ModifiedDate = DateTime.UtcNow;

                _context.IdpAuditLogs.Add(new IdpAuditLog
                {
                    EntityType = "IdpDocumentVersion", EntityId = doc.Id,
                    Action = doc.VersionType == "Draft" ? "Approved for Distribution" : "Adopted",
                    NewValue = $"All approvals completed. Document status: {doc.Status}.", PerformedBy = task.CompletedBy
                });
            }
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("task/{taskId}/reject")]
    public async Task<IActionResult> RejectTask(int taskId, [FromBody] WorkflowAction action)
    {
        var task = await _context.IdpWorkflowTasks.FindAsync(taskId);
        if (task == null) return NotFound();

        task.Status = "Rejected";
        task.Comments = action.Comments;
        task.CompletedBy = action.CompletedBy;
        task.CompletedDate = DateTime.UtcNow;
        task.ModifiedDate = DateTime.UtcNow;

        if (task.DocumentVersionId.HasValue)
        {
            var doc = await _context.IdpDocumentVersions.FindAsync(task.DocumentVersionId.Value);
            if (doc != null)
            {
                doc.Status = "Draft";
                doc.IsLocked = false;
                doc.ModifiedDate = DateTime.UtcNow;
            }
        }

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpWorkflowTask", EntityId = taskId, Action = "Rejected",
            NewValue = $"Task rejected by user {task.CompletedBy}: {action.Comments}", PerformedBy = task.CompletedBy
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("pending")]
    public async Task<ActionResult<IEnumerable<IdpWorkflowTask>>> GetPending()
    {
        return await _context.IdpWorkflowTasks
            .Where(t => t.Status == "Pending")
            .OrderBy(t => t.CreatedDate)
            .ToListAsync();
    }
}

public class WorkflowAction
{
    public string? Comments { get; set; }
    public int? CompletedBy { get; set; }
}
