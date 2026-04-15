using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class ValidationService
{
    private readonly BudgetDbContext _db;

    public ValidationService(BudgetDbContext db)
    {
        _db = db;
    }

    public async Task<ValidationRunDto> ValidateVersionAsync(int versionId, string? userId = null)
    {
        var runId = Guid.NewGuid();
        var strings = await _db.BudgetStrings
            .Include(s => s.ScoaItem).Include(s => s.ScoaFund).Include(s => s.ScoaFunction)
            .Include(s => s.ScoaProjectNav).Include(s => s.ScoaRegion).Include(s => s.ScoaCosting).Include(s => s.ScoaMsc)
            .Where(s => s.BudgetVersionId == versionId)
            .ToListAsync();

        var results = new List<Models.ValidationResult>();

        foreach (var s in strings)
        {
            if (s.Year1Amount == 0 && s.Year2Amount == 0 && s.Year3Amount == 0)
            {
                results.Add(new Models.ValidationResult
                {
                    ValidationRunId = runId, BudgetVersionId = versionId, BudgetStringId = s.Id,
                    Status = ValidationStatus.Warning, RuleCode = "ZERO_BUDGET",
                    Message = $"Budget string {s.ScoaItem.Code}/{s.ScoaFund.Code} has zero amounts for all MTREF years",
                    SuggestedFix = "Review and enter budget amounts or remove the string",
                    UserId = userId
                });
            }

            var monthlyTotal = s.Month01 + s.Month02 + s.Month03 + s.Month04 + s.Month05 + s.Month06 +
                               s.Month07 + s.Month08 + s.Month09 + s.Month10 + s.Month11 + s.Month12;
            if (monthlyTotal > 0 && monthlyTotal != s.Year1Amount)
            {
                results.Add(new Models.ValidationResult
                {
                    ValidationRunId = runId, BudgetVersionId = versionId, BudgetStringId = s.Id,
                    Status = ValidationStatus.Error, RuleCode = "MONTHLY_MISMATCH",
                    Message = $"Monthly split total ({monthlyTotal:N2}) does not equal Year 1 amount ({s.Year1Amount:N2})",
                    SuggestedFix = "Adjust monthly amounts to match Year 1 total",
                    UserId = userId
                });
            }

            if (s.Year2Amount > 0 && s.Year1Amount > 0)
            {
                var growthY2 = (s.Year2Amount - s.Year1Amount) / s.Year1Amount * 100;
                if (Math.Abs(growthY2) > 30)
                {
                    results.Add(new Models.ValidationResult
                    {
                        ValidationRunId = runId, BudgetVersionId = versionId, BudgetStringId = s.Id,
                        Status = ValidationStatus.Warning, RuleCode = "HIGH_GROWTH_Y2",
                        Message = $"Year 2 growth rate ({growthY2:N1}%) exceeds 30% threshold",
                        SuggestedFix = "Review Year 2 estimates and document assumptions",
                        UserId = userId
                    });
                }
            }

            if (!s.ScoaItem.IsActive || !s.ScoaFund.IsActive || !s.ScoaFunction.IsActive)
            {
                results.Add(new Models.ValidationResult
                {
                    ValidationRunId = runId, BudgetVersionId = versionId, BudgetStringId = s.Id,
                    Status = ValidationStatus.Error, RuleCode = "INACTIVE_SEGMENT",
                    Message = "Budget string contains inactive mSCOA segment(s)",
                    SuggestedFix = "Replace inactive segments with valid active segments",
                    UserId = userId
                });
            }

            if (s.Year1Amount < 0)
            {
                results.Add(new Models.ValidationResult
                {
                    ValidationRunId = runId, BudgetVersionId = versionId, BudgetStringId = s.Id,
                    Status = ValidationStatus.Error, RuleCode = "NEGATIVE_AMOUNT",
                    Message = $"Budget string has negative Year 1 amount ({s.Year1Amount:N2})",
                    SuggestedFix = "Budget amounts should be positive; use appropriate item codes for revenue vs expenditure",
                    UserId = userId
                });
            }
        }

        foreach (var s in strings.Where(s => results.All(r => r.BudgetStringId != s.Id)))
        {
            results.Add(new Models.ValidationResult
            {
                ValidationRunId = runId, BudgetVersionId = versionId, BudgetStringId = s.Id,
                Status = ValidationStatus.Pass, RuleCode = "ALL_PASS",
                Message = "All validation rules passed", UserId = userId
            });
        }

        _db.ValidationResults.AddRange(results);
        await _db.SaveChangesAsync();

        var passed = results.Count(r => r.Status == ValidationStatus.Pass);
        var warnings = results.Count(r => r.Status == ValidationStatus.Warning);
        var errors = results.Count(r => r.Status == ValidationStatus.Error);

        return new ValidationRunDto(
            runId, versionId, strings.Count, passed, warnings, errors,
            results.Where(r => r.Status != ValidationStatus.Pass).Select(r => new ValidationResultDto(
                r.Id, r.BudgetStringId,
                r.BudgetString != null ? $"{r.BudgetString.ScoaItem.Code}/{r.BudgetString.ScoaFund.Code}" : null,
                r.Status.ToString(), r.RuleCode, r.Message, r.SuggestedFix, r.Timestamp
            )).ToList()
        );
    }

    public async Task<ValidationDashboardDto> GetDashboardAsync(int? versionId = null)
    {
        var query = _db.ValidationResults.AsQueryable();
        if (versionId.HasValue) query = query.Where(r => r.BudgetVersionId == versionId.Value);

        var all = await query.ToListAsync();
        var runs = all.GroupBy(r => r.ValidationRunId).ToList();

        var topFailures = all.Where(r => r.Status != ValidationStatus.Pass)
            .GroupBy(r => r.RuleCode)
            .Select(g => new RuleFailureDto(
                g.Key,
                g.First().Message.Length > 80 ? g.First().Message[..80] : g.First().Message,
                g.Count(),
                g.Any(r => r.Status == ValidationStatus.Error) ? "Error" : "Warning"
            ))
            .OrderByDescending(f => f.Count)
            .Take(10)
            .ToList();

        return new ValidationDashboardDto(
            runs.Count,
            all.Select(r => r.BudgetStringId).Distinct().Count(),
            all.Count(r => r.Status == ValidationStatus.Pass),
            all.Count(r => r.Status == ValidationStatus.Warning),
            all.Count(r => r.Status == ValidationStatus.Error),
            all.Count > 0 ? (decimal)all.Count(r => r.Status == ValidationStatus.Pass) / all.Count * 100 : 100,
            topFailures,
            runs.OrderByDescending(g => g.Max(r => r.Timestamp)).Take(10).Select(g => new ValidationTrendDto(
                g.Key, g.Max(r => r.Timestamp),
                g.Count(r => r.Status == ValidationStatus.Pass),
                g.Count(r => r.Status == ValidationStatus.Warning),
                g.Count(r => r.Status == ValidationStatus.Error)
            )).ToList()
        );
    }

    public CombinationValidationResultDto ValidateCombination(ValidateCombinationDto dto)
    {
        var warnings = new List<string>();
        var errors = new List<string>();

        if (!dto.ScoaItemId.HasValue) errors.Add("Item segment is required");
        if (!dto.ScoaFundId.HasValue) errors.Add("Fund segment is required");
        if (!dto.ScoaFunctionId.HasValue) errors.Add("Function segment is required");
        if (!dto.ScoaProjectId.HasValue) errors.Add("Project segment is required");
        if (!dto.ScoaRegionId.HasValue) errors.Add("Region segment is required");
        if (!dto.ScoaCostingId.HasValue) errors.Add("Costing segment is required");
        if (!dto.ScoaMscId.HasValue) errors.Add("MSC segment is required");

        return new CombinationValidationResultDto(errors.Count == 0, warnings, errors);
    }
}
