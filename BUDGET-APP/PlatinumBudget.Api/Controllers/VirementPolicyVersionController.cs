using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/virement-policy-v2")]
public class VirementPolicyVersionController : ControllerBase
{
    private readonly BudgetDbContext _db;
    private readonly IWebHostEnvironment _env;
    private const int CURRENT_USER_ID = 2;

    public VirementPolicyVersionController(BudgetDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // GET /api/virement-policy-v2/versions?fyCode=2025/2026
    [HttpGet("versions")]
    public async Task<IActionResult> GetVersions([FromQuery] string fyCode)
    {
        var versions = await _db.Plan_VirementPolicyVersion
            .Where(v => v.FinancialYear == fyCode)
            .OrderByDescending(v => v.DateCaptured)
            .ToListAsync();

        return Ok(versions.Select(v => new
        {
            id = v.VirementPolicyVersion_ID,
            financialYear = v.FinancialYear,
            versionNumber = v.VersionNumber,
            versionName = v.VersionName,
            comments = v.Comments,
            isCouncilApprovedPolicy = v.IsCouncilApprovedPolicy,
            approvedVirementPolicyFileName = v.ApprovedVirementPolicyFileName,
            isLocked = v.IsLocked,
            dateCaptured = v.DateCaptured
        }));
    }

    // GET /api/virement-policy-v2/versions/{id}/details
    [HttpGet("versions/{id}/details")]
    public async Task<IActionResult> GetVersionDetails(int id)
    {
        var details = await _db.Plan_VirementPolicyVersionDetail
            .Where(d => d.VirementPolicyVersionID == id && d.Enabled)
            .OrderBy(d => d.Priority)
            .ToListAsync();

        return Ok(details.Select(d => new
        {
            id = d.VirementPolicyVersionDetail_ID,
            virementPolicyVersionID = d.VirementPolicyVersionID,
            virementRuleId = d.VirementRule_ID,
            priority = d.Priority,
            option = d.Option,
            virementDesc = d.VirementDesc,
            virementRuleDesc = d.VirementRuleDesc,
            virementDefinition = d.VirementDefinition,
            enabled = d.Enabled,
            lockdown = d.Lockdown,
            finYear = d.FinYear
        }));
    }

    // GET /api/virement-policy-v2/sys-rules?fyCode=2025/2026
    [HttpGet("sys-rules")]
    public async Task<IActionResult> GetSysRules([FromQuery] string fyCode)
    {
        var rules = await _db.Const_PlanVirementRules_sys
            .Where(r => r.FinYear == fyCode && r.Enabled)
            .OrderBy(r => r.Priority)
            .ToListAsync();

        return Ok(rules.Select(r => new
        {
            id = r.VirementRule_ID,
            priority = r.Priority,
            option = r.Option,
            virementDesc = r.VirementDesc,
            virementRuleDesc = r.VirementRuleDesc,
            virementDefinition = r.VirementDefinition,
            enabled = r.Enabled,
            lockdown = r.Lockdown,
            finYear = r.FinYear
        }));
    }

    // POST /api/virement-policy-v2/lock  (multipart/form-data — creates new version)
    [HttpPost("lock")]
    public async Task<IActionResult> Lock([FromForm] LockPolicyVersionRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FyCode))
            return BadRequest("Financial year code is required");

        var existingCount = await _db.Plan_VirementPolicyVersion
            .CountAsync(v => v.FinancialYear == req.FyCode);
        var versionNumber = $"{req.FyCode}_VP{existingCount + 1:D3}";

        string? fileName = null;
        if (req.PolicyFile != null && req.PolicyFile.Length > 0)
        {
            var uploadDir = Path.Combine(_env.ContentRootPath, "uploads", "virement-policies");
            Directory.CreateDirectory(uploadDir);
            var ext = Path.GetExtension(req.PolicyFile.FileName);
            fileName = $"{versionNumber.Replace("/", "-")}{ext}";
            var filePath = Path.Combine(uploadDir, fileName);
            await using var stream = System.IO.File.Create(filePath);
            await req.PolicyFile.CopyToAsync(stream);
        }

        var version = new Plan_VirementPolicyVersion
        {
            FinancialYear = req.FyCode,
            VersionNumber = versionNumber,
            VersionName = req.VersionName ?? string.Empty,
            Comments = req.Comments ?? string.Empty,
            IsCouncilApprovedPolicy = req.IsCouncilApprovedPolicy,
            ApprovedVirementPolicyFileName = fileName,
            DateCaptured = DateTime.UtcNow,
            CapturerID = CURRENT_USER_ID,
            IsLocked = true
        };
        _db.Plan_VirementPolicyVersion.Add(version);
        await _db.SaveChangesAsync();

