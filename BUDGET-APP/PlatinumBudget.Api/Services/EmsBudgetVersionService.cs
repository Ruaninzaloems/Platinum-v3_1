using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class EmsBudgetVersionResultDto
{
    public string Result { get; set; } = "";
    public int BudgetVersionId { get; set; }
    public string VersionNumber { get; set; } = "";
}

public class EmsBudgetVersionSummaryDto
{
    public int BudgetVersionId { get; set; }
    public string? VersionNumber { get; set; }
    public string? VersionName { get; set; }
    public string? Comments { get; set; }
    public int CapturerID { get; set; }
    public DateTime DateCaptured { get; set; }
    public int ItemCount { get; set; }
    public decimal TotalY1 { get; set; }
    public decimal TotalY2 { get; set; }
    public decimal TotalY3 { get; set; }
}

public class EmsBudgetVersionDetailDto : EmsBudgetVersionSummaryDto
{
    public List<EmsBudgetVersionDetailRowDto> Details { get; set; } = [];
}

public class EmsBudgetVersionDetailRowDto
{
    public int BudgetVersionDetailId { get; set; }
    public int ProjectId { get; set; }
    public int? ProjectCode { get; set; }
    public string? ProjectName { get; set; }
    public string? FinYear { get; set; }
    public int PlanProjectItemId { get; set; }
    public int SCOAItemId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaItemDesc { get; set; }
    public int SCOAFundId { get; set; }
    public string? ScoaFundCode { get; set; }
    public int SCOAFunctionId { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public int CapitalOperation { get; set; }
    public decimal? BudgetAmount { get; set; }
    public decimal? BudgetAmountCurP1 { get; set; }
    public decimal? BudgetAmountCurP2 { get; set; }
}

public class EmsApprovalResultDto
{
    public int ProjectsActivated { get; set; }
    public int BudgetLinesInitialised { get; set; }
    public List<string> Errors { get; set; } = [];
}

public class EmsBudgetVersionService
{
    private readonly BudgetDbContext _db;

    public EmsBudgetVersionService(BudgetDbContext db)
    {
        _db = db;
    }

    public async Task<EmsBudgetVersionResultDto> CreateVersionAsync(
        string versionNumber, string versionName, string comments, string finYear, int userId)
    {
        if (await _db.Set<Plan_BudgetVersion>().AnyAsync(v => v.VersionNumber == versionNumber))
        {
            return new EmsBudgetVersionResultDto
            {
                Result = $"Budget Version '{versionNumber}' is already generated",
                BudgetVersionId = 0,
                VersionNumber = versionNumber
            };
        }

        var version = new Plan_BudgetVersion
        {
            VersionNumber = versionNumber,
            VersionName = versionName,
            Comments = comments,
            CapturerID = userId,
            DateCaptured = DateTime.UtcNow
        };

        _db.Set<Plan_BudgetVersion>().Add(version);
        await _db.SaveChangesAsync();

        var projectItems = await _db.Set<Plan_ProjectItem>()
            .Join(_db.Set<Plan_Project>(),
                pi => pi.ProjectID,
                p => p.Project_ID,
                (pi, p) => new { pi, p })
            .Where(x => x.p.FinYear == finYear && x.p.IsDeleted != true)
            .Select(x => new { x.pi, x.p })
            .ToListAsync();

        var details = projectItems.Select(x => new Plan_BudgetVersionDetail
        {
            BudgetVersionID = version.BudgetVersion_ID,
            ProjectID = x.p.Project_ID,
            FinYear = x.p.FinYear,
            IDPItemID = 0,
            CapitalOperation = x.p.CapitalOperation ?? 0,
            ScoaProjectID = x.p.ScoaProjectID,
            SCOACostingID = x.pi.SCOACostingID ?? 0,
            ProjectTypeID = x.p.ProjectTypeID,
            PlanProjectItemID = x.pi.PlanProjectItem_ID,
            ProjectItemID = x.pi.ProjectItemID,
            SCOAItemID = x.pi.SCOAItemID,
            SCOAFundId = x.pi.SCOAFundId ?? 0,
            BudgetAmount = x.pi.BudgetAmount ?? 0,
            BudgetAmountCurP1 = x.pi.BudgetAmountCurP1 ?? 0,
            BudgetAmountCurP2 = x.pi.BudgetAmountCurP2 ?? 0,
            SCOAFunctionId = x.pi.SCOAFunctionId ?? 0,
            SCOARegionId = x.pi.SCOARegionId ?? 0,
            DivisionId = x.pi.DivisionId ?? 0,
            CapturerID = userId,
            DateCaptured = DateTime.UtcNow,
            CostingProject = x.p.CostingProject
        }).ToList();

        _db.Set<Plan_BudgetVersionDetail>().AddRange(details);

        var monthData = await _db.Set<Plan_ProjectItemMonth>()
            .Join(_db.Set<Plan_ProjectItem>(),
                m => m.PlanProjectItemID,
                pi => pi.PlanProjectItem_ID,
                (m, pi) => new { m, pi })
            .Join(_db.Set<Plan_Project>(),
                x => x.pi.ProjectID,
                p => p.Project_ID,
                (x, p) => new { x.m, x.pi, p })
            .Where(x => x.p.FinYear == finYear && x.p.IsDeleted != true)
            .Select(x => x.m)
            .ToListAsync();

        var months = monthData.Select(m => new Plan_BudgetVersionMonths
        {
            BudgetVersionID = version.BudgetVersion_ID,
            ProjectItemMonth_ID = m.ProjectItemMonth_ID,
            PlanProjectItemID = m.PlanProjectItemID,
            MonthID = m.MonthID,
            UnitQuantity = m.UnitQuantity,
            UnitPrice = m.UnitPrice,
            CaptureID = userId,
            DateCaptured = DateTime.UtcNow,
            VirementId = m.VirementId,
            AdjustmentId = m.AdjustmentId
        }).ToList();

        _db.Set<Plan_BudgetVersionMonths>().AddRange(months);
        await _db.SaveChangesAsync();

        return new EmsBudgetVersionResultDto
        {
            Result = "success",
            BudgetVersionId = version.BudgetVersion_ID,
            VersionNumber = versionNumber
        };
    }

