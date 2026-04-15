using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class ExpenditureModellingService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;
    private const decimal MaterialShiftThreshold = 15.0m;

    public ExpenditureModellingService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task CalculateScenarioLines(ExpenditureScenario scenario)
    {
        var costItems = await _db.CostItems
            .Include(ci => ci.ExpenditureCategory)
            .Where(ci => ci.FinancialYearId == scenario.FinancialYearId && ci.IsApproved)
            .ToListAsync();

        foreach (var line in scenario.Lines)
        {
            var catItems = costItems.Where(ci => ci.ExpenditureCategoryId == line.ExpenditureCategoryId).ToList();
            var baseCostItem = catItems.FirstOrDefault(ci => ci.Id == line.BaseCostItemId) ?? catItems.FirstOrDefault();

            if (baseCostItem != null)
            {
                line.BaseCostItemId = baseCostItem.Id;
                line.CurrentUnitRate = baseCostItem.UnitRate;
                line.CurrentBasicCost = baseCostItem.BasicCost;
            }

            var totalItems = catItems.Count;
            var avgUnitRate = catItems.Any() ? catItems.Average(ci => ci.UnitRate) : 0;
            var avgBasicCost = catItems.Any() ? catItems.Average(ci => ci.BasicCost) : 0;

            line.CurrentExpenditure = catItems.Sum(ci => (ci.UnitRate + ci.BasicCost) * 12);
            line.ProjectedExpenditure = catItems.Sum(ci =>
            {
                var inflFactor = 1 + (line.InflationPercent / 100);
                var demandFactor = 1 + (line.DemandAdjustmentPercent / 100);
                return (ci.UnitRate * inflFactor + ci.BasicCost * inflFactor) * demandFactor * 12;
            });

            line.VarianceAmount = line.ProjectedExpenditure - line.CurrentExpenditure;
            line.VariancePercent = line.CurrentExpenditure != 0
                ? (line.VarianceAmount / line.CurrentExpenditure) * 100
                : 0;
            line.IsMaterialShift = Math.Abs(line.VariancePercent) > MaterialShiftThreshold;
        }
    }

    public async Task<ExpenditureScenario> CreateScenarioWithLines(string name, string? description, int financialYearId, decimal baseInflationPercent, decimal? demandAdjustmentPercent, string? justification, List<int>? expenditureCategoryIds)
    {
        var scenario = new ExpenditureScenario
        {
            Name = name,
            Description = description,
            FinancialYearId = financialYearId,
            BaseInflationPercent = baseInflationPercent,
            DemandAdjustmentPercent = demandAdjustmentPercent,
            Justification = justification,
            Status = CreditorApprovalStatus.Draft,
            CreatedBy = "system"
        };
        _db.ExpenditureScenarios.Add(scenario);
        await _db.SaveChangesAsync();

        var categories = expenditureCategoryIds != null && expenditureCategoryIds.Any()
            ? await _db.ExpenditureCategories.Where(e => expenditureCategoryIds.Contains(e.Id)).ToListAsync()
            : await _db.ExpenditureCategories.Where(e => e.IsActive).ToListAsync();

        var costItems = await _db.CostItems
            .Where(ci => ci.FinancialYearId == financialYearId && ci.IsApproved)
            .ToListAsync();

        foreach (var cat in categories)
        {
            var catItems = costItems.Where(ci => ci.ExpenditureCategoryId == cat.Id).ToList();
            var baseCostItem = catItems.FirstOrDefault();
            var currentRate = baseCostItem?.UnitRate ?? 0;
            var currentBasic = baseCostItem?.BasicCost ?? 0;
            var inflFactor = 1 + (baseInflationPercent / 100);
            var demandFactor = 1 + ((demandAdjustmentPercent ?? 0) / 100);

            var line = new ExpenditureScenarioLine
            {
                ExpenditureScenarioId = scenario.Id,
                ExpenditureCategoryId = cat.Id,
                BaseCostItemId = baseCostItem?.Id,
                CurrentUnitRate = currentRate,
                CurrentBasicCost = currentBasic,
                ProjectedUnitRate = Math.Round(currentRate * inflFactor, 4),
                ProjectedBasicCost = Math.Round(currentBasic * inflFactor, 4),
                InflationPercent = baseInflationPercent,
                DemandAdjustmentPercent = demandAdjustmentPercent ?? 0
            };
            scenario.Lines.Add(line);
            _db.ExpenditureScenarioLines.Add(line);
        }

        await _db.SaveChangesAsync();
        await CalculateScenarioLines(scenario);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("ExpenditureScenario", scenario.Id, "Created", "system", $"Scenario '{name}' with {categories.Count} category lines at {baseInflationPercent}% inflation");

        return scenario;
    }
}
