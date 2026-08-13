using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/virement-approvals")]
public class VirementApprovalsController : ControllerBase
{
    private readonly BudgetDbContext _db;
    public VirementApprovalsController(BudgetDbContext db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> GetPending(
        [FromQuery] int? financialYearId,
        [FromQuery] int? scoaProjectId)
    {
        var query = _db.VirementRequests
            .Include(v => v.BudgetVersion)
            .Where(v => v.Status == VirementStatus.Submitted ||
                        v.Status == VirementStatus.DeptHeadApproved ||
                        v.Status == VirementStatus.BudgetOfficeApproved ||
                        v.Status == VirementStatus.CFOApproved ||
                        v.Status == VirementStatus.MMApproved)
            .AsQueryable();

        if (financialYearId.HasValue)
            query = query.Where(v => v.BudgetVersion.FinancialYearId == financialYearId.Value);

        if (scoaProjectId.HasValue)
            query = query.Where(v => v.FromScoaProjectId == scoaProjectId.Value ||
                                     v.ToScoaProjectId == scoaProjectId.Value);

        var virements = await query.OrderByDescending(v => v.CreatedOn).ToListAsync();

        var allProjects   = await _db.ScoaProjects.ToListAsync();
        var allFunctions  = await _db.ScoaFunctions.ToListAsync();
        var allFunds      = await _db.ScoaFunds.ToListAsync();
        var allItems      = await _db.ScoaItems.ToListAsync();
        var allRegions    = await _db.ScoaRegions.ToListAsync();

        var result = new List<object>();

        foreach (var v in virements)
        {
            var fromItem   = allItems.FirstOrDefault(x => x.Id == v.FromScoaItemId);
            var fromFund   = allFunds.FirstOrDefault(x => x.Id == v.FromScoaFundId);
            var fromFunc   = allFunctions.FirstOrDefault(x => x.Id == v.FromScoaFunctionId);
            var fromProj   = allProjects.FirstOrDefault(x => x.Id == v.FromScoaProjectId);
            var fromRegion = allRegions.FirstOrDefault(x => x.Id == v.FromScoaRegionId);

            var toItem   = allItems.FirstOrDefault(x => x.Id == v.ToScoaItemId);
            var toFund   = allFunds.FirstOrDefault(x => x.Id == v.ToScoaFundId);
            var toFunc   = allFunctions.FirstOrDefault(x => x.Id == v.ToScoaFunctionId);
            var toProj   = allProjects.FirstOrDefault(x => x.Id == v.ToScoaProjectId);
            var toRegion = allRegions.FirstOrDefault(x => x.Id == v.ToScoaRegionId);

            result.Add(new
            {
                id              = v.Id,
                virementNumber  = v.VirementNumber,
                status          = v.Status.ToString(),
                amount          = v.Amount,
                motivation      = v.Motivation,
                rejectionReason = v.RejectionReason,

                fromLegacyRef    = $"{fromFund?.Code}|{fromItem?.Code}",
                toLegacyRef      = $"{toFund?.Code}|{toItem?.Code}",

                fromProject      = fromProj != null ? $"{fromProj.Code} | {fromProj.Description}" : "",
                toProject        = toProj   != null ? $"{toProj.Code} | {toProj.Description}"     : "",

                fromScoaProject  = fromProj != null ? BuildPath(fromProj.Id,   allProjects,  "Capital")  : "",
                toScoaProject    = toProj   != null ? BuildPath(toProj.Id,     allProjects,  "Capital")  : "",

                fromScoaFunction = fromFunc != null ? BuildPath(fromFunc.Id,   allFunctions, "Function") : "",
                toScoaFunction   = toFunc   != null ? BuildPath(toFunc.Id,     allFunctions, "Function") : "",

                fromDivision     = fromRegion?.Description ?? "",
                toDivision       = toRegion?.Description   ?? "",

                fromScoaRegion   = fromRegion != null ? BuildPath(fromRegion.Id, allRegions, "Regional") : "",
                toScoaRegion     = toRegion   != null ? BuildPath(toRegion.Id,   allRegions, "Regional") : "",

                fromScoaItem     = fromItem != null ? BuildPath(fromItem.Id, allItems, "Assets") : "",
                toScoaItem       = toItem   != null ? BuildPath(toItem.Id,   allItems, "Assets") : "",

                fromScoaFund     = fromFund != null ? BuildPath(fromFund.Id, allFunds, "Fund") : "",
                toScoaFund       = toFund   != null ? BuildPath(toFund.Id,   allFunds, "Fund") : "",

                fromVirementAmount = v.Amount,
                toVirementAmount   = v.Amount,
            });
        }

        return Ok(result);
    }

    private static string BuildPath<T>(int id, List<T> all, string prefix)
        where T : class
    {
        var idProp   = typeof(T).GetProperty("Id")!;
        var descProp = typeof(T).GetProperty("Description")!;
        var parProp  = typeof(T).GetProperty("ParentId")!;

        var segments = new List<string>();
        int? current = id;
        var visited  = new HashSet<int>();

        while (current.HasValue && !visited.Contains(current.Value))
        {
            visited.Add(current.Value);
            var node = all.FirstOrDefault(x => (int)idProp.GetValue(x)! == current.Value);
            if (node == null) break;
            segments.Insert(0, (string)descProp.GetValue(node)!);
            current = (int?)parProp.GetValue(node);
        }

        if (!segments.Any()) return "";
        return prefix + ":" + string.Join(":", segments);
    }

    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects([FromQuery] int? financialYearId)
    {
        var projectIds = await _db.VirementRequests
            .Include(v => v.BudgetVersion)
            .Where(v => !financialYearId.HasValue || v.BudgetVersion.FinancialYearId == financialYearId)
            .Select(v => v.FromScoaProjectId)
            .Union(_db.VirementRequests
                .Include(v => v.BudgetVersion)
                .Where(v => !financialYearId.HasValue || v.BudgetVersion.FinancialYearId == financialYearId)
                .Select(v => v.ToScoaProjectId))
            .Distinct()
            .ToListAsync();

        var projects = await _db.ScoaProjects
            .Where(p => projectIds.Contains(p.Id))
            .OrderBy(p => p.Code)
            .Select(p => new { p.Id, label = $"{p.Code} | {p.Description}" })
            .ToListAsync();

        return Ok(projects);
    }

    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] List<VirementApprovalDecision> decisions)
    {
        foreach (var d in decisions)
        {
            var v = await _db.VirementRequests.FindAsync(d.Id);
            if (v == null) continue;

            if (d.Action == "Approve")
            {
                v.Status = VirementStatus.Posted;
                v.ApprovedBy = "System Admin";
                v.ApprovedOn = DateTime.UtcNow;
            }
            else if (d.Action == "Reject")
            {
                v.Status = VirementStatus.Rejected;
                v.RejectedBy = "System Admin";
                v.RejectedOn = DateTime.UtcNow;
                v.RejectionReason = d.RejectReason;
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Decisions saved successfully." });
    }

}

public class VirementApprovalDecision
{
    public int Id { get; set; }
    public string Action { get; set; } = "";
    public string? RejectReason { get; set; }
}
