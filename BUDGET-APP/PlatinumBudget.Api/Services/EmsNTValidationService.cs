using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class EmsValidationResult
{
    public int RuleId { get; set; }
    public string RuleDesc { get; set; } = "";
    public string Severity { get; set; } = "Error";
    public int? ProjectId { get; set; }
    public int? ProjectCode { get; set; }
    public string? ProjectName { get; set; }
    public int? PlanProjectItemId { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaFundCode { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string Message { get; set; } = "";
}

public class EmsNTValidationSummaryDto
{
    public int VersionId { get; set; }
    public string? FinYear { get; set; }
    public int TotalChecked { get; set; }
    public int Errors { get; set; }
    public int Warnings { get; set; }
    public int Passed { get; set; }
    public List<EmsValidationResult> Results { get; set; } = [];
}

public class EmsNTValidationService
{
    private readonly BudgetDbContext _db;

    public EmsNTValidationService(BudgetDbContext db)
    {
        _db = db;
    }

    public async Task<EmsNTValidationSummaryDto> ValidateBudgetVersionAsync(int versionId)
    {
        var version = await _db.Set<Plan_BudgetVersion>().FindAsync(versionId);
        var results = new List<EmsValidationResult>();

        var details = await _db.Set<Plan_BudgetVersionDetail>()
            .Where(d => d.BudgetVersionID == versionId)
            .ToListAsync();

        if (!details.Any())
        {
            return new EmsNTValidationSummaryDto
            {
                VersionId = versionId,
                Results = [new EmsValidationResult { RuleId = 0, RuleDesc = "No data", Severity = "Warning", Message = "No budget version details found for this version." }]
            };
        }

        var finYear = details.Select(d => d.FinYear).FirstOrDefault();
        var projectIds = details.Select(d => d.ProjectID).Distinct().ToList();
        var projects = await _db.Set<Plan_Project>()
            .Where(p => projectIds.Contains(p.Project_ID))
            .ToDictionaryAsync(p => p.Project_ID);

        var scoaItemIds = details.Select(d => d.SCOAItemID).Distinct().ToList();
        var scoaFundIds = details.Select(d => d.SCOAFundId).Distinct().ToList();
        var scoaFunctionIds = details.Select(d => d.SCOAFunctionId).Distinct().ToList();

        var scoaItems = await _db.ScoaItems.Where(s => scoaItemIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
        var scoaFunds = await _db.ScoaFunds.Where(s => scoaFundIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
        var scoaFunctions = await _db.ScoaFunctions.Where(s => scoaFunctionIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);

        foreach (var d in details)
        {
            projects.TryGetValue(d.ProjectID, out var proj);
            scoaItems.TryGetValue(d.SCOAItemID, out var scoaItem);
            scoaFunds.TryGetValue(d.SCOAFundId, out var scoaFund);
            scoaFunctions.TryGetValue(d.SCOAFunctionId, out var scoaFunction);

            string? itemCode = scoaItem?.Code;
            string? fundCode = scoaFund?.Code;
            string? functionCode = scoaFunction?.Code;

            // Rule 1: Missing mandatory SCOA Item
            if (d.SCOAItemID == 0)
            {
                results.Add(new EmsValidationResult
                {
                    RuleId = 1, RuleDesc = "Missing SCOA Item", Severity = "Error",
                    ProjectId = d.ProjectID, ProjectCode = proj?.ProjectCode, ProjectName = proj?.ProjectName,
                    PlanProjectItemId = d.PlanProjectItemID, ScoaFundCode = fundCode, ScoaFunctionCode = functionCode,
                    Message = $"Budget line has no SCOA Item assigned (Project: {proj?.ProjectName ?? d.ProjectID.ToString()})"
                });
            }

            // Rule 2: Missing SCOA Fund
            if (d.SCOAFundId == 0)
            {
                results.Add(new EmsValidationResult
                {
                    RuleId = 2, RuleDesc = "Missing SCOA Fund", Severity = "Error",
                    ProjectId = d.ProjectID, ProjectCode = proj?.ProjectCode, ProjectName = proj?.ProjectName,
                    PlanProjectItemId = d.PlanProjectItemID, ScoaItemCode = itemCode,
                    Message = $"Budget line has no SCOA Fund assigned (Project: {proj?.ProjectName ?? d.ProjectID.ToString()})"
                });
            }

            // Rule 3: Missing SCOA Function
            if (d.SCOAFunctionId == 0)
            {
                results.Add(new EmsValidationResult
                {
                    RuleId = 3, RuleDesc = "Missing SCOA Function", Severity = "Error",
                    ProjectId = d.ProjectID, ProjectCode = proj?.ProjectCode, ProjectName = proj?.ProjectName,
                    PlanProjectItemId = d.PlanProjectItemID, ScoaItemCode = itemCode,
                    Message = $"Budget line has no SCOA Function assigned (Project: {proj?.ProjectName ?? d.ProjectID.ToString()})"
                });
            }

            // Rule 4: Zero budget amount warning
            if ((d.BudgetAmount ?? 0) == 0 && (d.BudgetAmountCurP1 ?? 0) == 0 && (d.BudgetAmountCurP2 ?? 0) == 0)
            {
                results.Add(new EmsValidationResult
                {
                    RuleId = 4, RuleDesc = "Zero Budget Amount", Severity = "Warning",
                    ProjectId = d.ProjectID, ProjectCode = proj?.ProjectCode, ProjectName = proj?.ProjectName,
                    PlanProjectItemId = d.PlanProjectItemID, ScoaItemCode = itemCode, ScoaFundCode = fundCode,
                    Message = $"Budget line has zero budget for all 3 years (Item: {itemCode ?? "N/A"})"
                });
            }

            // Rule 5: Negative budget amount error
            if ((d.BudgetAmount ?? 0) < 0 || (d.BudgetAmountCurP1 ?? 0) < 0 || (d.BudgetAmountCurP2 ?? 0) < 0)
            {
                results.Add(new EmsValidationResult
                {
                    RuleId = 5, RuleDesc = "Negative Budget Amount", Severity = "Error",
                    ProjectId = d.ProjectID, ProjectCode = proj?.ProjectCode, ProjectName = proj?.ProjectName,
                    PlanProjectItemId = d.PlanProjectItemID, ScoaItemCode = itemCode,
                    Message = $"Budget line has a negative budget amount (Item: {itemCode ?? "N/A"})"
                });
            }
        }

        // Rule 6: Revenue vs Expenditure balance per SCOA Function
        var byFunction = details.GroupBy(d => d.SCOAFunctionId);
        foreach (var group in byFunction)
        {
            if (group.Key == 0) continue;
            scoaFunctions.TryGetValue(group.Key, out var fn);
            var revenueItems = group.Where(d =>
            {
                scoaItems.TryGetValue(d.SCOAItemID, out var si);
                return si?.Code?.StartsWith("IR") == true || si?.Code?.StartsWith("IA") == true;
            });
            var expenditureItems = group.Where(d =>
            {
                scoaItems.TryGetValue(d.SCOAItemID, out var si);
                return si?.Code?.StartsWith("IE") == true || si?.Code?.StartsWith("IL") == true || si?.Code?.StartsWith("IZ") == true;
            });

            var totalRevenue = revenueItems.Sum(d => d.BudgetAmount ?? 0);
            var totalExpenditure = expenditureItems.Sum(d => d.BudgetAmount ?? 0);

            if (totalRevenue > 0 && totalExpenditure == 0)
            {
                results.Add(new EmsValidationResult
                {
                    RuleId = 6, RuleDesc = "Revenue without Expenditure", Severity = "Warning",
                    ScoaFunctionCode = fn?.Code,
                    Message = $"SCOA Function '{fn?.Code ?? group.Key.ToString()}' has revenue ({totalRevenue:C0}) but no corresponding expenditure items"
                });
            }
        }

        // Rule 7: Capital project must have Capital fund code
        var capitalProjects = details.Where(d =>
        {
            projects.TryGetValue(d.ProjectID, out var p);
            return p?.CapitalOperation == 1;
        });

        foreach (var d in capitalProjects)
        {
            scoaFunds.TryGetValue(d.SCOAFundId, out var sf);
            if (sf != null && !sf.Code.StartsWith("CG") && !sf.Code.StartsWith("CF") && !sf.Code.StartsWith("CO"))
            {
                projects.TryGetValue(d.ProjectID, out var proj);
                results.Add(new EmsValidationResult
                {
                    RuleId = 7, RuleDesc = "Capital Project with Non-Capital Fund", Severity = "Warning",
                    ProjectId = d.ProjectID, ProjectCode = proj?.ProjectCode, ProjectName = proj?.ProjectName,
                    ScoaFundCode = sf.Code,
                    Message = $"Capital project '{proj?.ProjectName}' uses fund code '{sf.Code}' which may not be a capital fund"
                });
            }
        }

        // Rule 8: Duplicate SCOA segment combination per project
        var byProjectAndScoa = details
            .GroupBy(d => new { d.ProjectID, d.SCOAItemID, d.SCOAFundId, d.SCOAFunctionId, d.SCOARegionId });
        foreach (var group in byProjectAndScoa.Where(g => g.Count() > 1))
        {
            projects.TryGetValue(group.Key.ProjectID, out var proj);
            scoaItems.TryGetValue(group.Key.SCOAItemID, out var si);
            results.Add(new EmsValidationResult
            {
                RuleId = 8, RuleDesc = "Duplicate SCOA Combination", Severity = "Warning",
                ProjectId = group.Key.ProjectID, ProjectCode = proj?.ProjectCode, ProjectName = proj?.ProjectName,
                ScoaItemCode = si?.Code,
                Message = $"Project '{proj?.ProjectName}' has {group.Count()} duplicate budget lines for the same SCOA segment combination (Item: {si?.Code})"
            });
        }

        var totalChecked = details.Count;
        return new EmsNTValidationSummaryDto
        {
            VersionId = versionId,
            FinYear = finYear,
            TotalChecked = totalChecked,
            Errors = results.Count(r => r.Severity == "Error"),
            Warnings = results.Count(r => r.Severity == "Warning"),
            Passed = totalChecked - results.Select(r => r.PlanProjectItemId).Distinct().Count(),
            Results = results.OrderBy(r => r.Severity).ThenBy(r => r.RuleId).ToList()
        };
    }
}
