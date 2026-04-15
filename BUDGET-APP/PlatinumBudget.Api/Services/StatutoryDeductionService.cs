using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class StatutoryDeductionService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    private static readonly (decimal Threshold, decimal Rate, decimal BaseAmount)[] PayeTaxTable = new[]
    {
        (237_100m, 0.18m, 0m),
        (370_500m, 0.26m, 42_678m),
        (512_800m, 0.31m, 77_362m),
        (673_000m, 0.36m, 121_475m),
        (857_900m, 0.39m, 179_147m),
        (1_817_000m, 0.41m, 251_258m),
        (decimal.MaxValue, 0.45m, 644_489m)
    };

    private const decimal UIF_RATE = 0.01m;
    private const decimal UIF_THRESHOLD = 17_712m;
    private const decimal SDL_RATE = 0.01m;

    public StatutoryDeductionService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public PayeCalculationResultDto CalculatePAYE(decimal annualTaxableIncome)
    {
        if (annualTaxableIncome <= 0)
            return new PayeCalculationResultDto(0, 0, 0, "Below threshold");

        decimal taxableIncome = annualTaxableIncome;
        decimal paye = 0;
        string bracket = "";
        decimal previousThreshold = 0;

        for (int i = 0; i < PayeTaxTable.Length; i++)
        {
            var (threshold, rate, baseAmount) = PayeTaxTable[i];
            if (taxableIncome <= threshold)
            {
                paye = baseAmount + (taxableIncome - previousThreshold) * rate;
                bracket = $"Bracket {i + 1}: {rate * 100}%";
                break;
            }
            previousThreshold = threshold;
        }

        decimal rebate = 17_235m;
        paye = Math.Max(0, paye - rebate);

        decimal effectiveRate = taxableIncome > 0 ? Math.Round(paye / taxableIncome * 100, 2) : 0;

        return new PayeCalculationResultDto(
            Math.Round(taxableIncome, 2),
            Math.Round(paye, 2),
            effectiveRate,
            bracket
        );
    }

    public UifCalculationResultDto CalculateUIF(decimal monthlyRemuneration)
    {
        decimal cappedRemuneration = Math.Min(monthlyRemuneration, UIF_THRESHOLD);
        decimal employeeContribution = Math.Round(cappedRemuneration * UIF_RATE, 2);
        decimal employerContribution = Math.Round(cappedRemuneration * UIF_RATE, 2);

        return new UifCalculationResultDto(
            employeeContribution,
            employerContribution,
            employeeContribution + employerContribution,
            UIF_THRESHOLD
        );
    }

    public SdlCalculationResultDto CalculateSDL(decimal totalRemuneration)
    {
        decimal sdlAmount = Math.Round(totalRemuneration * SDL_RATE, 2);

        return new SdlCalculationResultDto(
            Math.Round(totalRemuneration, 2),
            sdlAmount,
            SDL_RATE * 100
        );
    }

    public async Task<AllDeductionsResultDto> CalculateAllDeductions(int financialYearId, decimal totalRemuneration)
    {
        decimal annualRemuneration = totalRemuneration;
        decimal monthlyRemuneration = totalRemuneration / 12;

        var paye = CalculatePAYE(annualRemuneration);
        var uif = CalculateUIF(monthlyRemuneration);
        var sdl = CalculateSDL(annualRemuneration);

        var deductions = await _db.StatutoryDeductions.Where(d => d.IsActive).ToListAsync();

        decimal otherEmployeeDeductions = 0;
        decimal otherEmployerContributions = 0;

        foreach (var deduction in deductions)
        {
            if (deduction.DeductionType is "PAYE" or "UIF" or "SDL") continue;

            decimal amount = deduction.CalculationMethod switch
            {
                DeductionCalculationMethod.Percentage => annualRemuneration * (deduction.Rate / 100),
                DeductionCalculationMethod.FixedAmount => deduction.Rate * 12,
                _ => 0
            };

            otherEmployeeDeductions += Math.Round(amount, 2);
            if (deduction.EmployerContributionRate.HasValue)
            {
                otherEmployerContributions += Math.Round(annualRemuneration * (deduction.EmployerContributionRate.Value / 100), 2);
            }
        }

        decimal totalEmployeeDeductions = paye.CalculatedPaye + (uif.EmployeeContribution * 12) + otherEmployeeDeductions;
        decimal totalEmployerContributions = (uif.EmployerContribution * 12) + sdl.SdlAmount + otherEmployerContributions;

        await _audit.LogAsync("StatutoryDeduction", 0, "AllDeductionsCalculated", "system", $"Calculated all deductions for remuneration {totalRemuneration}");

        return new AllDeductionsResultDto(
            paye,
            uif,
            sdl,
            Math.Round(totalEmployeeDeductions, 2),
            Math.Round(totalEmployerContributions, 2),
            Math.Round(totalEmployeeDeductions + totalEmployerContributions, 2)
        );
    }

    public async Task<List<PayrollLiability>> CalculatePayrollLiabilities(int financialYearId)
    {
        var existing = await _db.PayrollLiabilities
            .Where(l => l.FinancialYearId == financialYearId)
            .ToListAsync();

        if (existing.Any()) return existing;

        var posts = await _db.PostEstablishments
            .Where(p => p.FinancialYearId == financialYearId && p.IsActive && p.Status == PostStatus.Filled)
            .ToListAsync();

        var totalRemuneration = posts.Sum(p => p.AnnualSalary);
        var deductions = await _db.StatutoryDeductions.Where(d => d.IsActive).ToListAsync();

        var liabilities = new List<PayrollLiability>();
        var departments = posts.Select(p => p.Department).Distinct().ToList();

        foreach (var dept in departments)
        {
            var deptPosts = posts.Where(p => p.Department == dept).ToList();
            var deptRemuneration = deptPosts.Sum(p => p.AnnualSalary);

            foreach (var deduction in deductions)
            {
                decimal employeeAmount = deduction.CalculationMethod switch
                {
                    DeductionCalculationMethod.Percentage => deptRemuneration * (deduction.Rate / 100),
                    DeductionCalculationMethod.FixedAmount => deduction.Rate * 12 * deptPosts.Count,
                    DeductionCalculationMethod.TaxTable => deptPosts.Sum(p => CalculatePAYE(p.AnnualSalary).CalculatedPaye),
                    _ => 0
                };

                decimal employerAmount = deduction.EmployerContributionRate.HasValue
                    ? deptRemuneration * (deduction.EmployerContributionRate.Value / 100)
                    : 0;

                var liability = new PayrollLiability
                {
                    LiabilityType = deduction.DeductionType,
                    Department = dept,
                    EmployeeContribution = Math.Round(employeeAmount, 2),
                    EmployerContribution = Math.Round(employerAmount, 2),
                    TotalLiability = Math.Round(employeeAmount + employerAmount, 2),
                    PaymentPeriod = "Monthly",
                    FinancialYearId = financialYearId,
                    ScoaItemCode = deptPosts.FirstOrDefault()?.ScoaItemCode,
                    ScoaFundCode = deptPosts.FirstOrDefault()?.ScoaFundCode,
                    ScoaFunctionCode = deptPosts.FirstOrDefault()?.ScoaFunctionCode,
                    ScoaRegionCode = deptPosts.FirstOrDefault()?.ScoaRegionCode
                };

                liabilities.Add(liability);
                _db.PayrollLiabilities.Add(liability);
            }
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("PayrollLiability", 0, "LiabilitiesCalculated", "system", $"Generated {liabilities.Count} payroll liabilities for FY {financialYearId}");

        return liabilities;
    }
}
