using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class RebateProjectionService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    public RebateProjectionService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<RebateProjection>> CalculateProjections(int financialYearId, decimal growthY2, decimal growthY3)
    {
        var existing = await _db.RebateProjections
            .Where(r => r.FinancialYearId == financialYearId)
            .ToListAsync();
        _db.RebateProjections.RemoveRange(existing);

        var rebateTypes = await _db.RebateTypes
            .Include(r => r.ServiceCategory)
            .Where(r => r.IsActive)
            .ToListAsync();

        var consumerCategories = await _db.ConsumerCategories
            .Include(c => c.ConsumerServices)
            .Where(c => c.IsActive)
            .ToListAsync();

        var services = await _db.ServiceCategories.Where(s => s.IsActive).ToListAsync();
        var tariffs = await _db.Tariffs.Where(t => t.FinancialYearId == financialYearId && t.IsApproved).ToListAsync();

        var projections = new List<RebateProjection>();

        foreach (var rebateType in rebateTypes)
        {
            var applicableServices = rebateType.ServiceCategoryId.HasValue
                ? services.Where(s => s.Id == rebateType.ServiceCategoryId.Value).ToList()
                : services;

            foreach (var svc in applicableServices)
            {
                int eligibleCount = 0;
                decimal avgRebateValue = 0;

                if (rebateType.Category == RebateCategory.Indigent)
                {
                    var indigentConsumers = consumerCategories
                        .SelectMany(c => c.ConsumerServices)
                        .Where(cs => cs.ServiceCategoryId == svc.Id)
                        .Sum(cs => (int)(cs.ConsumerCount * 0.15m));
                    eligibleCount = indigentConsumers;
                }
                else if (rebateType.Category == RebateCategory.SeniorCitizen)
                {
                    var seniorConsumers = consumerCategories
                        .Where(c => c.Type == ConsumerType.Household)
                        .SelectMany(c => c.ConsumerServices)
                        .Where(cs => cs.ServiceCategoryId == svc.Id)
                        .Sum(cs => (int)(cs.ConsumerCount * 0.08m));
                    eligibleCount = seniorConsumers;
                }
                else
                {
                    var allConsumers = consumerCategories
                        .SelectMany(c => c.ConsumerServices)
                        .Where(cs => cs.ServiceCategoryId == svc.Id)
                        .Sum(cs => cs.ConsumerCount);
                    eligibleCount = (int)(allConsumers * 0.12m);
                }

                var tariff = tariffs.FirstOrDefault(t => t.ServiceCategoryId == svc.Id);
                var avgBill = tariff != null ? (tariff.UnitRate * 15 + tariff.BasicCharge) * 12 : 0;
                avgRebateValue = rebateType.FixedAmount ?? (avgBill * rebateType.RebatePercent / 100);

                var uptake = rebateType.Category == RebateCategory.Indigent ? 85.0m : 60.0m;
                var totalY1 = Math.Round(eligibleCount * (uptake / 100) * avgRebateValue, 2);
                var totalY2 = Math.Round(totalY1 * (1 + growthY2 / 100), 2);
                var totalY3 = Math.Round(totalY2 * (1 + growthY3 / 100), 2);

                var projection = new RebateProjection
                {
                    FinancialYearId = financialYearId,
                    RebateTypeId = rebateType.Id,
                    ServiceCategoryId = svc.Id,
                    EligibleCount = eligibleCount,
                    ProjectedUptakePercent = uptake,
                    TotalRebateAmount = totalY1,
                    Year1Amount = totalY1,
                    Year2Amount = totalY2,
                    Year3Amount = totalY3,
                    Status = BillingApprovalStatus.Draft
                };

                projections.Add(projection);
                _db.RebateProjections.Add(projection);
            }
        }

        await _db.SaveChangesAsync();

        var revenueProjections = await _db.RevenueProjections
            .Where(r => r.FinancialYearId == financialYearId)
            .ToListAsync();

        foreach (var rp in revenueProjections)
        {
            var rebateForService = projections
                .Where(p => p.ServiceCategoryId == rp.ServiceCategoryId)
                .Sum(p => p.Year1Amount);
            var proportionalRebate = rp.ConsumerCount > 0
                ? rebateForService * ((decimal)rp.ConsumerCount / Math.Max(consumerCategories.SelectMany(c => c.ConsumerServices).Where(cs => cs.ServiceCategoryId == rp.ServiceCategoryId).Sum(cs => cs.ConsumerCount), 1))
                : 0;
            rp.RebateAmount = Math.Round(proportionalRebate, 2);
            rp.NetRevenue = rp.GrossRevenue - rp.RebateAmount;
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("RebateProjection", 0, "Calculated", "system", $"Generated {projections.Count} rebate projections for FY {financialYearId}");

        return projections;
    }
}
