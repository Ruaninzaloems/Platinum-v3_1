using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class ExpenditureProjectionService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    private static readonly Dictionary<ExpenditureCategoryType, string> CategoryToScoaItem = new()
    {
        { ExpenditureCategoryType.EmployeeCosts, "2100" },
        { ExpenditureCategoryType.BulkPurchases, "2200" },
        { ExpenditureCategoryType.ContractedServices, "2300" },
        { ExpenditureCategoryType.GeneralExpenses, "2400" },
        { ExpenditureCategoryType.RepairsAndMaintenance, "2500" },
        { ExpenditureCategoryType.OtherExpenditure, "2600" }
    };

    private static readonly Dictionary<ExpenditureCategoryType, string> CategoryToFunction = new()
    {
        { ExpenditureCategoryType.EmployeeCosts, "GOV" },
        { ExpenditureCategoryType.BulkPurchases, "ELEC" },
        { ExpenditureCategoryType.ContractedServices, "GOV" },
        { ExpenditureCategoryType.GeneralExpenses, "GOV" },
        { ExpenditureCategoryType.RepairsAndMaintenance, "INFRA" },
        { ExpenditureCategoryType.OtherExpenditure, "GOV" }
    };

    private static readonly decimal[] EmployeeSeasonality = { 0.083m, 0.083m, 0.083m, 0.083m, 0.083m, 0.083m, 0.083m, 0.083m, 0.083m, 0.083m, 0.083m, 0.087m };
    private static readonly decimal[] ContractedSeasonality = { 0.07m, 0.08m, 0.08m, 0.09m, 0.09m, 0.09m, 0.08m, 0.08m, 0.09m, 0.09m, 0.08m, 0.08m };

    public ExpenditureProjectionService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<ExpenditureProjection>> CalculateProjections(int financialYearId, int? expenditureScenarioId, decimal growthY2, decimal growthY3)
    {
        var existing = await _db.ExpenditureProjections
            .Where(p => p.FinancialYearId == financialYearId)
            .ToListAsync();
        _db.ExpenditureProjections.RemoveRange(existing);

        var costItems = await _db.CostItems
            .Include(ci => ci.ExpenditureCategory)
            .Where(ci => ci.FinancialYearId == financialYearId && ci.IsApproved)
            .ToListAsync();

        ExpenditureScenario? scenario = null;
        List<ExpenditureScenarioLine> scenarioLines = new();
        if (expenditureScenarioId.HasValue)
        {
            scenario = await _db.ExpenditureScenarios.Include(s => s.Lines).FirstOrDefaultAsync(s => s.Id == expenditureScenarioId);
            scenarioLines = scenario?.Lines.ToList() ?? new();
        }

        var assumptions = await _db.ForecastAssumptions
            .Where(a => a.FinancialYearId == financialYearId && a.IsActive)
            .ToListAsync();
        var cpiAssumption = assumptions.FirstOrDefault(a => a.AssumptionType == ForecastAssumptionType.CPI);

        var scoaItems = await _db.ScoaItems.ToListAsync();
        var scoaFunds = await _db.ScoaFunds.ToListAsync();
        var scoaFunctions = await _db.ScoaFunctions.ToListAsync();
        var scoaRegions = await _db.ScoaRegions.ToListAsync();
        var scoaCostings = await _db.ScoaCostings.ToListAsync();

        var projections = new List<ExpenditureProjection>();
        var grouped = costItems.GroupBy(ci => ci.ExpenditureCategoryId);

        foreach (var group in grouped)
        {
            var cat = group.First().ExpenditureCategory;
            var scenarioLine = scenarioLines.FirstOrDefault(l => l.ExpenditureCategoryId == cat.Id);

            foreach (var ci in group)
            {
                var rate = scenarioLine?.ProjectedUnitRate ?? ci.UnitRate;
                var basic = scenarioLine?.ProjectedBasicCost ?? ci.BasicCost;

                var annualGross = (rate + basic) * 12;
                var vatRate = ci.VatIndicator == VatIndicator.StandardRated ? 0.15m : 0;
                var vatAmount = Math.Round(annualGross * vatRate, 2);

                var y1 = Math.Round(annualGross, 2);
                var y2 = Math.Round(y1 * (1 + growthY2 / 100), 2);
                var y3 = Math.Round(y2 * (1 + growthY3 / 100), 2);

                var seasonality = GetSeasonality(cat.Type);
                var months = new decimal[12];
                for (int i = 0; i < 12; i++)
                    months[i] = Math.Round(y1 * seasonality[i], 2);

                var scoaItemCode = CategoryToScoaItem.GetValueOrDefault(cat.Type);
                var scoaFuncCode = CategoryToFunction.GetValueOrDefault(cat.Type);

                var projection = new ExpenditureProjection
                {
                    FinancialYearId = financialYearId,
                    ExpenditureCategoryId = cat.Id,
                    CostItemId = ci.Id,
                    ExpenditureScenarioId = expenditureScenarioId,
                    UnitRate = rate,
                    BasicCost = basic,
                    GrossExpenditure = y1,
                    VatAmount = vatAmount,
                    NetExpenditure = y1 + vatAmount,
                    Year1Amount = y1,
                    Year2Amount = y2,
                    Year3Amount = y3,
                    Month01 = months[0], Month02 = months[1], Month03 = months[2],
                    Month04 = months[3], Month05 = months[4], Month06 = months[5],
                    Month07 = months[6], Month08 = months[7], Month09 = months[8],
                    Month10 = months[9], Month11 = months[10], Month12 = months[11],
                    Status = CreditorApprovalStatus.Draft,
                    ScoaItemId = scoaItems.FirstOrDefault(i => i.Code == scoaItemCode)?.Id,
                    ScoaFundId = scoaFunds.FirstOrDefault(f => f.Code == "CF")?.Id,
                    ScoaFunctionId = scoaFunctions.FirstOrDefault(f => f.Code == scoaFuncCode)?.Id,
                    ScoaRegionId = scoaRegions.FirstOrDefault(r => r.Code == "MUN")?.Id,
                    ScoaCostingId = scoaCostings.FirstOrDefault(c => c.Code == "SERV")?.Id
                };

                projections.Add(projection);
                _db.ExpenditureProjections.Add(projection);
            }
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("ExpenditureProjection", 0, "Calculated", "system", $"Generated {projections.Count} expenditure projections for FY {financialYearId}");

        return projections;
    }

    private static decimal[] GetSeasonality(ExpenditureCategoryType type)
    {
        return type switch
        {
            ExpenditureCategoryType.EmployeeCosts => EmployeeSeasonality,
            ExpenditureCategoryType.ContractedServices => ContractedSeasonality,
            _ => Enumerable.Repeat(1.0m / 12, 12).ToArray()
        };
    }
}
