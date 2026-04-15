using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class CreditorLiabilityService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    public CreditorLiabilityService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<CreditorLiability>> GenerateLiabilities(int financialYearId)
    {
        var existing = await _db.CreditorLiabilities
            .Where(l => l.FinancialYearId == financialYearId)
            .ToListAsync();
        _db.CreditorLiabilities.RemoveRange(existing);

        var projections = await _db.ExpenditureProjections
            .Include(p => p.ExpenditureCategory)
            .Where(p => p.FinancialYearId == financialYearId)
            .ToListAsync();

        var creditorCategories = await _db.CreditorCategories
            .Include(c => c.CreditorItems)
            .Where(c => c.IsActive)
            .ToListAsync();

        var scoaItems = await _db.ScoaItems.ToListAsync();
        var scoaFunds = await _db.ScoaFunds.ToListAsync();
        var scoaFunctions = await _db.ScoaFunctions.ToListAsync();
        var scoaRegions = await _db.ScoaRegions.ToListAsync();

        var liabilities = new List<CreditorLiability>();
        var grouped = projections.GroupBy(p => p.ExpenditureCategoryId);

        foreach (var group in grouped)
        {
            var cat = group.First().ExpenditureCategory;
            var totalExpenditure = group.Sum(p => p.GrossExpenditure);
            var y1 = group.Sum(p => p.Year1Amount);
            var y2 = group.Sum(p => p.Year2Amount);
            var y3 = group.Sum(p => p.Year3Amount);

            foreach (var credCat in creditorCategories)
            {
                var item = credCat.CreditorItems.FirstOrDefault(ci => ci.ExpenditureCategoryId == cat.Id);
                var paymentRate = item?.PaymentRate30Days ?? 85m;

                var openingBalance = totalExpenditure * 0.08m;
                var projectedPayments = totalExpenditure * (paymentRate / 100);
                var closingBalance = openingBalance + totalExpenditure - projectedPayments;

                var contraBank = $"BNK-{cat.Code}-{credCat.Type}";

                var liability = new CreditorLiability
                {
                    FinancialYearId = financialYearId,
                    ExpenditureCategoryId = cat.Id,
                    CreditorCategoryId = credCat.Id,
                    LiabilityType = credCat.Type.ToString(),
                    OpeningBalance = Math.Round(openingBalance, 2),
                    ProjectedExpenditure = Math.Round(totalExpenditure, 2),
                    ProjectedPayments = Math.Round(projectedPayments, 2),
                    ClosingBalance = Math.Round(closingBalance, 2),
                    PaymentRate = paymentRate,
                    ContraBankAccount = contraBank,
                    IsPriorYearLiability = false,
                    Year1Amount = Math.Round(y1 * (1 - paymentRate / 100), 2),
                    Year2Amount = Math.Round(y2 * (1 - paymentRate / 100), 2),
                    Year3Amount = Math.Round(y3 * (1 - paymentRate / 100), 2),
                    ScoaItemId = group.First().ScoaItemId,
                    ScoaFundId = group.First().ScoaFundId,
                    ScoaFunctionId = group.First().ScoaFunctionId,
                    ScoaRegionId = group.First().ScoaRegionId,
                    Status = CreditorApprovalStatus.Draft
                };

                liabilities.Add(liability);
                _db.CreditorLiabilities.Add(liability);
            }
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("CreditorLiability", 0, "Generated", "system", $"Generated {liabilities.Count} creditor liabilities for FY {financialYearId}");

        return liabilities;
    }
}
