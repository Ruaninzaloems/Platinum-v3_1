using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class PayrollScenarioService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    public PayrollScenarioService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<PayrollScenario> CreateScenario(CreatePayrollScenarioDto dto)
    {
        var baseline = await CalculateBaselineCost(dto.FinancialYearId);

        var scenario = new PayrollScenario
        {
            Name = dto.Name,
            Description = dto.Description,
            SalaryIncreasePercent = dto.SalaryIncreasePercent,
            VacancyFillingPercent = dto.VacancyFillingPercent,
            BenefitAdjustmentPercent = dto.BenefitAdjustmentPercent,
            OvertimeAdjustmentPercent = dto.OvertimeAdjustmentPercent,
            TravelAdjustmentPercent = dto.TravelAdjustmentPercent,
            TotalBaselineCost = baseline,
            FinancialYearId = dto.FinancialYearId,
            Status = HrBudgetStatus.Draft
        };

        _db.PayrollScenarios.Add(scenario);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("PayrollScenario", scenario.Id, "Created", "system", $"Scenario '{dto.Name}' created");

        return scenario;
    }

    public async Task<PayrollScenario> CalculateScenario(int scenarioId)
    {
        var scenario = await _db.PayrollScenarios.FindAsync(scenarioId);
        if (scenario == null) throw new ArgumentException("Scenario not found");

        var baseline = await CalculateBaselineCost(scenario.FinancialYearId);
        scenario.TotalBaselineCost = baseline;

        var posts = await _db.PostEstablishments
            .Where(p => p.FinancialYearId == scenario.FinancialYearId && p.IsActive)
            .ToListAsync();

        decimal filledPostCost = posts.Where(p => p.Status == PostStatus.Filled).Sum(p => p.TotalCostToMunicipality);
        decimal vacantPostCost = posts.Where(p => p.Status == PostStatus.Vacant).Sum(p => p.TotalCostToMunicipality);

        decimal adjustedFilledCost = filledPostCost * (1 + scenario.SalaryIncreasePercent / 100);
        decimal adjustedVacantCost = vacantPostCost * (scenario.VacancyFillingPercent / 100);

        var variableBenefits = await _db.VariableBenefitHours
            .Where(v => v.FinancialYearId == scenario.FinancialYearId)
            .SumAsync(v => v.CalculatedCost);
        decimal adjustedVariable = variableBenefits * (1 + (scenario.OvertimeAdjustmentPercent ?? 0) / 100);

        var travelCosts = await _db.TravelRequirements
            .Where(t => t.FinancialYearId == scenario.FinancialYearId)
            .SumAsync(t => t.EstimatedCost);
        decimal adjustedTravel = travelCosts * (1 + (scenario.TravelAdjustmentPercent ?? 0) / 100);

        var councillorCosts = await _db.CouncillorPositions
            .Where(c => c.FinancialYearId == scenario.FinancialYearId)
            .SumAsync(c => c.AdjustedTotalRemuneration);

        var wardCosts = await _db.WardCommitteeBudgets
            .Where(w => w.FinancialYearId == scenario.FinancialYearId)
            .SumAsync(w => w.TotalEstimatedCost);

        var bonusCosts = await _db.PerformanceBonuses
            .Where(b => b.FinancialYearId == scenario.FinancialYearId)
            .SumAsync(b => b.EstimatedTotalCost);

        decimal benefitAdjustment = (councillorCosts + wardCosts + bonusCosts) * (scenario.BenefitAdjustmentPercent / 100);

        scenario.TotalScenarioCost = Math.Round(adjustedFilledCost + adjustedVacantCost + adjustedVariable + adjustedTravel + councillorCosts + wardCosts + bonusCosts + benefitAdjustment, 2);
        scenario.VarianceAmount = Math.Round(scenario.TotalScenarioCost - scenario.TotalBaselineCost, 2);
        scenario.VariancePercent = scenario.TotalBaselineCost != 0
            ? Math.Round(scenario.VarianceAmount / scenario.TotalBaselineCost * 100, 2)
            : 0;
        scenario.Status = HrBudgetStatus.Calculated;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("PayrollScenario", scenario.Id, "Calculated", "system", $"Scenario calculated: baseline={scenario.TotalBaselineCost}, scenario={scenario.TotalScenarioCost}");

        return scenario;
    }

    public async Task<PayrollScenarioComparisonDto> CompareScenarios(int financialYearId)
    {
        var scenarios = await _db.PayrollScenarios
            .Where(s => s.FinancialYearId == financialYearId)
            .ToListAsync();

        var baseline = await CalculateBaselineCost(financialYearId);

        var scenarioDtos = scenarios.Select(s => new PayrollScenarioDto(
            s.Id, s.Name, s.Description, s.SalaryIncreasePercent, s.VacancyFillingPercent,
            s.BenefitAdjustmentPercent, s.OvertimeAdjustmentPercent, s.TravelAdjustmentPercent,
            s.TotalBaselineCost, s.TotalScenarioCost, s.VarianceAmount, s.VariancePercent,
            s.Status.ToString(), s.FinancialYearId, s.CreatedBy, s.CreatedOn, s.ApprovedBy, s.ApprovedOn
        )).ToList();

        var costBreakdowns = new List<ScenarioCostBreakdownDto>();

        foreach (var scenario in scenarios)
        {
            var posts = await _db.PostEstablishments
                .Where(p => p.FinancialYearId == financialYearId && p.IsActive)
                .ToListAsync();

            decimal basicSalary = posts.Sum(p => p.AnnualSalary) * (1 + scenario.SalaryIncreasePercent / 100);
            decimal employerContribs = basicSalary * 0.20m;

            var variableBenefits = await _db.VariableBenefitHours
                .Where(v => v.FinancialYearId == financialYearId)
                .SumAsync(v => v.CalculatedCost);
            decimal adjustedVariable = variableBenefits * (1 + (scenario.OvertimeAdjustmentPercent ?? 0) / 100);

            var travelCosts = await _db.TravelRequirements
                .Where(t => t.FinancialYearId == financialYearId)
                .SumAsync(t => t.EstimatedCost);
            decimal adjustedTravel = travelCosts * (1 + (scenario.TravelAdjustmentPercent ?? 0) / 100);

            var councillorCosts = await _db.CouncillorPositions
                .Where(c => c.FinancialYearId == financialYearId)
                .SumAsync(c => c.AdjustedTotalRemuneration);

            var wardCosts = await _db.WardCommitteeBudgets
                .Where(w => w.FinancialYearId == financialYearId)
                .SumAsync(w => w.TotalEstimatedCost);

            var bonusCosts = await _db.PerformanceBonuses
                .Where(b => b.FinancialYearId == financialYearId)
                .SumAsync(b => b.EstimatedTotalCost);

            decimal totalCost = basicSalary + employerContribs + adjustedVariable + adjustedTravel + councillorCosts + wardCosts + bonusCosts;

            costBreakdowns.Add(new ScenarioCostBreakdownDto(
                scenario.Id, scenario.Name,
                Math.Round(basicSalary, 2), 0,
                Math.Round(employerContribs, 2),
                Math.Round(adjustedVariable, 2),
                Math.Round(adjustedTravel, 2),
                Math.Round(bonusCosts, 2),
                Math.Round(councillorCosts, 2),
                Math.Round(wardCosts, 2),
                Math.Round(totalCost, 2),
                Math.Round(totalCost - baseline, 2),
                baseline != 0 ? Math.Round((totalCost - baseline) / baseline * 100, 2) : 0
            ));
        }

        return new PayrollScenarioComparisonDto(scenarioDtos, baseline, costBreakdowns);
    }

    private async Task<decimal> CalculateBaselineCost(int financialYearId)
    {
        var postCosts = await _db.PostEstablishments
            .Where(p => p.FinancialYearId == financialYearId && p.IsActive)
            .SumAsync(p => p.TotalCostToMunicipality);

        var variableCosts = await _db.VariableBenefitHours
            .Where(v => v.FinancialYearId == financialYearId)
            .SumAsync(v => v.CalculatedCost);

        var travelCosts = await _db.TravelRequirements
            .Where(t => t.FinancialYearId == financialYearId)
            .SumAsync(t => t.EstimatedCost);

        var councillorCosts = await _db.CouncillorPositions
            .Where(c => c.FinancialYearId == financialYearId)
            .SumAsync(c => c.AdjustedTotalRemuneration);

        var wardCosts = await _db.WardCommitteeBudgets
            .Where(w => w.FinancialYearId == financialYearId)
            .SumAsync(w => w.TotalEstimatedCost);

        var bonusCosts = await _db.PerformanceBonuses
            .Where(b => b.FinancialYearId == financialYearId)
            .SumAsync(b => b.EstimatedTotalCost);

        return postCosts + variableCosts + travelCosts + councillorCosts + wardCosts + bonusCosts;
    }
}