    public async Task<List<EmsBudgetVersionSummaryDto>> GetVersionsAsync(string? finYear)
    {
        var details = await _db.Set<Plan_BudgetVersionDetail>().ToListAsync();
        var versions = await _db.Set<Plan_BudgetVersion>().ToListAsync();

        if (!string.IsNullOrEmpty(finYear))
        {
            var matchingDetailVersionIds = details.Where(d => d.FinYear == finYear).Select(d => d.BudgetVersionID).Distinct().ToHashSet();
            versions = versions.Where(v => matchingDetailVersionIds.Contains(v.BudgetVersion_ID)).ToList();
        }

        return versions.Select(v =>
        {
            var vDetails = details.Where(d => d.BudgetVersionID == v.BudgetVersion_ID).ToList();
            return new EmsBudgetVersionSummaryDto
            {
                BudgetVersionId = v.BudgetVersion_ID,
                VersionNumber = v.VersionNumber,
                VersionName = v.VersionName,
                Comments = v.Comments,
                CapturerID = v.CapturerID,
                DateCaptured = v.DateCaptured,
                ItemCount = vDetails.Count,
                TotalY1 = vDetails.Sum(d => d.BudgetAmount ?? 0),
                TotalY2 = vDetails.Sum(d => d.BudgetAmountCurP1 ?? 0),
                TotalY3 = vDetails.Sum(d => d.BudgetAmountCurP2 ?? 0)
            };
        }).OrderByDescending(v => v.DateCaptured).ToList();
    }

