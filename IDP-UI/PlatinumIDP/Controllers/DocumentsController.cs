using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;
using System.Text.Json;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly IdpDbContext _context;
    public DocumentsController(IdpDbContext context) => _context = context;

    [HttpGet("cycle/{cycleId}")]
    public async Task<ActionResult<IEnumerable<IdpDocumentVersion>>> GetByCycle(int cycleId)
    {
        return await _context.IdpDocumentVersions
            .Where(d => d.CycleId == cycleId)
            .OrderByDescending(d => d.VersionNumber)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IdpDocumentVersion>> GetById(int id)
    {
        var doc = await _context.IdpDocumentVersions
            .Include(d => d.WorkflowTasks)
            .FirstOrDefaultAsync(d => d.Id == id);
        if (doc == null) return NotFound();
        return doc;
    }

    [HttpPost("cycle/{cycleId}/generate-draft")]
    public async Task<ActionResult<IdpDocumentVersion>> GenerateDraft(int cycleId)
    {
        var cycle = await _context.IdpCycles.FindAsync(cycleId);
        if (cycle == null) return NotFound("Cycle not found.");

        var projectsMissingKpis = await _context.IdpProjects
            .Where(p => p.CycleId == cycleId && !p.Indicators.Any())
            .Select(p => p.Name)
            .ToListAsync();

        if (projectsMissingKpis.Any())
            return BadRequest($"Cannot generate Draft IDP. Projects missing KPIs: {string.Join(", ", projectsMissingKpis)}");

        var objectives = await _context.IdpStrategicObjectives
            .Where(o => o.CycleId == cycleId).Include(o => o.Projects).ThenInclude(p => p.Indicators)
            .OrderBy(o => o.Code).ToListAsync();
        var phases = await _context.IdpProcessPhases
            .Where(p => p.CycleId == cycleId).Include(p => p.Milestones).OrderBy(p => p.OrderIndex).ToListAsync();
        var comments = await _context.IdpPublicComments
            .Where(c => c.CycleId == cycleId).Include(c => c.Responses).ToListAsync();

        var lastVersion = await _context.IdpDocumentVersions
            .Where(d => d.CycleId == cycleId && d.VersionType == "Draft")
            .MaxAsync(d => (int?)d.VersionNumber) ?? 0;

        var content = new
        {
            generatedAt = DateTime.UtcNow,
            cycle = new { cycle.Name, cycle.MunicipalityName, cycle.StartYear, cycle.EndYear, cycle.RevisionNumber },
            processPlan = phases.Select(p => new
            {
                p.Name, p.Progress, p.Status,
                milestones = p.Milestones.Select(m => new { m.Title, m.Status, m.AssignedTo, m.DueDate, m.IsMandatory })
            }),
            strategicObjectives = objectives.Select(o => new
            {
                o.Code, o.Description, o.AlignmentTags,
                projects = o.Projects.Select(p => new
                {
                    p.Name, p.Classification, p.Department, p.BudgetAmount, p.Priority, p.Status,
                    indicators = p.Indicators.Select(i => new { i.Name, i.Baseline, i.TargetY1, i.TargetY2, i.TargetY3, i.TargetY4, i.TargetY5 })
                })
            }),
            publicParticipation = new
            {
                totalComments = comments.Count,
                responded = comments.Count(c => c.Status == "Responded"),
                pending = comments.Count(c => c.Status == "Received" || c.Status == "Under Review"),
                comments = comments.Select(c => new { c.SourceChannel, c.Ward, c.Category, c.CommentText, c.Status, c.SubmitterName })
            }
        };

        var doc = new IdpDocumentVersion
        {
            CycleId = cycleId,
            VersionNumber = lastVersion + 1,
            VersionType = "Draft",
            Status = "Draft",
            ContentJson = JsonSerializer.Serialize(content),
            CreatedBy = null,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow
        };

        _context.IdpDocumentVersions.Add(doc);

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpDocumentVersion", EntityId = doc.Id, Action = "Draft Generated",
            NewValue = $"Draft IDP v{doc.VersionNumber} generated", PerformedBy = null
        });

        await _context.SaveChangesAsync();
        return Ok(doc);
    }

    [HttpPost("{id}/generate-final")]
    public async Task<ActionResult<IdpDocumentVersion>> GenerateFinal(int id, [FromBody] FinalIdpRequest request)
    {
        var draftDoc = await _context.IdpDocumentVersions.FindAsync(id);
        if (draftDoc == null) return NotFound("Draft document not found.");
        if (draftDoc.Status != "Approved for Distribution")
            return BadRequest("Draft must be Approved for Distribution before generating Final IDP.");

        var lastFinal = await _context.IdpDocumentVersions
            .Where(d => d.CycleId == draftDoc.CycleId && d.VersionType == "Final")
            .MaxAsync(d => (int?)d.VersionNumber) ?? 0;

        var finalDoc = new IdpDocumentVersion
        {
            CycleId = draftDoc.CycleId,
            VersionNumber = lastFinal + 1,
            VersionType = "Final",
            Status = "Generated",
            ContentJson = draftDoc.ContentJson,
            ResolutionNumber = request.ResolutionNumber,
            ResolutionDate = request.ResolutionDate,
            CouncilMeetingRef = request.CouncilMeetingRef,
            CreatedBy = null,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow
        };

        _context.IdpDocumentVersions.Add(finalDoc);

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpDocumentVersion", EntityId = finalDoc.Id, Action = "Final IDP Generated",
            NewValue = $"Final IDP v{finalDoc.VersionNumber} generated with resolution {request.ResolutionNumber}",
            PerformedBy = null
        });

        await _context.SaveChangesAsync();
        return Ok(finalDoc);
    }

    [HttpPatch("{id}/lock")]
    public async Task<IActionResult> Lock(int id)
    {
        var doc = await _context.IdpDocumentVersions.FindAsync(id);
        if (doc == null) return NotFound();

        doc.IsLocked = true;
        doc.LockedDate = DateTime.UtcNow;
        doc.LockedBy = null;
        doc.ModifiedDate = DateTime.UtcNow;

        _context.IdpAuditLogs.Add(new IdpAuditLog
        {
            EntityType = "IdpDocumentVersion", EntityId = doc.Id, Action = "Document Locked",
            NewValue = $"{doc.VersionType} IDP v{doc.VersionNumber} locked", PerformedBy = null
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class FinalIdpRequest
{
    public string? ResolutionNumber { get; set; }
    public DateTime? ResolutionDate { get; set; }
    public string? CouncilMeetingRef { get; set; }
}
