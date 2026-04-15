using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ObjectivesController : ControllerBase
{
    private readonly IdpDbContext _context;
    public ObjectivesController(IdpDbContext context) => _context = context;

    [HttpGet("cycle/{cycleId}")]
    public async Task<ActionResult<IEnumerable<IdpStrategicObjective>>> GetByCycle(int cycleId)
    {
        return await _context.IdpStrategicObjectives
            .Where(o => o.CycleId == cycleId)
            .Include(o => o.Projects)
            .OrderBy(o => o.Code)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IdpStrategicObjective>> GetById(int id)
    {
        var obj = await _context.IdpStrategicObjectives
            .Include(o => o.Projects)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (obj == null) return NotFound();
        return obj;
    }

    [HttpPost]
    public async Task<ActionResult<IdpStrategicObjective>> Create(IdpStrategicObjective objective)
    {
        objective.CreatedDate = DateTime.UtcNow;
        objective.ModifiedDate = DateTime.UtcNow;
        _context.IdpStrategicObjectives.Add(objective);
        await _context.SaveChangesAsync();
        return Ok(objective);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, IdpStrategicObjective objective)
    {
        var existing = await _context.IdpStrategicObjectives.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Code = objective.Code;
        existing.Description = objective.Description;
        existing.AlignmentTags = objective.AlignmentTags;
        existing.NdpAlignment = objective.NdpAlignment;
        existing.ProvincialAlignment = objective.ProvincialAlignment;
        existing.ModifiedBy = objective.ModifiedBy;
        existing.ModifiedDate = DateTime.UtcNow;
        existing.VersionNo++;

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