    public async Task<EmsBudgetVersionDetailDto?> GetVersionDetailAsync(int versionId)
    {
        var version = await _db.Set<Plan_BudgetVersion>().FindAsync(versionId);
        if (version == null) return null;

        var details = await _db.Set<Plan_BudgetVersionDetail>()
            .Where(d => d.BudgetVersionID == versionId)
            .ToListAsync();

        var projectIds = details.Select(d => d.ProjectID).Distinct().ToList();
        var projects = await _db.Set<Plan_Project>()
            .Where(p => projectIds.Contains(p.Project_ID))
            .ToDictionaryAsync(p => p.Project_ID);

        var scoaItemIds = details.Select(d => d.SCOAItemID).Distinct().ToList();
        var scoaFundIds = details.Select(d => d.SCOAFundId).Distinct().ToList();
        var scoaFunctionIds = details.Select(d => d.SCOAFunctionId).Distinct().ToList();

        var scoaItems = await _db.ScoaItems.Where(s => scoaItemIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
        var scoaFunds = await _db.ScoaFunds.Where(s => scoaFundIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
        var scoaFunctions = await _db.ScoaFunctions.Where(s => scoaFunctionIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);

        var rows = details.Select(d =>
        {
            projects.TryGetValue(d.ProjectID, out var proj);
            scoaItems.TryGetValue(d.SCOAItemID, out var si);
            scoaFunds.TryGetValue(d.SCOAFundId, out var sf);
            scoaFunctions.TryGetValue(d.SCOAFunctionId, out var sfn);
            return new EmsBudgetVersionDetailRowDto
            {
                BudgetVersionDetailId = d.BudgetVersionDetail_ID,
                ProjectId = d.ProjectID,
                ProjectCode = proj?.ProjectCode,
                ProjectName = proj?.ProjectName,
                FinYear = d.FinYear,
                PlanProjectItemId = d.PlanProjectItemID,
                SCOAItemId = d.SCOAItemID,
                ScoaItemCode = si?.Code,
                ScoaItemDesc = si?.Description,
                SCOAFundId = d.SCOAFundId,
                ScoaFundCode = sf?.Code,
                SCOAFunctionId = d.SCOAFunctionId,
                ScoaFunctionCode = sfn?.Code,
                CapitalOperation = d.CapitalOperation,
                BudgetAmount = d.BudgetAmount,
                BudgetAmountCurP1 = d.BudgetAmountCurP1,
                BudgetAmountCurP2 = d.BudgetAmountCurP2
            };
        }).ToList();

        return new EmsBudgetVersionDetailDto
        {
            BudgetVersionId = version.BudgetVersion_ID,
            VersionNumber = version.VersionNumber,
            VersionName = version.VersionName,
            Comments = version.Comments,
            CapturerID = version.CapturerID,
            DateCaptured = version.DateCaptured,
            ItemCount = rows.Count,
            TotalY1 = rows.Sum(r => r.BudgetAmount ?? 0),
            TotalY2 = rows.Sum(r => r.BudgetAmountCurP1 ?? 0),
            TotalY3 = rows.Sum(r => r.BudgetAmountCurP2 ?? 0),
            Details = rows
        };
    }

    public async Task<EmsApprovalResultDto> InitiateBudgetApprovalAsync(string finYear, int userId)
    {
        var result = new EmsApprovalResultDto();

        var projects = await _db.Set<Plan_Project>()
            .Where(p => p.FinYear == finYear && p.ProjectStatus == 23 && p.IsDeleted != true)
            .ToListAsync();

        foreach (var project in projects)
        {
            try
            {
                project.ProjectStatus = 24;
                project.DateModified = DateTime.UtcNow;
                project.ModifierID = userId;

                var projectItems = await _db.Set<Plan_ProjectItem>()
                    .Where(pi => pi.ProjectID == project.Project_ID)
                    .ToListAsync();

                foreach (var ppi in projectItems)
                {
                    var budgetAmount = ppi.BudgetAmount ?? 0;
                    var multiYear = (ppi.BudgetAmountCurP1 ?? 0) + (ppi.BudgetAmountCurP2 ?? 0);

                    var hasRegister = await _db.Set<Plan_BudgetRegister>()
                        .AnyAsync(br => br.PlanProjectItemID == ppi.PlanProjectItem_ID
                                     && br.FinYear == finYear
                                     && br.BudgetTransactionTypeID == 1);

                    if (!hasRegister)
                    {
                        _db.Set<Plan_BudgetRegister>().Add(new Plan_BudgetRegister
                        {
                            PlanProjectItemID = ppi.PlanProjectItem_ID,
                            BudgetTransactionTypeID = 1,
                            ModuleID = 10,
                            PK_TransactionID = ppi.PlanProjectItem_ID,
                            TransactionTableName = "Plan_ProjectItem",
                            TransactionAmount = budgetAmount,
                            AvailableBudget = budgetAmount,
                            CapturerID = userId,
                            DateCaptured = DateTime.UtcNow,
                            FinYear = finYear
                        });
                    }

                    var hasConsumption = await _db.Set<Plan_BudgetConsumption>()
                        .AnyAsync(bc => bc.PlanProjectItemID == ppi.PlanProjectItem_ID
                                     && bc.FinYear == finYear
                                     && bc.BudgetTransactionTypeID == 1);

                    if (!hasConsumption)
                    {
                        _db.Set<Plan_BudgetConsumption>().Add(new Plan_BudgetConsumption
                        {
                            FinYear = finYear,
                            PlanProjectItemID = ppi.PlanProjectItem_ID,
                            BudgetTransactionTypeID = 1,
                            ModuleID = 10,
                            PK_TransactionID = ppi.PlanProjectItem_ID,
                            TransactionTableName = "Plan_ProjectItem",
                            ConsumingTransactionAmount = budgetAmount,
                            ConsumingTransactionAmountMultiyear = multiYear,
                            AdjustedTansactionAmount = budgetAmount,
                            AvailableBudget = budgetAmount,
                            AvailableBudgetMultiyear = multiYear,
                            ProcessingMonth = 1,
                            BudgetConsumptionProcessID = 200,
                            OriginalBudgetToDate = budgetAmount,
                            AdjustedBudgetToDate = budgetAmount,
                            CapturedExpenditureToDate = 0,
                            ReserveToDate = 0,
                            CommitToDate = 0,
                            ActualToDate = 0,
                            CurrentlyConsumedAmount = 0,
                            InitialLine = "Plan_ProjectItem",
                            CapturerID = userId,
                            DateCaptured = DateTime.UtcNow
                        });
                        result.BudgetLinesInitialised++;
                    }
                }
                result.ProjectsActivated++;
            }
            catch (Exception ex)
            {
                result.Errors.Add($"Project {project.Project_ID}: {ex.Message}");
            }
        }

        await _db.SaveChangesAsync();
        return result;
    }
}
