using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PriorityController : ControllerBase
{
    private readonly IdpDbContext _context;
    public PriorityController(IdpDbContext context) => _context = context;

    [HttpGet("frameworks")]
    public async Task<ActionResult<IEnumerable<PriorityFramework>>> GetFrameworks()
    {
        return await _context.PriorityFrameworks
            .Include(f => f.Criteria.Where(c => c.IsActive))
            .OrderByDescending(f => f.Status == "Active")
            .ThenByDescending(f => f.Version)
            .ToListAsync();
    }

    [HttpGet("frameworks/{id}")]
    public async Task<ActionResult<PriorityFramework>> GetFramework(int id)
    {
        var fw = await _context.PriorityFrameworks
            .Include(f => f.Criteria.OrderBy(c => c.SortOrder))
            .Include(f => f.ScoringScales.OrderBy(s => s.ScoreValue))
            .FirstOrDefaultAsync(f => f.Id == id);
        if (fw == null) return NotFound();
        return fw;
    }

    [HttpPost("frameworks")]
    public async Task<ActionResult<PriorityFramework>> CreateFramework(PriorityFramework fw)
    {
        fw.Status = "Draft";
        fw.CreatedDate = DateTime.UtcNow;
        fw.ModifiedDate = DateTime.UtcNow;
        _context.PriorityFrameworks.Add(fw);

        _context.PriorityFrameworkAudits.Add(new PriorityFrameworkAudit
        {
            FrameworkId = fw.Id, ChangeType = "Created",
            NewValue = $"Framework '{fw.Name}' created", ChangedBy = fw.CreatedBy,
            CreatedBy = fw.CreatedBy
        });

        await _context.SaveChangesAsync();
        return Ok(fw);
    }

    [HttpPut("frameworks/{id}")]
    public async Task<IActionResult> UpdateFramework(int id, [FromBody] System.Text.Json.JsonElement body)
    {
        var existing = await _context.PriorityFrameworks.FindAsync(id);
        if (existing == null) return NotFound();

        int? user = null;

        if (body.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == System.Text.Json.JsonValueKind.String)
        {
            var newName = nameProp.GetString()!;
            if (existing.Name != newName)
            {
                LogAudit(id, "Updated", "Name", existing.Name, newName, user);
                existing.Name = newName;
            }
        }
        if (body.TryGetProperty("scaleMin", out var sMinProp) && sMinProp.ValueKind == System.Text.Json.JsonValueKind.Number)
        {
            var newVal = sMinProp.GetInt32();
            if (existing.ScaleMin != newVal)
            {
                LogAudit(id, "Updated", "ScaleMin", existing.ScaleMin.ToString(), newVal.ToString(), user);
                existing.ScaleMin = newVal;
            }
        }
        if (body.TryGetProperty("scaleMax", out var sMaxProp) && sMaxProp.ValueKind == System.Text.Json.JsonValueKind.Number)
        {
            var newVal = sMaxProp.GetInt32();
            if (existing.ScaleMax != newVal)
            {
                LogAudit(id, "Updated", "ScaleMax", existing.ScaleMax.ToString(), newVal.ToString(), user);
                existing.ScaleMax = newVal;
            }
        }
        if (body.TryGetProperty("status", out var statusProp) && statusProp.ValueKind == System.Text.Json.JsonValueKind.String)
        {
            var newStatus = statusProp.GetString()!;
            if (existing.Status != newStatus)
            {
                LogAudit(id, "Updated", "Status", existing.Status, newStatus, user);
                existing.Status = newStatus;
            }
        }

        existing.ModifiedDate = DateTime.UtcNow;
        existing.VersionNo++;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("frameworks/{id}/clone")]
    public async Task<ActionResult<PriorityFramework>> CloneFramework(int id)
    {
        var source = await _context.PriorityFrameworks
            .Include(f => f.Criteria)
            .Include(f => f.ScoringScales)
            .FirstOrDefaultAsync(f => f.Id == id);
        if (source == null) return NotFound();

        var maxVersion = await _context.PriorityFrameworks
            .Where(f => f.Name == source.Name || f.Name.StartsWith(source.Name))
            .MaxAsync(f => f.Version);

        var clone = new PriorityFramework
        {
            Name = source.Name,
            Version = maxVersion + 1,
            CycleId = source.CycleId,
            Status = "Draft",
            HumanWeight = source.HumanWeight,
            AiWeight = source.AiWeight,
            AiMode = source.AiMode,
            ScaleMin = source.ScaleMin,
            ScaleMax = source.ScaleMax,
            CreatedBy = null,
            ModifiedBy = null
        };
        _context.PriorityFrameworks.Add(clone);

        foreach (var c in source.Criteria)
        {
            _context.PriorityCriteria.Add(new PriorityCriteria
            {
                FrameworkId = clone.Id,
                Code = c.Code, Name = c.Name, Description = c.Description,
                Category = c.Category, Weight = c.Weight, IsActive = c.IsActive,
                SortOrder = c.SortOrder, CreatedBy = null
            });
        }

        foreach (var s in source.ScoringScales)
        {
            _context.PriorityScoringScales.Add(new PriorityScoringScale
            {
                FrameworkId = clone.Id,
                ScoreValue = s.ScoreValue, Label = s.Label, CreatedBy = null
            });
        }

        _context.PriorityFrameworkAudits.Add(new PriorityFrameworkAudit
        {
            FrameworkId = clone.Id, ChangeType = "Cloned",
            NewValue = $"Cloned from v{source.Version} to v{clone.Version}",
            ChangedBy = null, CreatedBy = null
        });

        await _context.SaveChangesAsync();
        return Ok(clone);
    }

    [HttpPatch("frameworks/{id}/activate")]
    public async Task<IActionResult> ActivateFramework(int id, [FromBody] ActivateRequest request)
    {
        var fw = await _context.PriorityFrameworks
            .Include(f => f.Criteria.Where(c => c.IsActive))
            .FirstOrDefaultAsync(f => f.Id == id);
        if (fw == null) return NotFound();

        var weightTotal = fw.Criteria.Sum(c => c.Weight);
        if (weightTotal != 100m)
            return BadRequest($"Cannot activate: active criteria weights sum to {weightTotal}%, must be exactly 100%");

        var activeFrameworks = await _context.PriorityFrameworks
            .Where(f => f.Status == "Active" && f.Id != id)
            .ToListAsync();
        foreach (var af in activeFrameworks)
        {
            af.Status = "Archived";
            af.ModifiedDate = DateTime.UtcNow;
        }

        fw.Status = "Active";
        fw.CycleId = request.CycleId;
        fw.ModifiedDate = DateTime.UtcNow;
        fw.VersionNo++;

        LogAudit(id, "Activated", "Status", "Draft", "Active", null);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("frameworks/{id}/criteria")]
    public async Task<ActionResult<IEnumerable<PriorityCriteria>>> GetCriteria(int id)
    {
        return await _context.PriorityCriteria
            .Where(c => c.FrameworkId == id)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();
    }

    [HttpPost("frameworks/{id}/criteria")]
    public async Task<ActionResult<PriorityCriteria>> AddCriterion(int id, PriorityCriteria criterion)
    {
        var fw = await _context.PriorityFrameworks.FindAsync(id);
        if (fw == null) return NotFound();

        criterion.FrameworkId = id;
        criterion.CreatedDate = DateTime.UtcNow;
        criterion.ModifiedDate = DateTime.UtcNow;
        _context.PriorityCriteria.Add(criterion);

        LogAudit(id, "CriterionAdded", "Criteria", null, $"{criterion.Code}: {criterion.Name} ({criterion.Weight}%)", criterion.CreatedBy);

        await _context.SaveChangesAsync();
        return Ok(criterion);
    }

    [HttpPut("criteria/{id}")]
    public async Task<IActionResult> UpdateCriterion(int id, [FromBody] System.Text.Json.JsonElement body)
    {
        var existing = await _context.PriorityCriteria.FindAsync(id);
        if (existing == null) return NotFound();

        int? user = null;

        if (body.TryGetProperty("code", out var codeProp) && codeProp.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.Code = codeProp.GetString()!;
        if (body.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.Name = nameProp.GetString()!;
        if (body.TryGetProperty("description", out var descProp) && descProp.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.Description = descProp.GetString();
        if (body.TryGetProperty("category", out var catProp) && catProp.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.Category = catProp.GetString()!;
        if (body.TryGetProperty("weight", out var weightProp) && weightProp.ValueKind == System.Text.Json.JsonValueKind.Number)
        {
            var newWeight = weightProp.GetDecimal();
            if (existing.Weight != newWeight)
            {
                LogAudit(existing.FrameworkId, "WeightChanged", existing.Code, existing.Weight.ToString("F2"), newWeight.ToString("F2"), user);
                existing.Weight = newWeight;
            }
        }
        if (body.TryGetProperty("isActive", out var activeProp))
        {
            bool newActive = activeProp.ValueKind == System.Text.Json.JsonValueKind.True;
            if (existing.IsActive != newActive)
            {
                LogAudit(existing.FrameworkId, newActive ? "CriterionActivated" : "CriterionDeactivated", existing.Code, existing.IsActive.ToString(), newActive.ToString(), user);
                existing.IsActive = newActive;
            }
        }
        if (body.TryGetProperty("sortOrder", out var sortProp) && sortProp.ValueKind == System.Text.Json.JsonValueKind.Number)
            existing.SortOrder = sortProp.GetInt32();

        existing.ModifiedDate = DateTime.UtcNow;
        existing.VersionNo++;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("criteria/{id}")]
    public async Task<IActionResult> DeleteCriterion(int id)
    {
        var existing = await _context.PriorityCriteria.FindAsync(id);
        if (existing == null) return NotFound();

        existing.IsActive = false;
        existing.ModifiedDate = DateTime.UtcNow;
        existing.VersionNo++;

        LogAudit(existing.FrameworkId, "CriterionDeactivated", existing.Code, "Active", "Inactive", null);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("frameworks/{id}/scale")]
    public async Task<ActionResult<IEnumerable<PriorityScoringScale>>> GetScale(int id)
    {
        return await _context.PriorityScoringScales
            .Where(s => s.FrameworkId == id)
            .OrderBy(s => s.ScoreValue)
            .ToListAsync();
    }

    [HttpPut("frameworks/{id}/scale")]
    public async Task<IActionResult> UpdateScale(int id, [FromBody] List<PriorityScoringScale> scales)
    {
        var fw = await _context.PriorityFrameworks.FindAsync(id);
        if (fw == null) return NotFound();

        var existing = await _context.PriorityScoringScales.Where(s => s.FrameworkId == id).ToListAsync();
        _context.PriorityScoringScales.RemoveRange(existing);

        foreach (var s in scales)
        {
            s.FrameworkId = id;
            s.CreatedDate = DateTime.UtcNow;
            s.ModifiedDate = DateTime.UtcNow;
            _context.PriorityScoringScales.Add(s);
        }

        fw.ScaleMin = scales.Min(s => s.ScoreValue);
        fw.ScaleMax = scales.Max(s => s.ScoreValue);
        fw.ModifiedDate = DateTime.UtcNow;

        LogAudit(id, "ScaleUpdated", "ScoringScale", null, $"{scales.Count} scale values configured ({fw.ScaleMin}-{fw.ScaleMax})", null);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("frameworks/{id}/ai-config")]
    public async Task<IActionResult> UpdateAiConfig(int id, [FromBody] AiConfigRequest config)
    {
        var fw = await _context.PriorityFrameworks.FindAsync(id);
        if (fw == null) return NotFound();

        if (config.HumanWeight + config.AiWeight != 100m)
            return BadRequest("Human weight + AI weight must equal 100");

        var validModes = new[] { "Disabled", "Advisory", "Blended" };
        if (!validModes.Contains(config.AiMode))
            return BadRequest($"Invalid AI mode. Must be one of: {string.Join(", ", validModes)}");

        LogAudit(id, "AiConfigUpdated", "AiMode", fw.AiMode, config.AiMode, null);

        fw.HumanWeight = config.HumanWeight;
        fw.AiWeight = config.AiWeight;
        fw.AiMode = config.AiMode;
        fw.ModifiedDate = DateTime.UtcNow;
        fw.VersionNo++;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("frameworks/{id}/audit")]
    public async Task<ActionResult<IEnumerable<PriorityFrameworkAudit>>> GetAudit(int id)
    {
        return await _context.PriorityFrameworkAudits
            .Where(a => a.FrameworkId == id)
            .OrderByDescending(a => a.ChangedDate)
            .ToListAsync();
    }

    private void LogAudit(int frameworkId, string changeType, string? field, string? oldVal, string? newVal, int? by)
    {
        _context.PriorityFrameworkAudits.Add(new PriorityFrameworkAudit
        {
            FrameworkId = frameworkId, ChangeType = changeType,
            FieldName = field, OldValue = oldVal, NewValue = newVal,
            ChangedBy = by, CreatedBy = by
        });
    }
}

public class ActivateRequest
{
    public int CycleId { get; set; }
}

public class AiConfigRequest
{
    public decimal HumanWeight { get; set; }
    public decimal AiWeight { get; set; }
    public string AiMode { get; set; } = "Disabled";
}
