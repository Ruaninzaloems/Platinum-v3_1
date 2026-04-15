using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MscoaController : ControllerBase
{
    private readonly IdpDbContext _context;
    public MscoaController(IdpDbContext context) => _context = context;

    [HttpGet("{segmentType}")]
    public async Task<ActionResult<IEnumerable<MscoaSegment>>> GetByType(string segmentType)
    {
        return await _context.MscoaSegments
            .Where(s => s.SegmentType.ToLower() == segmentType.ToLower() && s.Status == "Active")
            .OrderBy(s => s.Level).ThenBy(s => s.Code)
            .ToListAsync();
    }

    [HttpGet("{segmentType}/posting-levels")]
    public async Task<ActionResult<IEnumerable<MscoaSegment>>> GetPostingLevels(string segmentType)
    {
        return await _context.MscoaSegments
            .Where(s => s.SegmentType.ToLower() == segmentType.ToLower() && s.IsPostingLevel && s.Status == "Active")
            .OrderBy(s => s.Code)
            .ToListAsync();
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MscoaSegment>>> GetAll()
    {
        return await _context.MscoaSegments
            .Where(s => s.Status == "Active")
            .OrderBy(s => s.SegmentType).ThenBy(s => s.Level).ThenBy(s => s.Code)
            .ToListAsync();
    }
}
