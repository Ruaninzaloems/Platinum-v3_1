using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class TariffModellingService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;
    private const decimal MaterialShiftThreshold = 15.0m;

    public TariffModellingService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task CalculateScenarioLines(TariffScenario scenario)
    {
        var consumerServices = await _db.ConsumerCategoryServices
            .Include(cs => cs.ConsumerCategory)
            .Include(cs => cs.ServiceCategory)
            .ToListAsync();

        var tariffs = await _db.Tariffs
            .Where(t => t.FinancialYearId == scenario.FinancialYearId && t.IsApproved)
            .ToListAsync();

        foreach (var line in scenario.Lines)
        {
            var svcConsumers = consumerServices
                .Where(cs => cs.ServiceCategoryId == line.ServiceCategoryId)
                .ToList();

            var baseTariff = tariffs.FirstOrDefault(t => t.ServiceCategoryId == line.ServiceCategoryId);
            if (baseTariff != null)
            {
                line.BaseTariffId = baseTariff.Id;
                line.CurrentUnitRate = baseTariff.UnitRate;
                line.CurrentBasicCharge = baseTariff.BasicCharge;
            }

            var totalConsumers = svcConsumers.Sum(cs => cs.ConsumerCount);
            var avgConsumption = svcConsumers.Any()
                ? svcConsumers.Sum(cs => cs.AvgConsumption * cs.ConsumerCount) / Math.Max(totalConsumers, 1)
                : 0;

            line.CurrentRevenue = (line.CurrentUnitRate * avgConsumption + line.CurrentBasicCharge) * totalConsumers * 12;
            line.ProjectedRevenue = (line.ProjectedUnitRate * avgConsumption + line.ProjectedBasicCharge) * totalConsumers * 12;
            line.VarianceAmount = line.ProjectedRevenue - line.CurrentRevenue;
            line.VariancePercent = line.CurrentRevenue != 0
                ? (line.VarianceAmount / line.CurrentRevenue) * 100
                : 0;
            line.IsMaterialShift = Math.Abs(line.VariancePercent) > MaterialShiftThreshold;
        }
    }

    public async Task<TariffScenario> CreateScenarioWithLines(string name, string? description, int financialYearId, decimal baseIncreasePercent, string? justification, List<int>? serviceCategoryIds)
    {
        var scenario = new TariffScenario
        {
            Name = name,
            Description = description,
            FinancialYearId = financialYearId,
            BaseIncreasePercentage = baseIncreasePercent,
            Justification = justification,
            Status = BillingApprovalStatus.Draft,
            CreatedBy = "system"
        };
        _db.TariffScenarios.Add(scenario);
        await _db.SaveChangesAsync();

        var services = serviceCategoryIds != null && serviceCategoryIds.Any()
            ? await _db.ServiceCategories.Where(s => serviceCategoryIds.Contains(s.Id)).ToListAsync()
            : await _db.ServiceCategories.Where(s => s.IsActive).ToListAsync();

        var tariffs = await _db.Tariffs
            .Where(t => t.FinancialYearId == financialYearId && t.IsApproved)
            .ToListAsync();

        foreach (var svc in services)
        {
            var baseTariff = tariffs.FirstOrDefault(t => t.ServiceCategoryId == svc.Id);
            var currentRate = baseTariff?.UnitRate ?? 0;
            var currentBasic = baseTariff?.BasicCharge ?? 0;
            var factor = 1 + (baseIncreasePercent / 100);

            var line = new TariffScenarioLine
            {
                TariffScenarioId = scenario.Id,
                ServiceCategoryId = svc.Id,
                BaseTariffId = baseTariff?.Id,
                CurrentUnitRate = currentRate,
                CurrentBasicCharge = currentBasic,
                ProjectedUnitRate = Math.Round(currentRate * factor, 4),
                ProjectedBasicCharge = Math.Round(currentBasic * factor, 4),
                IncreasePercent = baseIncreasePercent
            };
            scenario.Lines.Add(line);
            _db.TariffScenarioLines.Add(line);
        }

        await _db.SaveChangesAsync();
        await CalculateScenarioLines(scenario);
        await _db.SaveChangesAsync();

        await _audit.LogAsync("TariffScenario", scenario.Id, "Created", "system", $"Scenario '{name}' with {services.Count} service lines at {baseIncreasePercent}% increase");

        return scenario;
    }
}
