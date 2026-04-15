using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class DefinedBenefitService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    public DefinedBenefitService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<DefinedBenefitObligation>> CalculateDboMovements(int financialYearId, decimal discountRate, decimal inflationRate, decimal salaryGrowthRate)
    {
        var obligations = await _db.DefinedBenefitObligations
            .Where(d => d.FinancialYearId == financialYearId)
            .ToListAsync();

        foreach (var dbo in obligations)
        {
            dbo.DiscountRate = discountRate;
            dbo.InflationRate = inflationRate;
            dbo.SalaryGrowthRate = salaryGrowthRate;

            dbo.InterestCost = Math.Round(dbo.OpeningBalance * (discountRate / 100), 2);
            dbo.ServiceCost = Math.Round(dbo.OpeningBalance * (salaryGrowthRate / 100) * 0.05m, 2);

            dbo.ClosingBalance = Math.Round(
                dbo.OpeningBalance + dbo.ServiceCost + dbo.InterestCost - dbo.BenefitPayments + dbo.ActuarialGainLoss, 2);

            AllocatePortions(dbo);
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("DefinedBenefitObligation", 0, "DboMovementsCalculated", "system", $"Calculated DBO movements for {obligations.Count} entries in FY {financialYearId}");

        return obligations;
    }

    public async Task<List<DefinedBenefitObligation>> AllocateCurrentNonCurrent(int financialYearId)
    {
        var obligations = await _db.DefinedBenefitObligations
            .Where(d => d.FinancialYearId == financialYearId)
            .ToListAsync();

        foreach (var dbo in obligations)
        {
            AllocatePortions(dbo);
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("DefinedBenefitObligation", 0, "CurrentNonCurrentAllocated", "system", $"Allocated current/non-current for {obligations.Count} DBO entries");

        return obligations;
    }

    private void AllocatePortions(DefinedBenefitObligation dbo)
    {
        decimal currentRatio = dbo.BenefitType switch
        {
            DboBenefitType.PostRetirementMedical => 0.08m,
            DboBenefitType.LongServiceAward => 0.15m,
            DboBenefitType.PensionTopUp => 0.10m,
            _ => 0.10m
        };

        dbo.CurrentPortion = Math.Round(dbo.ClosingBalance * currentRatio, 2);
        dbo.NonCurrentPortion = Math.Round(dbo.ClosingBalance - dbo.CurrentPortion, 2);
    }

    public async Task<List<LongServiceAward>> CalculateLongServiceAwards(int financialYearId)
    {
        var awards = await _db.LongServiceAwards
            .Where(a => a.FinancialYearId == financialYearId)
            .ToListAsync();

        foreach (var award in awards)
        {
            award.EstimatedPayments = Math.Round(award.BenefitAmount * award.EligibleEmployees, 2);

            decimal currentRatio = award.MilestoneYears <= 10 ? 0.30m :
                                   award.MilestoneYears <= 20 ? 0.20m : 0.10m;

            award.CurrentPortion = Math.Round(award.EstimatedPayments * currentRatio, 2);
            award.NonCurrentPortion = Math.Round(award.EstimatedPayments - award.CurrentPortion, 2);
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("LongServiceAward", 0, "LsaPaymentsCalculated", "system", $"Calculated LSA payments for {awards.Count} entries");

        return awards;
    }

    public async Task<DboSummaryDto> GetDboSummary(int financialYearId)
    {
        var obligations = await _db.DefinedBenefitObligations
            .Where(d => d.FinancialYearId == financialYearId)
            .ToListAsync();

        var lsaAwards = await _db.LongServiceAwards
            .Where(a => a.FinancialYearId == financialYearId)
            .ToListAsync();

        var obligationDtos = obligations.Select(d => new DefinedBenefitObligationDto(
            d.Id, d.BenefitType.ToString(), d.Department, d.OpeningBalance, d.ServiceCost,
            d.InterestCost, d.BenefitPayments, d.ActuarialGainLoss, d.ClosingBalance,
            d.CurrentPortion, d.NonCurrentPortion, d.DiscountRate, d.InflationRate,
            d.SalaryGrowthRate, d.MortalityRate, d.TurnoverRate, d.FinancialYearId,
            d.ScoaItemCode, d.ScoaFundCode, d.ScoaFunctionCode, d.ScoaRegionCode
        )).ToList();

        var lsaDtos = lsaAwards.Select(a => new LongServiceAwardDto(
            a.Id, a.Department, a.MilestoneYears, a.BenefitAmount, a.EligibleEmployees,
            a.EstimatedPayments, a.CurrentPortion, a.NonCurrentPortion, a.FinancialYearId,
            a.ScoaItemCode, a.ScoaFundCode, a.ScoaFunctionCode
        )).ToList();

        return new DboSummaryDto(
            obligations.Sum(d => d.ClosingBalance),
            obligations.Sum(d => d.CurrentPortion),
            obligations.Sum(d => d.NonCurrentPortion),
            lsaAwards.Sum(a => a.EstimatedPayments),
            obligations.Sum(d => d.BenefitPayments) + lsaAwards.Sum(a => a.EstimatedPayments),
            obligations.Sum(d => d.ServiceCost),
            obligations.Sum(d => d.InterestCost),
            obligations.Sum(d => d.ActuarialGainLoss),
            obligationDtos,
            lsaDtos
        );
    }
}
