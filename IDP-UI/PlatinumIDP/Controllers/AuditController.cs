using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private readonly IdpDbContext _context;
    public AuditController(IdpDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<IdpAuditLog>>> GetAll([FromQuery] int limit = 50)
    {
        return await _context.IdpAuditLogs
            .OrderByDescending(a => a.PerformedDate)
            .Take(limit)
            .ToListAsync();
    }

    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<ActionResult<IEnumerable<IdpAuditLog>>> GetByEntity(string entityType, int entityId)
    {
        return await _context.IdpAuditLogs
            .Where(a => a.EntityType == entityType && a.EntityId == entityId)
            .OrderByDescending(a => a.PerformedDate)
            .ToListAsync();
    }
}
