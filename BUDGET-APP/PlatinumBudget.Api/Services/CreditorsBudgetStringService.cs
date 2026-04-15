using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class CreditorsBudgetStringService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    public CreditorsBudgetStringService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<GenerateBudgetStringsResultDto> GenerateBudgetStrings(int budgetVersionId, int financialYearId)
    {
        var version = await _db.BudgetVersions.FindAsync(budgetVersionId);
        if (version == null) throw new ArgumentException("Budget version not found");

        var projections = await _db.ExpenditureProjections
            .Include(p => p.ExpenditureCategory)
            .Include(p => p.ScoaItem)
            .Include(p => p.ScoaFund)
            .Include(p => p.ScoaFunction)
            .Include(p => p.ScoaRegion)
            .Include(p => p.ScoaCosting)
            .Where(p => p.FinancialYearId == financialYearId && p.Status == CreditorApprovalStatus.Approved)
            .ToListAsync();

        var scoaProjectOpex = await _db.ScoaProjects.FirstOrDefaultAsync(p => p.Code == "OPEX");
        var scoaMscGen = await _db.ScoaMscs.FirstOrDefaultAsync(m => m.Code == "GEN");

        var existingStrings = await _db.BudgetStrings
            .Where(bs => bs.BudgetVersionId == budgetVersionId && bs.SourceModule == SourceModule.CreditorsBudget)
            .ToListAsync();

        int generated = 0, updated = 0;
        var warnings = new List<string>();

        var grouped = projections
            .Where(p => p.ScoaItemId.HasValue && p.ScoaFundId.HasValue && p.ScoaFunctionId.HasValue)
            .GroupBy(p => new { p.ScoaItemId, p.ScoaFundId, p.ScoaFunctionId, p.ScoaRegionId, p.ScoaCostingId });

        foreach (var group in grouped)
        {
            var y1 = group.Sum(p => p.NetExpenditure);
            var y2 = group.Sum(p => p.Year2Amount);
            var y3 = group.Sum(p => p.Year3Amount);

            var m = new decimal[12];
            foreach (var p in group)
            {
                m[0] += p.Month01; m[1] += p.Month02; m[2] += p.Month03;
                m[3] += p.Month04; m[4] += p.Month05; m[5] += p.Month06;
                m[6] += p.Month07; m[7] += p.Month08; m[8] += p.Month09;
                m[9] += p.Month10; m[10] += p.Month11; m[11] += p.Month12;
            }

            if (!group.Key.ScoaItemId.HasValue || !group.Key.ScoaFundId.HasValue || !group.Key.ScoaFunctionId.HasValue)
            {
                warnings.Add("Skipped group: missing mSCOA segments");
                continue;
            }

            var existing = existingStrings.FirstOrDefault(bs =>
                bs.ScoaItemId == group.Key.ScoaItemId &&
                bs.ScoaFundId == group.Key.ScoaFundId &&
                bs.ScoaFunctionId == group.Key.ScoaFunctionId);

            if (existing != null)
            {
                existing.Year1Amount = Math.Round(y1, 2);
                existing.Year2Amount = Math.Round(y2, 2);
                existing.Year3Amount = Math.Round(y3, 2);
                for (int i = 0; i < 12; i++)
                {
                    var prop = typeof(BudgetString).GetProperty($"Month{(i + 1):D2}");
                    prop?.SetValue(existing, Math.Round(m[i], 2));
                }
                existing.ModifiedBy = "CreditorsBudget";
                existing.ModifiedOn = DateTime.UtcNow;
                updated++;
            }
            else
            {
                var bs = new BudgetString
                {
                    BudgetVersionId = budgetVersionId,
                    SourceModule = SourceModule.CreditorsBudget,
                    ScoaItemId = group.Key.ScoaItemId.Value,
                    ScoaFundId = group.Key.ScoaFundId.Value,
                    ScoaFunctionId = group.Key.ScoaFunctionId.Value,
                    ScoaProjectId = scoaProjectOpex?.Id ?? 1,
                    ScoaRegionId = group.Key.ScoaRegionId ?? 1,
                    ScoaCostingId = group.Key.ScoaCostingId ?? 1,
                    ScoaMscId = scoaMscGen?.Id ?? 1,
                    Year1Amount = Math.Round(y1, 2),
                    Year2Amount = Math.Round(y2, 2),
                    Year3Amount = Math.Round(y3, 2),
                    Month01 = Math.Round(m[0], 2), Month02 = Math.Round(m[1], 2), Month03 = Math.Round(m[2], 2),
                    Month04 = Math.Round(m[3], 2), Month05 = Math.Round(m[4], 2), Month06 = Math.Round(m[5], 2),
                    Month07 = Math.Round(m[6], 2), Month08 = Math.Round(m[7], 2), Month09 = Math.Round(m[8], 2),
                    Month10 = Math.Round(m[9], 2), Month11 = Math.Round(m[10], 2), Month12 = Math.Round(m[11], 2),
                    Description = $"Creditors Budget - {group.First().ExpenditureCategory.Name}",
                    OriginRefId = $"CRB-{financialYearId}",
                    CreatedBy = "CreditorsBudget"
                };
                _db.BudgetStrings.Add(bs);
                generated++;
            }
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("BudgetString", budgetVersionId, "CreditorsBudgetGenerated", "system", $"Generated {generated} new, updated {updated} creditors budget strings");

        return new GenerateBudgetStringsResultDto(generated, updated, warnings);
    }
}
