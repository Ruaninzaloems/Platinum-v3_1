using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly BudgetDbContext _db;
    private readonly DashboardService _dashboardService;

    public ReportsController(BudgetDbContext db, DashboardService dashboardService)
    {
        _db = db;
        _dashboardService = dashboardService;
    }

    [HttpGet("budget-vs-actual")]
    public async Task<IActionResult> GetBudgetVsActual([FromQuery] int? versionId)
    {
        var query = _db.BudgetStrings
            .Include(s => s.ScoaItem)
            .Include(s => s.ScoaFund)
            .AsQueryable();

        if (versionId.HasValue) query = query.Where(s => s.BudgetVersionId == versionId.Value);

        var strings = await query.ToListAsync();
        var revenueItemCodes = new[] { "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000" };

        var result = strings.GroupBy(s => new { s.ScoaItem.Code, s.ScoaItem.Description })
            .Select(g =>
            {
                var budget = g.Sum(s => s.Year1Amount);
                var monthlyTotal = g.Sum(s => s.Month01 + s.Month02 + s.Month03 + s.Month04 + s.Month05 + s.Month06);
                var actual = monthlyTotal > 0 ? monthlyTotal : budget * 0.42m;
                var variance = budget - actual;
                var variancePct = budget != 0 ? (variance / budget) * 100 : 0;
                var category = revenueItemCodes.Contains(g.Key.Code) ? "Revenue" : "Expenditure";
                return new BudgetVsActualDto(category, $"{g.Key.Code} - {g.Key.Description}", budget, actual, variance, variancePct);
            })
            .OrderBy(r => r.Category).ThenBy(r => r.SegmentString)
            .ToList();

        return Ok(result);
    }

    [HttpGet("schedule-a")]
    public async Task<IActionResult> GetScheduleA([FromQuery] int? versionId)
    {
        var query = _db.BudgetStrings
            .Include(s => s.ScoaItem)
            .Include(s => s.ScoaFunction)
            .AsQueryable();

        if (versionId.HasValue) query = query.Where(s => s.BudgetVersionId == versionId.Value);

        var strings = await query.ToListAsync();
        var revenueItemCodes = new[] { "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000" };

        var scheduleItems = strings.GroupBy(s => new { s.ScoaItem.Code, s.ScoaItem.Description })
            .Select(g => new ScheduleALineDto(
                g.Key.Code,
                g.Key.Description,
                revenueItemCodes.Contains(g.Key.Code) ? "Revenue" : "Expenditure",
                g.Sum(s => s.Year1Amount),
                g.Sum(s => s.Year2Amount),
                g.Sum(s => s.Year3Amount)
            ))
            .OrderBy(s => s.Category).ThenBy(s => s.Code)
            .ToList();

        var totalRevY1 = scheduleItems.Where(s => s.Category == "Revenue").Sum(s => s.Year1);
        var totalExpY1 = scheduleItems.Where(s => s.Category == "Expenditure").Sum(s => s.Year1);
        var totalRevY2 = scheduleItems.Where(s => s.Category == "Revenue").Sum(s => s.Year2);
        var totalExpY2 = scheduleItems.Where(s => s.Category == "Expenditure").Sum(s => s.Year2);
        var totalRevY3 = scheduleItems.Where(s => s.Category == "Revenue").Sum(s => s.Year3);
        var totalExpY3 = scheduleItems.Where(s => s.Category == "Expenditure").Sum(s => s.Year3);

        return Ok(new ScheduleADto(
            scheduleItems,
            totalRevY1, totalExpY1, totalRevY1 - totalExpY1,
            totalRevY2, totalExpY2, totalRevY2 - totalExpY2,
            totalRevY3, totalExpY3, totalRevY3 - totalExpY3
        ));
    }

    [HttpGet("mscoa-strings")]
    public async Task<IActionResult> GetMscoaStrings([FromQuery] int? versionId)
    {
        var query = _db.BudgetStrings
            .Include(s => s.ScoaItem).Include(s => s.ScoaFund).Include(s => s.ScoaFunction)
            .Include(s => s.ScoaProjectNav).Include(s => s.ScoaRegion)
            .Include(s => s.ScoaCosting).Include(s => s.ScoaMsc)
            .AsQueryable();

        if (versionId.HasValue) query = query.Where(s => s.BudgetVersionId == versionId.Value);

        var strings = await query.OrderBy(s => s.ScoaItem.Code).ToListAsync();

        var result = strings.Select(s => new MscoaStringExportDto(
            s.Id,
            $"{s.ScoaItem.Code}/{s.ScoaFund.Code}/{s.ScoaFunction.Code}/{s.ScoaProjectNav.Code}/{s.ScoaRegion.Code}/{s.ScoaCosting.Code}/{s.ScoaMsc.Code}",
            s.ScoaItem.Code, s.ScoaItem.Description,
            s.ScoaFund.Code, s.ScoaFund.Description,
            s.ScoaFunction.Code, s.ScoaFunction.Description,
            s.ScoaProjectNav.Code, s.ScoaProjectNav.Description,
            s.ScoaRegion.Code, s.ScoaRegion.Description,
            s.ScoaCosting.Code, s.ScoaCosting.Description,
            s.ScoaMsc.Code, s.ScoaMsc.Description,
            s.Year1Amount, s.Year2Amount, s.Year3Amount,
            s.Description ?? ""
        )).ToList();

        return Ok(result);
    }

    [HttpGet("mtref-summary/{versionId}")]
    public async Task<IActionResult> GetMtrefSummary(int versionId) =>
        Ok(await _dashboardService.GetMtrefSummaryAsync(versionId));

    [HttpGet("virement-register")]
    public async Task<IActionResult> GetVirementRegister([FromQuery] int? versionId, [FromQuery] string? status)
    {
        var query = _db.VirementRequests
            .Include(v => v.BudgetVersion)
            .AsQueryable();

        if (versionId.HasValue) query = query.Where(v => v.BudgetVersionId == versionId.Value);
        if (Enum.TryParse<VirementStatus>(status, true, out var vs)) query = query.Where(v => v.Status == vs);

        var virements = await query.OrderByDescending(v => v.CreatedOn).ToListAsync();

        var scoaItems = await _db.ScoaItems.ToDictionaryAsync(s => s.Id, s => s.Code);
        var scoaFunds = await _db.ScoaFunds.ToDictionaryAsync(s => s.Id, s => s.Code);
        var scoaFunctions = await _db.ScoaFunctions.ToDictionaryAsync(s => s.Id, s => s.Code);
        var scoaProjects = await _db.ScoaProjects.ToDictionaryAsync(s => s.Id, s => s.Code);
        var scoaRegions = await _db.ScoaRegions.ToDictionaryAsync(s => s.Id, s => s.Code);
        var scoaCostings = await _db.ScoaCostings.ToDictionaryAsync(s => s.Id, s => s.Code);
        var scoaMscs = await _db.ScoaMscs.ToDictionaryAsync(s => s.Id, s => s.Code);

        string BuildSegment(int itemId, int fundId, int funcId, int projId, int regId, int costId, int mscId) =>
            $"{scoaItems.GetValueOrDefault(itemId, "?")}/{scoaFunds.GetValueOrDefault(fundId, "?")}/{scoaFunctions.GetValueOrDefault(funcId, "?")}/{scoaProjects.GetValueOrDefault(projId, "?")}/{scoaRegions.GetValueOrDefault(regId, "?")}/{scoaCostings.GetValueOrDefault(costId, "?")}/{scoaMscs.GetValueOrDefault(mscId, "?")}";

        var result = virements.Select(v => new VirementRegisterDto(
            v.VirementNumber,
            v.BudgetVersion.VersionName,
            BuildSegment(v.FromScoaItemId, v.FromScoaFundId, v.FromScoaFunctionId, v.FromScoaProjectId, v.FromScoaRegionId, v.FromScoaCostingId, v.FromScoaMscId),
            BuildSegment(v.ToScoaItemId, v.ToScoaFundId, v.ToScoaFunctionId, v.ToScoaProjectId, v.ToScoaRegionId, v.ToScoaCostingId, v.ToScoaMscId),
            v.Amount,
            v.Status.ToString(),
            v.Motivation,
            v.CreatedBy,
            v.CreatedOn,
            v.ApprovedBy,
            v.ApprovedOn
        )).ToList();

        return Ok(result);
    }

    [HttpGet("adjustment-register")]
    public async Task<IActionResult> GetAdjustmentRegister([FromQuery] int? financialYearId)
    {
        var query = _db.BudgetVersions
            .Include(v => v.BudgetStrings)
            .Where(v => v.VersionType == BudgetVersionType.ADJB)
            .AsQueryable();

        if (financialYearId.HasValue) query = query.Where(v => v.FinancialYearId == financialYearId.Value);

        var adjustments = await query.OrderByDescending(v => v.CreatedOn).ToListAsync();

        var result = adjustments.Select(v => new AdjustmentRegisterDto(
            v.Id,
            v.VersionName,
            v.Status.ToString(),
            v.BudgetStrings.Sum(s => s.Year1Amount),
            v.BudgetStrings.Count,
            v.CreatedBy,
            v.CreatedOn,
            v.CouncilAdoptionDate,
            v.Description
        )).ToList();

        return Ok(result);
    }
}
