using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class DashboardService
{
    private readonly BudgetDbContext _db;

    public DashboardService(BudgetDbContext db)
    {
        _db = db;
    }

    public async Task<CfoDashboardDto> GetCfoDashboardAsync(int? financialYearId = null)
    {
        var versions = _db.BudgetVersions
            .Include(v => v.BudgetStrings).ThenInclude(s => s.ScoaItem)
            .Include(v => v.BudgetStrings).ThenInclude(s => s.ScoaFunction)
            .Include(v => v.BudgetStrings).ThenInclude(s => s.Project).ThenInclude(p => p!.Department)
            .AsQueryable();
        if (financialYearId.HasValue) versions = versions.Where(v => v.FinancialYearId == financialYearId.Value);

        var allVersions = await versions.ToListAsync();
        var activeVersion = allVersions.FirstOrDefault(v => v.Status == BudgetVersionStatus.ActiveForImplementation)
            ?? allVersions.FirstOrDefault(v => v.Status == BudgetVersionStatus.Locked)
            ?? allVersions.FirstOrDefault(v => v.Status == BudgetVersionStatus.Approved)
            ?? allVersions.OrderByDescending(v => v.BudgetStrings.Count).FirstOrDefault();
        var allStrings = activeVersion?.BudgetStrings.ToList() ?? new List<BudgetString>();

        var revenueItemCodes = new[] { "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000" };
        var capitalItemCodes = new[] { "7000", "8000" };

        var totalY1 = allStrings.Sum(s => s.Year1Amount);
        var revenueY1 = allStrings.Where(s => revenueItemCodes.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
        var capitalY1 = allStrings.Where(s => capitalItemCodes.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
        var expenditureY1 = totalY1 - revenueY1;
        var operatingY1 = expenditureY1 - capitalY1;

        var byFunction = allStrings.GroupBy(s => s.ScoaFunction.Description)
            .Select(g => new FunctionBudgetDto(g.Key, g.Sum(s => s.Year1Amount), g.Sum(s => s.Year2Amount), g.Sum(s => s.Year3Amount)))
            .OrderByDescending(f => f.Year1).ToList();

        var pendingApprovals = await _db.BudgetVersions.CountAsync(v => v.Status == BudgetVersionStatus.Pending);
        var validationErrors = await _db.ValidationResults.CountAsync(r => r.Status == ValidationStatus.Error);

        var months = new[] { "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun" };
        var monthlyTrend = months.Select((m, i) => new MonthlyTrendDto(m, totalY1 / 12 * (i + 1), totalY1 / 12 * (i + 1) * (0.85m + (decimal)new Random(i).NextDouble() * 0.3m))).ToList();

        var versionStatuses = allVersions.Select(v => new VersionStatusDto(
            v.Id, v.VersionName, v.VersionType.ToString(), v.Status.ToString(), v.CreatedOn, v.BudgetStrings.Count
        )).ToList();

        var stringsWithDept = allStrings.Where(s => s.Project?.Department != null).ToList();
        var byDepartment = stringsWithDept.GroupBy(s => s.Project!.Department!.Name)
            .Select(g =>
            {
                var rev = g.Where(s => revenueItemCodes.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
                var cap = g.Where(s => capitalItemCodes.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
                var total = g.Sum(s => s.Year1Amount);
                return new DepartmentBudgetDto(g.Key, rev, total - rev, cap);
            })
            .OrderByDescending(d => d.Revenue + d.Expenditure + d.Capital).ToList();

        var stringsWithoutDept = allStrings.Where(s => s.Project?.Department == null).ToList();
        if (stringsWithoutDept.Any())
        {
            var rev = stringsWithoutDept.Where(s => revenueItemCodes.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
            var cap = stringsWithoutDept.Where(s => capitalItemCodes.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
            var total = stringsWithoutDept.Sum(s => s.Year1Amount);
            byDepartment.Add(new DepartmentBudgetDto("General / Unallocated", rev, total - rev, cap));
        }

        return new CfoDashboardDto(
            totalY1, revenueY1, expenditureY1, capitalY1, operatingY1,
            0, totalY1 > 0 ? 42.5m : 0, allVersions.Count, pendingApprovals, validationErrors,
            byDepartment, byFunction, monthlyTrend, versionStatuses
        );
    }

    public async Task<BudgetOverviewDto?> GetBudgetOverviewAsync(int versionId)
    {
        var v = await _db.BudgetVersions
            .Include(v => v.BudgetStrings).ThenInclude(s => s.ScoaItem)
            .Include(v => v.BudgetStrings).ThenInclude(s => s.ScoaFund)
            .FirstOrDefaultAsync(v => v.Id == versionId);
        if (v == null) return null;

        var revenueItemCodes = new[] { "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000" };
        var capitalItemCodes = new[] { "7000", "8000" };
        var allStrings = v.BudgetStrings.ToList();

        var totalRev = allStrings.Where(s => revenueItemCodes.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
        var totalCap = allStrings.Where(s => capitalItemCodes.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
        var totalExp = allStrings.Sum(s => s.Year1Amount) - totalRev;

        var byItem = allStrings.GroupBy(s => new { s.ScoaItem.Code, s.ScoaItem.Description })
            .Select(g => new SegmentBreakdownDto(g.Key.Code, g.Key.Description, g.Sum(s => s.Year1Amount), g.Sum(s => s.Year2Amount), g.Sum(s => s.Year3Amount)))
            .OrderBy(x => x.Code).ToList();

        var byFund = allStrings.GroupBy(s => new { s.ScoaFund.Code, s.ScoaFund.Description })
            .Select(g => new SegmentBreakdownDto(g.Key.Code, g.Key.Description, g.Sum(s => s.Year1Amount), g.Sum(s => s.Year2Amount), g.Sum(s => s.Year3Amount)))
            .OrderBy(x => x.Code).ToList();

        return new BudgetOverviewDto(
            v.Id, v.VersionName, v.VersionType.ToString(), v.Status.ToString(),
            totalRev, totalExp, totalCap, totalRev - totalExp,
            allStrings.Sum(s => s.Year1Amount), allStrings.Sum(s => s.Year2Amount), allStrings.Sum(s => s.Year3Amount),
            byItem, byFund
        );
    }

    public async Task<List<MtrefSummaryDto>> GetMtrefSummaryAsync(int versionId)
    {
        var strings = await _db.BudgetStrings
            .Include(s => s.ScoaItem)
            .Where(s => s.BudgetVersionId == versionId)
            .ToListAsync();

        var revenueItemCodes = new[] { "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000" };

        return strings.GroupBy(s => new { s.ScoaItem.Code, s.ScoaItem.Description })
            .Select(g =>
            {
                var y1 = g.Sum(s => s.Year1Amount);
                var y2 = g.Sum(s => s.Year2Amount);
                var y3 = g.Sum(s => s.Year3Amount);
                var category = revenueItemCodes.Contains(g.Key.Code) ? "Revenue" : "Expenditure";
                return new MtrefSummaryDto(category, g.Key.Description, y1, y2, y3, y1 > 0 ? (y2 - y1) / y1 * 100 : 0, y2 > 0 ? (y3 - y2) / y2 * 100 : 0);
            })
            .OrderBy(m => m.Category).ThenBy(m => m.SubCategory).ToList();
    }
}
