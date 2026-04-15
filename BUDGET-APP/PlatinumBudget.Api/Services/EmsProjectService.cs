using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class EmsProjectSummaryDto
{
    public int ProjectId { get; set; }
    public int? ProjectCode { get; set; }
    public string ProjectName { get; set; } = "";
    public string? ProjectDesc { get; set; }
    public string? FinYear { get; set; }
    public int ProjectStatus { get; set; }
    public string ProjectStatusLabel { get; set; } = "";
    public int? CapitalOperation { get; set; }
    public string CapitalOperationLabel { get; set; } = "";
    public decimal CostEstimate { get; set; }
    public int ItemCount { get; set; }
    public decimal TotalY1 { get; set; }
    public decimal TotalY2 { get; set; }
    public decimal TotalY3 { get; set; }
    public DateTime DateCaptured { get; set; }
}

public class EmsProjectItemDto
{
    public int PlanProjectItemId { get; set; }
    public int ProjectId { get; set; }
    public string? FinYear { get; set; }
    public int SCOAItemID { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaItemDesc { get; set; }
    public int? SCOAFundId { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFundDesc { get; set; }
    public int? SCOAFunctionId { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string? ScoaFunctionDesc { get; set; }
    public int? SCOARegionId { get; set; }
    public string? ScoaRegionCode { get; set; }
    public int? SCOACostingID { get; set; }
    public string? ScoaCostingCode { get; set; }
    public int? DivisionId { get; set; }
    public decimal? BudgetAmount { get; set; }
    public decimal? BudgetAmountCurP1 { get; set; }
    public decimal? BudgetAmountCurP2 { get; set; }
    public string? CreditDebit { get; set; }
}

public class EmsProjectDetailDto : EmsProjectSummaryDto
{
    public List<EmsProjectItemDto> Items { get; set; } = [];
}

public class EmsAvailableBudgetDto
{
    public int PlanProjectItemId { get; set; }
    public decimal OriginalBudget { get; set; }
    public decimal Adjustments { get; set; }
    public decimal TotalVirementAmount { get; set; }
    public decimal CurrentBudget { get; set; }
    public decimal Reserved { get; set; }
    public decimal Commitment { get; set; }
    public decimal Actual { get; set; }
    public decimal AvailableBudget { get; set; }
}

public class EmsProjectService
{
    private readonly BudgetDbContext _db;

    public EmsProjectService(BudgetDbContext db)
    {
        _db = db;
    }

    private static string GetStatusLabel(int status) => status switch
    {
        1 => "Draft",
        10 => "In Progress",
        20 => "Submitted",
        21 => "Returned",
        22 => "Rejected",
        23 => "Approved",
        24 => "Activated",
        25 => "Completed",
        _ => $"Status {status}"
    };

    private static string GetCapOpLabel(int? capOp) => capOp switch
    {
        1 => "Capital",
        2 => "Operating",
        3 => "Revenue",
        _ => "Unknown"
    };

    public async Task<List<EmsProjectSummaryDto>> GetProjectsAsync(string? finYear, int? divisionId, int? status)
    {
        var query = _db.Set<Plan_ProjectItem>()
            .Join(_db.Set<Plan_Project>(),
                pi => pi.ProjectID,
                p => p.Project_ID,
                (pi, p) => new { pi, p })
            .Where(x => x.p.IsDeleted != true);

        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(x => x.p.FinYear == finYear);
        if (status.HasValue)
            query = query.Where(x => x.p.ProjectStatus == status.Value);
        if (divisionId.HasValue)
            query = query.Where(x => x.pi.DivisionId == divisionId.Value);

        var raw = await query
            .Select(x => new
            {
                x.p.Project_ID,
                x.p.ProjectCode,
                x.p.ProjectName,
                x.p.ProjectDesc,
                x.p.FinYear,
                x.p.ProjectStatus,
                x.p.CapitalOperation,
                x.p.CostEstimate,
                x.p.DateCaptured,
                x.pi.BudgetAmount,
                x.pi.BudgetAmountCurP1,
                x.pi.BudgetAmountCurP2
            })
            .ToListAsync();

        return raw
            .GroupBy(x => new { x.Project_ID, x.ProjectCode, x.ProjectName, x.ProjectDesc, x.FinYear, x.ProjectStatus, x.CapitalOperation, x.CostEstimate, x.DateCaptured })
            .Select(g => new EmsProjectSummaryDto
            {
                ProjectId = g.Key.Project_ID,
                ProjectCode = g.Key.ProjectCode,
                ProjectName = g.Key.ProjectName ?? "",
                ProjectDesc = g.Key.ProjectDesc,
                FinYear = g.Key.FinYear,
                ProjectStatus = g.Key.ProjectStatus,
                ProjectStatusLabel = GetStatusLabel(g.Key.ProjectStatus),
                CapitalOperation = g.Key.CapitalOperation,
                CapitalOperationLabel = GetCapOpLabel(g.Key.CapitalOperation),
                CostEstimate = g.Key.CostEstimate,
                ItemCount = g.Count(),
                TotalY1 = g.Sum(x => x.BudgetAmount ?? 0),
                TotalY2 = g.Sum(x => x.BudgetAmountCurP1 ?? 0),
                TotalY3 = g.Sum(x => x.BudgetAmountCurP2 ?? 0),
                DateCaptured = g.Key.DateCaptured
            })
            .OrderBy(p => p.ProjectCode)
            .ToList();
    }

    public async Task<EmsProjectDetailDto?> GetProjectDetailAsync(int projectId)
    {
        var project = await _db.Set<Plan_Project>()
            .FirstOrDefaultAsync(p => p.Project_ID == projectId && p.IsDeleted != true);

        if (project == null) return null;

        var items = await _db.Set<Plan_ProjectItem>()
            .Where(pi => pi.ProjectID == projectId)
            .ToListAsync();

        var scoaItemIds = items.Select(i => i.SCOAItemID).Distinct().ToList();
        var scoaFundIds = items.Where(i => i.SCOAFundId.HasValue).Select(i => i.SCOAFundId!.Value).Distinct().ToList();
        var scoaFunctionIds = items.Where(i => i.SCOAFunctionId.HasValue).Select(i => i.SCOAFunctionId!.Value).Distinct().ToList();
        var scoaRegionIds = items.Where(i => i.SCOARegionId.HasValue).Select(i => i.SCOARegionId!.Value).Distinct().ToList();
        var scoaCostingIds = items.Where(i => i.SCOACostingID.HasValue).Select(i => i.SCOACostingID!.Value).Distinct().ToList();

        var scoaItems = await _db.ScoaItems.Where(s => scoaItemIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
        var scoaFunds = await _db.ScoaFunds.Where(s => scoaFundIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
        var scoaFunctions = await _db.ScoaFunctions.Where(s => scoaFunctionIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
        var scoaRegions = await _db.ScoaRegions.Where(s => scoaRegionIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
        var scoaCostings = await _db.ScoaCostings.Where(s => scoaCostingIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);

        var itemDtos = items.Select(pi => new EmsProjectItemDto
        {
            PlanProjectItemId = pi.PlanProjectItem_ID,
            ProjectId = pi.ProjectID,
            FinYear = pi.FinYear,
            SCOAItemID = pi.SCOAItemID,
            ScoaItemCode = scoaItems.TryGetValue(pi.SCOAItemID, out var si) ? si.Code : null,
            ScoaItemDesc = si?.Description,
            SCOAFundId = pi.SCOAFundId,
            ScoaFundCode = pi.SCOAFundId.HasValue && scoaFunds.TryGetValue(pi.SCOAFundId.Value, out var sf) ? sf.Code : null,
            ScoaFundDesc = pi.SCOAFundId.HasValue && scoaFunds.TryGetValue(pi.SCOAFundId.Value, out var sf2) ? sf2.Description : null,
            SCOAFunctionId = pi.SCOAFunctionId,
            ScoaFunctionCode = pi.SCOAFunctionId.HasValue && scoaFunctions.TryGetValue(pi.SCOAFunctionId.Value, out var sfn) ? sfn.Code : null,
            ScoaFunctionDesc = pi.SCOAFunctionId.HasValue && scoaFunctions.TryGetValue(pi.SCOAFunctionId.Value, out var sfn2) ? sfn2.Description : null,
            SCOARegionId = pi.SCOARegionId,
            ScoaRegionCode = pi.SCOARegionId.HasValue && scoaRegions.TryGetValue(pi.SCOARegionId.Value, out var sr) ? sr.Code : null,
            SCOACostingID = pi.SCOACostingID,
            ScoaCostingCode = pi.SCOACostingID.HasValue && scoaCostings.TryGetValue(pi.SCOACostingID.Value, out var sc) ? sc.Code : null,
            DivisionId = pi.DivisionId,
            BudgetAmount = pi.BudgetAmount,
            BudgetAmountCurP1 = pi.BudgetAmountCurP1,
            BudgetAmountCurP2 = pi.BudgetAmountCurP2,
            CreditDebit = pi.CreditDebit
        }).ToList();

        return new EmsProjectDetailDto
        {
            ProjectId = project.Project_ID,
            ProjectCode = project.ProjectCode,
            ProjectName = project.ProjectName ?? "",
            ProjectDesc = project.ProjectDesc,
            FinYear = project.FinYear,
            ProjectStatus = project.ProjectStatus,
            ProjectStatusLabel = GetStatusLabel(project.ProjectStatus),
            CapitalOperation = project.CapitalOperation,
            CapitalOperationLabel = GetCapOpLabel(project.CapitalOperation),
            CostEstimate = project.CostEstimate,
            DateCaptured = project.DateCaptured,
            ItemCount = itemDtos.Count,
            TotalY1 = itemDtos.Sum(i => i.BudgetAmount ?? 0),
            TotalY2 = itemDtos.Sum(i => i.BudgetAmountCurP1 ?? 0),
            TotalY3 = itemDtos.Sum(i => i.BudgetAmountCurP2 ?? 0),
            Items = itemDtos
        };
    }

    public async Task<Plan_Project> CreateProjectAsync(Plan_Project project)
    {
        project.DateCaptured = DateTime.UtcNow;
        _db.Set<Plan_Project>().Add(project);
        await _db.SaveChangesAsync();
        return project;
    }

    public async Task<Plan_Project?> UpdateProjectAsync(int id, Plan_Project update)
    {
        var existing = await _db.Set<Plan_Project>().FindAsync(id);
        if (existing == null) return null;
        existing.ProjectName = update.ProjectName;
        existing.ProjectDesc = update.ProjectDesc;
        existing.ProjectDetailDesc = update.ProjectDetailDesc;
        existing.ProjectStatus = update.ProjectStatus;
        existing.CapitalOperation = update.CapitalOperation;
        existing.CostEstimate = update.CostEstimate;
        existing.ScoaProjectID = update.ScoaProjectID;
        existing.ProjectTypeID = update.ProjectTypeID;
        existing.EstimatedStartDate = update.EstimatedStartDate;
        existing.EstimatedEndDate = update.EstimatedEndDate;
        existing.ProjectCode = update.ProjectCode;
        existing.FinYear = update.FinYear;
        existing.DateModified = DateTime.UtcNow;
        existing.ModifierID = update.ModifierID;
        await _db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteProjectAsync(int id)
    {
        var project = await _db.Set<Plan_Project>().FindAsync(id);
        if (project == null) return false;
        project.IsDeleted = true;
        project.DateModified = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<EmsProjectItemDto>> GetProjectItemsAsync(int projectId)
    {
        var detail = await GetProjectDetailAsync(projectId);
        return detail?.Items ?? [];
    }

    public async Task<Plan_ProjectItem> AddProjectItemAsync(Plan_ProjectItem item)
    {
        item.DateCaptured = DateTime.UtcNow;
        _db.Set<Plan_ProjectItem>().Add(item);
        await _db.SaveChangesAsync();
        return item;
    }

    public async Task<Plan_ProjectItem?> UpdateProjectItemAsync(int id, Plan_ProjectItem update)
    {
        var existing = await _db.Set<Plan_ProjectItem>().FindAsync(id);
        if (existing == null) return null;
        existing.SCOAItemID = update.SCOAItemID;
        existing.SCOAFundId = update.SCOAFundId;
        existing.SCOAFunctionId = update.SCOAFunctionId;
        existing.SCOARegionId = update.SCOARegionId;
        existing.SCOACostingID = update.SCOACostingID;
        existing.DivisionId = update.DivisionId;
        existing.BudgetAmount = update.BudgetAmount;
        existing.BudgetAmountCurP1 = update.BudgetAmountCurP1;
        existing.BudgetAmountCurP2 = update.BudgetAmountCurP2;
        existing.CreditDebit = update.CreditDebit;
        existing.DateModified = DateTime.UtcNow;
        existing.ModifierID = update.ModifierID;
        await _db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteProjectItemAsync(int id)
    {
        var item = await _db.Set<Plan_ProjectItem>().FindAsync(id);
        if (item == null) return false;
        _db.Set<Plan_ProjectItem>().Remove(item);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<EmsAvailableBudgetDto> GetAvailableBudgetSummaryAsync(int planProjectItemId)
    {
        var ppi = await _db.Set<Plan_ProjectItem>().FindAsync(planProjectItemId);
        var lastConsumption = await _db.Set<Plan_BudgetConsumption>()
            .Where(bc => bc.PlanProjectItemID == planProjectItemId)
            .OrderByDescending(bc => bc.BudgetConsumption_ID)
            .FirstOrDefaultAsync();

        var adjustments = await _db.Set<Plan_BudgetConsumption>()
            .Where(bc => bc.PlanProjectItemID == planProjectItemId && bc.BudgetConsumptionProcessID == 202)
            .SumAsync(bc => bc.ConsumingTransactionAmount ?? 0);

        var virements = await _db.Set<Plan_BudgetConsumption>()
            .Where(bc => bc.PlanProjectItemID == planProjectItemId && bc.BudgetConsumptionProcessID == 201)
            .SumAsync(bc => bc.ConsumingTransactionAmount ?? 0);

        return new EmsAvailableBudgetDto
        {
            PlanProjectItemId = planProjectItemId,
            OriginalBudget = lastConsumption?.OriginalBudgetToDate ?? ppi?.BudgetAmount ?? 0,
            Adjustments = adjustments,
            TotalVirementAmount = virements,
            CurrentBudget = ppi?.BudgetAmount ?? 0,
            Reserved = lastConsumption?.ReserveToDate ?? 0,
            Commitment = lastConsumption?.CommitToDate ?? 0,
            Actual = lastConsumption?.ActualToDate ?? 0,
            AvailableBudget = lastConsumption?.AvailableBudget ?? ppi?.BudgetAmount ?? 0
        };
    }
}