        var sysRules = await _db.Const_PlanVirementRules_sys
            .Where(r => r.FinYear == req.FyCode && r.Enabled)
            .ToListAsync();

        // Option = false if IsCouncilApprovedPolicy = Yes; Option = true if No
        var lockedOption = !(req.IsCouncilApprovedPolicy ?? false);

        foreach (var rule in sysRules)
        {
            _db.Plan_VirementPolicyVersionDetail.Add(new Plan_VirementPolicyVersionDetail
            {
                VirementPolicyVersionID = version.VirementPolicyVersion_ID,
                VirementRule_ID = rule.VirementRule_ID,
                Priority = rule.Priority,
                VirementDesc = rule.VirementDesc ?? string.Empty,
                VirementDefinition = rule.VirementDefinition ?? string.Empty,
                VirementRuleDesc = rule.VirementRuleDesc ?? string.Empty,
                BusinessRule = rule.BusinessRule ?? string.Empty,
                Enabled = rule.Enabled,
                Option = lockedOption,
                Lockdown = true,
                FinYear = rule.FinYear,
                PreviousReferenceId = rule.VirementRule_ID,
                DateCaptured = DateTime.UtcNow,
                CapturerID = CURRENT_USER_ID
            });

            rule.Option = lockedOption;
            rule.Lockdown = true;
            rule.DateModified = DateTime.UtcNow;
            rule.ModifierID = CURRENT_USER_ID;
            rule.VirementPolicyVersionID = version.VirementPolicyVersion_ID;
        }

        await _db.SaveChangesAsync();
        return Ok(new { id = version.VirementPolicyVersion_ID, versionNumber });
    }

    // POST /api/virement-policy-v2/versions/{id}/unlock
    [HttpPost("versions/{id}/unlock")]
    public async Task<IActionResult> Unlock(int id)
    {
        var version = await _db.Plan_VirementPolicyVersion.FindAsync(id);
        if (version == null) return NotFound();

        version.IsLocked = false;
        version.DateModified = DateTime.UtcNow;
        version.ModifierID = CURRENT_USER_ID;
        await _db.SaveChangesAsync();
        return Ok();
    }

    // POST /api/virement-policy-v2/versions/{id}/relock
    [HttpPost("versions/{id}/relock")]
    public async Task<IActionResult> Relock(int id)
    {
        var version = await _db.Plan_VirementPolicyVersion.FindAsync(id);
        if (version == null) return NotFound();

        version.IsLocked = true;
        version.DateModified = DateTime.UtcNow;
        version.ModifierID = CURRENT_USER_ID;
        await _db.SaveChangesAsync();
        return Ok();
    }

    // GET /api/virement-policy-v2/next-version-number?fyCode=2025/2026
    [HttpGet("next-version-number")]
    public async Task<IActionResult> GetNextVersionNumber([FromQuery] string fyCode)
    {
        var count = await _db.Plan_VirementPolicyVersion
            .CountAsync(v => v.FinancialYear == fyCode);
        return Ok(new { versionNumber = $"{fyCode}_VP{count + 1:D3}" });
    }

    // PATCH /api/virement-policy-v2/sys-rules/{id}/option
    [HttpPatch("sys-rules/{id}/option")]
    public async Task<IActionResult> UpdateSysRuleOption(int id, [FromBody] UpdateOptionRequest req)
    {
        var rule = await _db.Const_PlanVirementRules_sys.FindAsync(id);
        if (rule == null) return NotFound();
        rule.Option = req.Option;
        rule.DateModified = DateTime.UtcNow;
        rule.ModifierID = CURRENT_USER_ID;
        await _db.SaveChangesAsync();
        return Ok();
    }

    // PATCH /api/virement-policy-v2/details/{id}/option
    [HttpPatch("details/{id}/option")]
    public async Task<IActionResult> UpdateDetailOption(int id, [FromBody] UpdateOptionRequest req)
    {
        var detail = await _db.Plan_VirementPolicyVersionDetail.FindAsync(id);
        if (detail == null) return NotFound();
        detail.Option = req.Option;
        detail.DateModified = DateTime.UtcNow;
        detail.ModifierID = CURRENT_USER_ID;
        await _db.SaveChangesAsync();
        return Ok();
    }
}

public class LockPolicyVersionRequest
{
    public string FyCode { get; set; } = string.Empty;
    public string? VersionName { get; set; }
    public string? Comments { get; set; }
    public bool? IsCouncilApprovedPolicy { get; set; }
    public IFormFile? PolicyFile { get; set; }
}

public class UpdateOptionRequest
{
    public bool Option { get; set; }
}
