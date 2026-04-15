using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class HrPayrollCalculationService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    public HrPayrollCalculationService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<PostEstablishment>> CalculatePostBudget(int financialYearId)
    {
        var posts = await _db.PostEstablishments
            .Where(p => p.FinancialYearId == financialYearId && p.IsActive)
            .ToListAsync();

        var salaryStructures = await _db.SalaryStructures
            .Where(s => s.IsActive)
            .ToListAsync();

        var increases = await _db.SalaryIncreases
            .Where(i => i.FinancialYearId == financialYearId && !i.IsNotchProgression)
            .ToListAsync();

        var fy = await _db.FinancialYears.FindAsync(financialYearId);
        var fyStart = fy?.StartDate ?? new DateTime(DateTime.UtcNow.Year, 7, 1);
        var fyEnd = fy?.EndDate ?? fyStart.AddYears(1);

        foreach (var post in posts)
        {
            var structure = salaryStructures.FirstOrDefault(s =>
                s.Grade == post.SalaryGrade && s.Notch == post.SalaryNotch);

            decimal baseSalary = structure?.AnnualAmount ?? post.AnnualSalary;

            var increase = increases.FirstOrDefault(i =>
                i.EmployeeCategory == post.EmployeeCategory ||
                i.BargainingUnit == post.BargainingUnit);

            if (increase != null)
            {
                baseSalary *= (1 + increase.IncreasePercentage / 100);
            }

            if (post.Status == PostStatus.Vacant && post.PlannedStartDate.HasValue)
            {
                var startDate = post.PlannedStartDate.Value;
                if (startDate > fyStart)
                {
                    var remainingMonths = Math.Max(0, (fyEnd - startDate).Days / 30.44);
                    baseSalary = baseSalary * (decimal)(remainingMonths / 12.0);
                }
            }

            decimal employerContributions = baseSalary * 0.20m;
            post.AnnualSalary = Math.Round(baseSalary, 2);
            post.TotalCostToMunicipality = Math.Round(baseSalary + employerContributions, 2);
            post.ModifiedBy = "HrPayrollCalc";
            post.ModifiedOn = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("PostEstablishment", 0, "PostBudgetCalculated", "system", $"Calculated budget for {posts.Count} posts in FY {financialYearId}");

        return posts;
    }

    public async Task<List<PostEstablishment>> CalculateSalaryIncrease(int financialYearId, string? employeeCategory, string? bargainingUnit, decimal increasePercentage)
    {
        var query = _db.PostEstablishments
            .Where(p => p.FinancialYearId == financialYearId && p.IsActive && p.Status == PostStatus.Filled);

        if (!string.IsNullOrEmpty(employeeCategory))
            query = query.Where(p => p.EmployeeCategory == employeeCategory);
        if (!string.IsNullOrEmpty(bargainingUnit))
            query = query.Where(p => p.BargainingUnit == bargainingUnit);

        var posts = await query.ToListAsync();

        foreach (var post in posts)
        {
            var factor = 1 + increasePercentage / 100;
            post.AnnualSalary = Math.Round(post.AnnualSalary * factor, 2);
            post.TotalCostToMunicipality = Math.Round(post.AnnualSalary * 1.20m, 2);
            post.ModifiedBy = "SalaryIncrease";
            post.ModifiedOn = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("SalaryIncrease", 0, "SalaryIncreaseApplied", "system", $"Applied {increasePercentage}% increase to {posts.Count} posts");

        return posts;
    }

    public async Task<List<PostEstablishment>> CalculateNotchProgression(int financialYearId, string? bargainingUnit)
    {
        var query = _db.PostEstablishments
            .Where(p => p.FinancialYearId == financialYearId && p.IsActive && p.Status == PostStatus.Filled);

        if (!string.IsNullOrEmpty(bargainingUnit))
            query = query.Where(p => p.BargainingUnit == bargainingUnit);

        var posts = await query.ToListAsync();
        var salaryStructures = await _db.SalaryStructures.Where(s => s.IsActive).OrderBy(s => s.Grade).ThenBy(s => s.Notch).ToListAsync();

        foreach (var post in posts)
        {
            if (!post.SalaryGrade.HasValue || !post.SalaryNotch.HasValue) continue;

            var nextNotch = salaryStructures.FirstOrDefault(s =>
                s.Grade == post.SalaryGrade && s.Notch == post.SalaryNotch + 1);

            if (nextNotch != null)
            {
                post.SalaryNotch = nextNotch.Notch;
                post.AnnualSalary = nextNotch.AnnualAmount;
                post.TotalCostToMunicipality = Math.Round(nextNotch.AnnualAmount * 1.20m, 2);
                post.ModifiedBy = "NotchProgression";
                post.ModifiedOn = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("PostEstablishment", 0, "NotchProgressionApplied", "system", $"Applied notch progression to {posts.Count} posts");

        return posts;
    }

    public async Task<List<TemporaryContract>> CalculateTemporaryContractBudget(int financialYearId)
    {
        var contracts = await _db.TemporaryContracts
            .Where(c => c.FinancialYearId == financialYearId)
            .ToListAsync();

        var fy = await _db.FinancialYears.FindAsync(financialYearId);
        var fyStart = fy?.StartDate ?? new DateTime(DateTime.UtcNow.Year, 7, 1);
        var fyEnd = fy?.EndDate ?? fyStart.AddYears(1);

        foreach (var contract in contracts)
        {
            var effectiveStart = contract.ContractStartDate < fyStart ? fyStart : contract.ContractStartDate;
            var effectiveEnd = contract.ContractEndDate > fyEnd ? fyEnd : contract.ContractEndDate;
            var duration = (effectiveEnd - effectiveStart).TotalDays;

            if (duration <= 0)
            {
                contract.CalculatedBudget = 0;
                continue;
            }

            contract.CalculatedBudget = contract.RemunerationType switch
            {
                RemunerationType.Hourly => Math.Round(contract.Rate * (decimal)(duration / 30.44) * 160, 2),
                RemunerationType.Monthly => Math.Round(contract.Rate * (decimal)(duration / 30.44), 2),
                RemunerationType.Fixed => contract.Rate,
                _ => 0
            };
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("TemporaryContract", 0, "ContractBudgetCalculated", "system", $"Calculated budget for {contracts.Count} contracts");

        return contracts;
    }

    public async Task<List<CouncillorPosition>> CalculateCouncillorBudget(int financialYearId, decimal anticipatedIncreasePercent)
    {
        var positions = await _db.CouncillorPositions
            .Where(p => p.FinancialYearId == financialYearId)
            .ToListAsync();

        foreach (var pos in positions)
        {
            pos.TotalRemuneration = pos.BasicSalary + pos.TravelAllowance + pos.CellphoneAllowance +
                                    pos.MedicalContribution + pos.OtherBenefits;
            pos.AnticipatedIncreasePercent = anticipatedIncreasePercent;
            pos.AdjustedTotalRemuneration = Math.Round(pos.TotalRemuneration * (1 + anticipatedIncreasePercent / 100) * pos.NumberOfPositions, 2);
            pos.ExceedsUpperLimit = pos.AdjustedTotalRemuneration / Math.Max(pos.NumberOfPositions, 1) > pos.GazettedUpperLimit && pos.GazettedUpperLimit > 0;
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("CouncillorPosition", 0, "CouncillorBudgetCalculated", "system", $"Calculated councillor budget for {positions.Count} positions at {anticipatedIncreasePercent}% increase");

        return positions;
    }

    public async Task<List<WardCommitteeBudget>> CalculateWardCommitteeBudget(int financialYearId, decimal anticipatedRateIncreasePercent)
    {
        var wards = await _db.WardCommitteeBudgets
            .Where(w => w.FinancialYearId == financialYearId)
            .ToListAsync();

        foreach (var ward in wards)
        {
            ward.AnticipatedRateIncreasePercent = anticipatedRateIncreasePercent;
            ward.AdjustedRatePerMeeting = Math.Round(ward.RatePerMeeting * (1 + anticipatedRateIncreasePercent / 100), 2);
            ward.TotalEstimatedCost = Math.Round(ward.AdjustedRatePerMeeting * ward.NumberOfMembers * ward.NumberOfMeetings, 2);
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("WardCommitteeBudget", 0, "WardBudgetCalculated", "system", $"Calculated ward committee budget for {wards.Count} wards at {anticipatedRateIncreasePercent}% increase");

        return wards;
    }

    public async Task<List<VariableBenefitHours>> CalculateVariableBenefits(int financialYearId)
    {
        var benefits = await _db.VariableBenefitHours
            .Where(v => v.FinancialYearId == financialYearId)
            .ToListAsync();

        foreach (var benefit in benefits)
        {
            benefit.CalculatedCost = Math.Round(benefit.EstimatedHours * benefit.AverageRate, 2);
            if (benefit.HistoricalCost.HasValue && benefit.HistoricalCost > 0)
            {
                benefit.VariancePercent = Math.Round((benefit.CalculatedCost - benefit.HistoricalCost.Value) / benefit.HistoricalCost.Value * 100, 2);
            }
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("VariableBenefitHours", 0, "VariableBenefitsCalculated", "system", $"Calculated variable benefits for {benefits.Count} entries");

        return benefits;
    }

    public async Task<List<TravelRequirement>> CalculateTravelBudget(int financialYearId)
    {
        var requirements = await _db.TravelRequirements
            .Where(t => t.FinancialYearId == financialYearId)
            .ToListAsync();

        var standardRates = await _db.TravelStandardRates
            .Where(r => r.IsActive)
            .ToListAsync();

        foreach (var req in requirements)
        {
            var mileageRate = standardRates
                .FirstOrDefault(r => r.RateType == "Mileage" && r.Classification.ToString() == req.TransportMode.ToString())
                ?? standardRates.FirstOrDefault(r => r.RateType == "Mileage");
            var accommodationRate = standardRates.FirstOrDefault(r => r.RateType == "Accommodation");
            var subsistenceRate = standardRates.FirstOrDefault(r => r.RateType == "Subsistence");

            decimal travelCost = req.EstimatedKilometres * (mileageRate?.RateAmount ?? 4.0m);
            decimal accommodationCost = req.AccommodationNights * (accommodationRate?.RateAmount ?? 1500m);
            decimal subsistenceCost = req.TravelDuration * (subsistenceRate?.RateAmount ?? 500m);

            req.EstimatedCost = Math.Round((travelCost + accommodationCost + subsistenceCost) * req.NumberOfOfficials * req.NumberOfTrips, 2);
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("TravelRequirement", 0, "TravelBudgetCalculated", "system", $"Calculated travel budget for {requirements.Count} requirements");

        return requirements;
    }

    public async Task<List<PerformanceBonus>> CalculatePerformanceBonus(int financialYearId)
    {
        var bonuses = await _db.PerformanceBonuses
            .Where(b => b.FinancialYearId == financialYearId)
            .ToListAsync();

        foreach (var bonus in bonuses)
        {
            bonus.EstimatedTotalCost = Math.Round(bonus.QualifyingEmployees * bonus.AverageSalary * (bonus.BonusPercentage / 100), 2);
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("PerformanceBonus", 0, "BonusBudgetCalculated", "system", $"Calculated performance bonus for {bonuses.Count} entries");

        return bonuses;
    }
}
