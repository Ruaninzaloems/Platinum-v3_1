using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/virement-policies")]
public class VirementPolicyController : ControllerBase
{
    private readonly BudgetDbContext _db;

    public VirementPolicyController(BudgetDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? financialYearId)
    {
        var query = _db.VirementPolicies
            .Include(p => p.FinancialYear)
            .Include(p => p.Rules)
            .AsQueryable();

        if (financialYearId.HasValue)
            query = query.Where(p => p.FinancialYearId == financialYearId.Value);

        var policies = await query.OrderByDescending(p => p.CreatedOn).ToListAsync();
        return Ok(policies.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var policy = await _db.VirementPolicies
            .Include(p => p.FinancialYear)
            .Include(p => p.Rules.OrderBy(r => r.SortOrder))
            .FirstOrDefaultAsync(p => p.Id == id);

        return policy == null ? NotFound() : Ok(MapToDto(policy));
    }

    [HttpGet("active/{financialYearId}")]
    public async Task<IActionResult> GetActive(int financialYearId)
    {
        var policy = await _db.VirementPolicies
            .Include(p => p.FinancialYear)
            .Include(p => p.Rules.OrderBy(r => r.SortOrder))
            .FirstOrDefaultAsync(p => p.FinancialYearId == financialYearId && p.IsActive);

        return policy == null ? NotFound("No active policy for this financial year") : Ok(MapToDto(policy));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVirementPolicyDto dto)
    {
        var fy = await _db.FinancialYears.FindAsync(dto.FinancialYearId);
        if (fy == null) return BadRequest("Financial year not found");

        var existingCount = await _db.VirementPolicies.CountAsync(p => p.FinancialYearId == dto.FinancialYearId);
        var version = $"{fy.YearCode}_VP{existingCount + 1:D3}";

        var policy = new VirementPolicy
        {
            FinancialYearId = dto.FinancialYearId,
            PolicyVersion = version,
            IsActive = true
        };

        var previous = await _db.VirementPolicies
            .Where(p => p.FinancialYearId == dto.FinancialYearId && p.IsActive)
            .ToListAsync();
        foreach (var p in previous) p.IsActive = false;

        _db.VirementPolicies.Add(policy);
        await _db.SaveChangesAsync();

        return Ok(new { policy.Id, policy.PolicyVersion });
    }

    [HttpPost("{id}/rules")]
    public async Task<IActionResult> AddRule(int id, [FromBody] CreateVirementPolicyRuleDto dto)
    {
        var policy = await _db.VirementPolicies.FindAsync(id);
        if (policy == null) return NotFound();
        if (policy.IsLocked) return BadRequest("Policy is locked");

        var maxSort = await _db.VirementPolicyRules
            .Where(r => r.VirementPolicyId == id)
            .Select(r => r.SortOrder)
            .DefaultIfEmpty(0)
            .MaxAsync();

        var rule = new VirementPolicyRule
        {
            VirementPolicyId = id,
            Principle = dto.Principle,
            Description = dto.Description,
            ValidationRule = dto.ValidationRule,
            Severity = dto.Severity,
            SegmentType = dto.SegmentType,
            FromSegmentFilter = dto.FromSegmentFilter,
            ToSegmentFilter = dto.ToSegmentFilter,
            ThresholdPercent = dto.ThresholdPercent,
            MaxAmount = dto.MaxAmount,
            RequiresCouncilApproval = dto.RequiresCouncilApproval,
            SortOrder = maxSort + 1
        };

        _db.VirementPolicyRules.Add(rule);
        await _db.SaveChangesAsync();

        return Ok(new { rule.Id });
    }

    [HttpPut("rules/{ruleId}")]
    public async Task<IActionResult> UpdateRule(int ruleId, [FromBody] UpdateVirementPolicyRuleDto dto)
    {
        var rule = await _db.VirementPolicyRules.Include(r => r.Policy).FirstOrDefaultAsync(r => r.Id == ruleId);
        if (rule == null) return NotFound();
        if (rule.Policy.IsLocked) return BadRequest("Policy is locked");

        rule.IsEnabled = dto.IsEnabled;
        rule.Principle = dto.Principle;
        rule.Description = dto.Description;
        rule.ValidationRule = dto.ValidationRule;
        rule.Severity = dto.Severity;
        rule.SegmentType = dto.SegmentType;
        rule.FromSegmentFilter = dto.FromSegmentFilter;
        rule.ToSegmentFilter = dto.ToSegmentFilter;
        rule.ThresholdPercent = dto.ThresholdPercent;
        rule.MaxAmount = dto.MaxAmount;
        rule.RequiresCouncilApproval = dto.RequiresCouncilApproval;
        rule.SortOrder = dto.SortOrder;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("rules/{ruleId}")]
    public async Task<IActionResult> DeleteRule(int ruleId)
    {
        var rule = await _db.VirementPolicyRules.Include(r => r.Policy).FirstOrDefaultAsync(r => r.Id == ruleId);
        if (rule == null) return NotFound();
        if (rule.Policy.IsLocked) return BadRequest("Policy is locked");

        _db.VirementPolicyRules.Remove(rule);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/lock")]
    public async Task<IActionResult> Lock(int id)
    {
        var policy = await _db.VirementPolicies.FindAsync(id);
        if (policy == null) return NotFound();
        policy.IsLocked = true;
        policy.LockedBy = "CFO";
        policy.LockedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/unlock")]
    public async Task<IActionResult> Unlock(int id)
    {
        var policy = await _db.VirementPolicies.FindAsync(id);
        if (policy == null) return NotFound();
        policy.IsLocked = false;
        policy.LockedBy = null;
        policy.LockedOn = null;
        await _db.SaveChangesAsync();
        return Ok();
    }

    private static VirementPolicyDto MapToDto(VirementPolicy p) => new(
        p.Id, p.FinancialYearId, p.FinancialYear.YearCode, p.PolicyVersion,
        p.IsActive, p.IsLocked, p.LockedBy, p.LockedOn, p.CreatedBy, p.CreatedOn,
        p.Rules.OrderBy(r => r.SortOrder).Select(r => new VirementPolicyRuleDto(
            r.Id, r.VirementPolicyId, r.IsEnabled, r.Principle, r.Description,
            r.ValidationRule, r.Severity, r.SegmentType, r.FromSegmentFilter,
            r.ToSegmentFilter, r.ThresholdPercent, r.MaxAmount,
            r.RequiresCouncilApproval, r.SortOrder
        )).ToList()
    );
}
