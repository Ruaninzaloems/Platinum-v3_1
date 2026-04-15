using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class EmsConsumptionInsertRequest
{
    public string FinYear { get; set; } = "";
    public int PlanProjectItemId { get; set; }
    public int TransactionTypeId { get; set; } = 1;
    public int ModuleId { get; set; } = 10;
    public int ProcessId { get; set; }
    public int TransactionId { get; set; }
    public string TransactionTable { get; set; } = "";
    public int CapturerId { get; set; } = 1;
    public decimal TransactionAmount { get; set; }
    public decimal AvailableBudgetDiff { get; set; }
    public decimal ReserveToDateDiff { get; set; }
    public decimal CapturedExpenditureToDateDiff { get; set; }
    public decimal CommitToDateDiff { get; set; }
    public string? InitialLine { get; set; }
    public decimal CurrentlyConsumedAmount { get; set; }
    public int? ProcessingMonth { get; set; }
}

public class EmsConsumptionBalanceDto
{
    public int PlanProjectItemId { get; set; }
    public string? FinYear { get; set; }
    public decimal OriginalBudget { get; set; }
    public decimal AdjustedBudget { get; set; }
    public decimal AvailableBudget { get; set; }
    public decimal ReserveToDate { get; set; }
    public decimal CommitToDate { get; set; }
    public decimal ActualToDate { get; set; }
    public decimal CapturedExpenditureToDate { get; set; }
    public int? ProcessingMonth { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class EmsConsumptionReportRowDto
{
    public int PlanProjectItemId { get; set; }
    public int ProjectId { get; set; }
    public int? ProjectCode { get; set; }
    public string ProjectName { get; set; } = "";
    public string? FinYear { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaItemDesc { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string? CreditDebit { get; set; }
    public decimal OriginalBudget { get; set; }
    public decimal Adjustments { get; set; }
    public decimal Virements { get; set; }
    public decimal CurrentBudget { get; set; }
    public decimal Reserved { get; set; }
    public decimal Committed { get; set; }
    public decimal Actual { get; set; }
    public decimal Available { get; set; }
    public double AvailablePct { get; set; }
}

public class EmsBudgetConsumptionService
{
    private readonly BudgetDbContext _db;

    public EmsBudgetConsumptionService(BudgetDbContext db)
    {
        _db = db;
    }

    public async Task<Plan_BudgetConsumption> InsertConsumptionAsync(EmsConsumptionInsertRequest req)
    {
        var last = await _db.Set<Plan_BudgetConsumption>()
            .Where(bc => bc.PlanProjectItemID == req.PlanProjectItemId && bc.FinYear == req.FinYear)
            .OrderByDescending(bc => bc.BudgetConsumption_ID)
            .FirstOrDefaultAsync();

        var newRow = new Plan_BudgetConsumption
        {
            FinYear = req.FinYear,
            PlanProjectItemID = req.PlanProjectItemId,
            BudgetTransactionTypeID = req.TransactionTypeId,
            ModuleID = req.ModuleId,
            PK_TransactionID = req.TransactionId,
            TransactionTableName = req.TransactionTable,
            ConsumingTransactionAmount = req.TransactionAmount,
            AdjustedTansactionAmount = 0,
            AvailableBudget = (last?.AvailableBudget ?? 0) + req.AvailableBudgetDiff,
            ProcessingMonth = req.ProcessingMonth ?? last?.ProcessingMonth ?? 1,
            BudgetConsumptionProcessID = req.ProcessId,
            OriginalBudgetToDate = last?.OriginalBudgetToDate ?? 0,
            AdjustedBudgetToDate = last?.AdjustedBudgetToDate ?? 0,
            CapturedExpenditureToDate = (last?.CapturedExpenditureToDate ?? 0) + req.CapturedExpenditureToDateDiff,
            ReserveToDate = (last?.ReserveToDate ?? 0) + req.ReserveToDateDiff,
            CommitToDate = (last?.CommitToDate ?? 0) + req.CommitToDateDiff,
            ActualToDate = last?.ActualToDate ?? 0,
            CurrentlyConsumedAmount = req.CurrentlyConsumedAmount,
            InitialLine = req.InitialLine ?? $"{req.TransactionTable}_{req.TransactionId}",
            CapturerID = req.CapturerId,
            DateCaptured = DateTime.UtcNow
        };

        _db.Set<Plan_BudgetConsumption>().Add(newRow);
        await _db.SaveChangesAsync();
        return newRow;
    }

    public async Task<EmsConsumptionBalanceDto?> GetCurrentBalanceAsync(int planProjectItemId, string finYear)
    {
        var last = await _db.Set<Plan_BudgetConsumption>()
            .Where(bc => bc.PlanProjectItemID == planProjectItemId && bc.FinYear == finYear)
            .OrderByDescending(bc => bc.BudgetConsumption_ID)
            .FirstOrDefaultAsync();

        if (last == null) return null;

        return new EmsConsumptionBalanceDto
        {
            PlanProjectItemId = planProjectItemId,
            FinYear = finYear,
            OriginalBudget = last.OriginalBudgetToDate ?? 0,
            AdjustedBudget = last.AdjustedBudgetToDate ?? 0,
            AvailableBudget = last.AvailableBudget ?? 0,
            ReserveToDate = last.ReserveToDate ?? 0,
            CommitToDate = last.CommitToDate ?? 0,
            ActualToDate = last.ActualToDate ?? 0,
            CapturedExpenditureToDate = last.CapturedExpenditureToDate ?? 0,
            ProcessingMonth = last.ProcessingMonth,
            LastUpdated = last.DateCaptured
        };
    }

    public async Task<List<Plan_BudgetConsumption>> GetConsumptionHistoryAsync(int planProjectItemId, string finYear)
    {
        return await _db.Set<Plan_BudgetConsumption>()
            .Where(bc => bc.PlanProjectItemID == planProjectItemId && bc.FinYear == finYear)
            .OrderBy(bc => bc.BudgetConsumption_ID)
            .ToListAsync();
    }

    public async Task<List<EmsConsumptionReportRowDto>> GetBudgetConsumptionReportAsync(string finYear, int? divisionId, int? projectId)
    {
        var itemsQuery = _db.Set<Plan_ProjectItem>().Where(pi => pi.FinYear == finYear);
        if (divisionId.HasValue) itemsQuery = itemsQuery.Where(pi => pi.DivisionId == divisionId.Value);
        if (projectId.HasValue) itemsQuery = itemsQuery.Where(pi => pi.ProjectID == projectId.Value);

        var items = await itemsQuery.ToListAsync();
        if (!items.Any()) return [];

        var planProjectItemIds = items.Select(i => i.PlanProjectItem_ID).ToList();
        var projectIds = items.Select(i => i.ProjectID).Distinct().ToList();

        var projects = await _db.Set<Plan_Project>()
            .Where(p => projectIds.Contains(p.Project_ID) && p.IsDeleted != true)
            .ToDictionaryAsync(p => p.Project_ID);

        var scoaItemIds = items.Select(i => i.SCOAItemID).Distinct().ToList();
        var scoaFundIds = items.Where(i => i.SCOAFundId.HasValue).Select(i => i.SCOAFundId!.Value).Distinct().ToList();
        var scoaFunctionIds = items.Where(i => i.SCOAFunctionId.HasValue).Select(i => i.SCOAFunctionId!.Value).Distinct().ToList();

        var scoaItems = await _db.ScoaItems.Where(s => scoaItemIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
        var scoaFunds = await _db.ScoaFunds.Where(s => scoaFundIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
        var scoaFunctions = await _db.ScoaFunctions.Where(s => scoaFunctionIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);

        var lastConsumptions = await _db.Set<Plan_BudgetConsumption>()
            .Where(bc => planProjectItemIds.Contains(bc.PlanProjectItemID!.Value) && bc.FinYear == finYear)
            .GroupBy(bc => bc.PlanProjectItemID)
            .Select(g => g.OrderByDescending(bc => bc.BudgetConsumption_ID).First())
            .ToListAsync();

        var consumptionByItemId = lastConsumptions.ToDictionary(bc => bc.PlanProjectItemID!.Value);

        var adjustmentsByItemId = await _db.Set<Plan_BudgetConsumption>()
            .Where(bc => planProjectItemIds.Contains(bc.PlanProjectItemID!.Value) && bc.FinYear == finYear && bc.BudgetConsumptionProcessID == 202)
            .GroupBy(bc => bc.PlanProjectItemID!.Value)
            .Select(g => new { ItemId = g.Key, Total = g.Sum(bc => bc.ConsumingTransactionAmount ?? 0) })
            .ToDictionaryAsync(x => x.ItemId, x => x.Total);

        var virementsByItemId = await _db.Set<Plan_BudgetConsumption>()
            .Where(bc => planProjectItemIds.Contains(bc.PlanProjectItemID!.Value) && bc.FinYear == finYear && bc.BudgetConsumptionProcessID == 201)
            .GroupBy(bc => bc.PlanProjectItemID!.Value)
            .Select(g => new { ItemId = g.Key, Total = g.Sum(bc => bc.ConsumingTransactionAmount ?? 0) })
            .ToDictionaryAsync(x => x.ItemId, x => x.Total);

        var result = new List<EmsConsumptionReportRowDto>();

        foreach (var pi in items)
        {
            if (!projects.TryGetValue(pi.ProjectID, out var proj)) continue;
            consumptionByItemId.TryGetValue(pi.PlanProjectItem_ID, out var bc);
            adjustmentsByItemId.TryGetValue(pi.PlanProjectItem_ID, out var adj);
            virementsByItemId.TryGetValue(pi.PlanProjectItem_ID, out var vir);
            scoaItems.TryGetValue(pi.SCOAItemID, out var scoaItem);
            var scoaFund = pi.SCOAFundId.HasValue ? (scoaFunds.TryGetValue(pi.SCOAFundId.Value, out var sf) ? sf : null) : null;
            var scoaFunction = pi.SCOAFunctionId.HasValue ? (scoaFunctions.TryGetValue(pi.SCOAFunctionId.Value, out var sfn) ? sfn : null) : null;

            var currentBudget = pi.BudgetAmount ?? 0;
            var available = bc?.AvailableBudget ?? currentBudget;
            var originalBudget = bc?.OriginalBudgetToDate ?? currentBudget;

            result.Add(new EmsConsumptionReportRowDto
            {
                PlanProjectItemId = pi.PlanProjectItem_ID,
                ProjectId = pi.ProjectID,
                ProjectCode = proj.ProjectCode,
                ProjectName = proj.ProjectName ?? "",
                FinYear = pi.FinYear,
                ScoaItemCode = scoaItem?.Code,
                ScoaItemDesc = scoaItem?.Description,
                ScoaFundCode = scoaFund?.Code,
                ScoaFunctionCode = scoaFunction?.Code,
                CreditDebit = pi.CreditDebit,
                OriginalBudget = originalBudget,
                Adjustments = adj,
                Virements = vir,
                CurrentBudget = currentBudget,
                Reserved = bc?.ReserveToDate ?? 0,
                Committed = bc?.CommitToDate ?? 0,
                Actual = bc?.ActualToDate ?? 0,
                Available = available,
                AvailablePct = originalBudget != 0 ? Math.Round((double)(available / originalBudget) * 100, 1) : 0
            });
        }

        return result.OrderBy(r => r.ProjectCode).ThenBy(r => r.ScoaItemCode).ToList();
    }
}
