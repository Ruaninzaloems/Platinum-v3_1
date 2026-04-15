using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class RevenueProjectionService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    private static readonly Dictionary<ServiceType, string> ServiceToScoaItem = new()
    {
        { ServiceType.PropertyRates, "1100" },
        { ServiceType.Electricity, "1200" },
        { ServiceType.Water, "1300" },
        { ServiceType.Sanitation, "1400" },
        { ServiceType.Refuse, "1500" }
    };

    private static readonly Dictionary<ServiceType, string> ServiceToFunction = new()
    {
        { ServiceType.Water, "WATER" },
        { ServiceType.Electricity, "ELEC" },
        { ServiceType.Sanitation, "WATER" },
        { ServiceType.Refuse, "WASTE" },
        { ServiceType.PropertyRates, "GOV" }
    };

    private static readonly decimal[] WaterSeasonality = { 0.07m, 0.07m, 0.08m, 0.09m, 0.10m, 0.10m, 0.09m, 0.08m, 0.08m, 0.08m, 0.08m, 0.08m };
    private static readonly decimal[] ElecSeasonality = { 0.10m, 0.09m, 0.08m, 0.07m, 0.07m, 0.09m, 0.10m, 0.09m, 0.08m, 0.07m, 0.08m, 0.08m };

    public RevenueProjectionService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<RevenueProjection>> CalculateProjections(int financialYearId, int? tariffScenarioId, decimal growthY2, decimal growthY3)
    {
        var existing = await _db.RevenueProjections
            .Where(r => r.FinancialYearId == financialYearId)
            .ToListAsync();
        _db.RevenueProjections.RemoveRange(existing);

        var consumerServices = await _db.ConsumerCategoryServices
            .Include(cs => cs.ConsumerCategory)
            .Include(cs => cs.ServiceCategory)
            .ToListAsync();

        var tariffs = await _db.Tariffs
            .Where(t => t.FinancialYearId == financialYearId && t.IsApproved)
            .ToListAsync();

        TariffScenario? scenario = null;
        List<TariffScenarioLine> scenarioLines = new();
        if (tariffScenarioId.HasValue)
        {
            scenario = await _db.TariffScenarios.Include(s => s.Lines).FirstOrDefaultAsync(s => s.Id == tariffScenarioId);
            scenarioLines = scenario?.Lines.ToList() ?? new();
        }

        var scoaItems = await _db.ScoaItems.ToListAsync();
        var scoaFunds = await _db.ScoaFunds.ToListAsync();
        var scoaFunctions = await _db.ScoaFunctions.ToListAsync();
        var scoaRegions = await _db.ScoaRegions.ToListAsync();
        var scoaCostings = await _db.ScoaCostings.ToListAsync();

        var projections = new List<RevenueProjection>();
        var grouped = consumerServices.GroupBy(cs => new { cs.ServiceCategoryId, cs.ConsumerCategoryId });

        foreach (var group in grouped)
        {
            var cs = group.First();
            var svc = cs.ServiceCategory;
            var consumer = cs.ConsumerCategory;

            var scenarioLine = scenarioLines.FirstOrDefault(l => l.ServiceCategoryId == cs.ServiceCategoryId);
            var baseTariff = tariffs.FirstOrDefault(t => t.ServiceCategoryId == cs.ServiceCategoryId);

            var rate = scenarioLine?.ProjectedUnitRate ?? baseTariff?.UnitRate ?? 0;
            var basicCharge = scenarioLine?.ProjectedBasicCharge ?? baseTariff?.BasicCharge ?? 0;

            var totalConsumers = group.Sum(g => g.ConsumerCount);
            var avgConsumption = group.Sum(g => g.AvgConsumption * g.ConsumerCount) / Math.Max(totalConsumers, 1);

            var annualGross = (rate * avgConsumption + basicCharge) * totalConsumers * 12;
            var y1 = Math.Round(annualGross, 2);
            var y2 = Math.Round(y1 * (1 + growthY2 / 100), 2);
            var y3 = Math.Round(y2 * (1 + growthY3 / 100), 2);

            var seasonality = GetSeasonality(svc.Type);
            var months = new decimal[12];
            for (int i = 0; i < 12; i++)
                months[i] = Math.Round(y1 * seasonality[i], 2);

            var scoaItemCode = ServiceToScoaItem.GetValueOrDefault(svc.Type);
            var scoaFuncCode = ServiceToFunction.GetValueOrDefault(svc.Type);

            var projection = new RevenueProjection
            {
                FinancialYearId = financialYearId,
                ServiceCategoryId = cs.ServiceCategoryId,
                ConsumerCategoryId = cs.ConsumerCategoryId,
                TariffScenarioId = tariffScenarioId,
                ConsumerCount = totalConsumers,
                AvgConsumption = avgConsumption,
                TariffRate = rate,
                GrossRevenue = y1,
                RebateAmount = 0,
                NetRevenue = y1,
                Year1Amount = y1,
                Year2Amount = y2,
                Year3Amount = y3,
                Month01 = months[0], Month02 = months[1], Month03 = months[2],
                Month04 = months[3], Month05 = months[4], Month06 = months[5],
                Month07 = months[6], Month08 = months[7], Month09 = months[8],
                Month10 = months[9], Month11 = months[10], Month12 = months[11],
                Status = BillingApprovalStatus.Draft,
                ScoaItemId = scoaItems.FirstOrDefault(i => i.Code == scoaItemCode)?.Id,
                ScoaFundId = scoaFunds.FirstOrDefault(f => f.Code == "CF")?.Id,
                ScoaFunctionId = scoaFunctions.FirstOrDefault(f => f.Code == scoaFuncCode)?.Id,
                ScoaRegionId = scoaRegions.FirstOrDefault(r => r.Code == "MUN")?.Id,
                ScoaCostingId = scoaCostings.FirstOrDefault(c => c.Code == "SERV")?.Id
            };

            projections.Add(projection);
            _db.RevenueProjections.Add(projection);
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("RevenueProjection", 0, "Calculated", "system", $"Generated {projections.Count} revenue projections for FY {financialYearId}");

        return projections;
    }

    private static decimal[] GetSeasonality(ServiceType type)
    {
        return type switch
        {
            ServiceType.Water => WaterSeasonality,
            ServiceType.Electricity => ElecSeasonality,
            _ => Enumerable.Repeat(1.0m / 12, 12).ToArray()
        };
    }
}
