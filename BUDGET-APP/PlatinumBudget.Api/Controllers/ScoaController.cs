using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScoaController : ControllerBase
{
    private readonly BudgetDbContext _db;
    private readonly ValidationService _validation;

    public ScoaController(BudgetDbContext db, ValidationService validation)
    {
        _db = db;
        _validation = validation;
    }

    [HttpGet("items")]
    public async Task<IActionResult> GetItems() =>
        Ok(await _db.ScoaItems.Where(x => x.IsActive).OrderBy(x => x.Code).Select(x => new ScoaSegmentDto(x.Id, x.Code, x.Description, x.ParentId, x.Level, x.IsActive)).ToListAsync());

    [HttpGet("funds")]
    public async Task<IActionResult> GetFunds() =>
        Ok(await _db.ScoaFunds.Where(x => x.IsActive).OrderBy(x => x.Code).Select(x => new ScoaSegmentDto(x.Id, x.Code, x.Description, x.ParentId, x.Level, x.IsActive)).ToListAsync());

    [HttpGet("functions")]
    public async Task<IActionResult> GetFunctions() =>
        Ok(await _db.ScoaFunctions.Where(x => x.IsActive).OrderBy(x => x.Code).Select(x => new ScoaSegmentDto(x.Id, x.Code, x.Description, x.ParentId, x.Level, x.IsActive)).ToListAsync());

    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects() =>
        Ok(await _db.ScoaProjects.Where(x => x.IsActive).OrderBy(x => x.Code).Select(x => new ScoaSegmentDto(x.Id, x.Code, x.Description, x.ParentId, x.Level, x.IsActive)).ToListAsync());

    [HttpGet("regions")]
    public async Task<IActionResult> GetRegions() =>
        Ok(await _db.ScoaRegions.Where(x => x.IsActive).OrderBy(x => x.Code).Select(x => new ScoaSegmentDto(x.Id, x.Code, x.Description, x.ParentId, x.Level, x.IsActive)).ToListAsync());

    [HttpGet("costings")]
    public async Task<IActionResult> GetCostings() =>
        Ok(await _db.ScoaCostings.Where(x => x.IsActive).OrderBy(x => x.Code).Select(x => new ScoaSegmentDto(x.Id, x.Code, x.Description, x.ParentId, x.Level, x.IsActive)).ToListAsync());

    [HttpGet("mscs")]
    public async Task<IActionResult> GetMscs() =>
        Ok(await _db.ScoaMscs.Where(x => x.IsActive).OrderBy(x => x.Code).Select(x => new ScoaSegmentDto(x.Id, x.Code, x.Description, x.ParentId, x.Level, x.IsActive)).ToListAsync());

    [HttpPost("validate-combination")]
    public IActionResult ValidateCombination([FromBody] ValidateCombinationDto dto) =>
        Ok(_validation.ValidateCombination(dto));
}
