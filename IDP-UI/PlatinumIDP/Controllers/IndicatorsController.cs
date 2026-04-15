using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IndicatorsController : ControllerBase
{
    private readonly IdpDbContext _context;
    public IndicatorsController(IdpDbContext context) => _context = context;

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<IEnumerable<IdpProjectIndicator>>> GetByProject(int projectId)
    {
        return await _context.IdpProjectIndicators
            .Where(i => i.ProjectId == projectId)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<IdpProjectIndicator>> Create(IdpProjectIndicator indicator)
    {
        indicator.CreatedDate = DateTime.UtcNow;
        indicator.ModifiedDate = DateTime.UtcNow;
        _context.IdpProjectIndicators.Add(indicator);
        await _context.SaveChangesAsync();
        return Ok(indicator);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, IdpProjectIndicator indicator)
    {
        var existing = await _context.IdpProjectIndicators.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = indicator.Name;
        existing.Baseline = indicator.Baseline;
        existing.TargetY1 = indicator.TargetY1;
        existing.TargetY2 = indicator.TargetY2;
        existing.TargetY3 = indicator.TargetY3;
        existing.TargetY4 = indicator.TargetY4;
        existing.TargetY5 = indicator.TargetY5;
        existing.ResponsibleOfficial = indicator.ResponsibleOfficial;
        existing.EvidenceLink = indicator.EvidenceLink;
        existing.ModifiedBy = indicator.ModifiedBy;
        existing.ModifiedDate = DateTime.UtcNow;
        existing.VersionNo++;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var indicator = await _context.IdpProjectIndicators.FindAsync(id);
        if (indicator == null) return NotFound();
        _context.IdpProjectIndicators.Remove(indicator);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
