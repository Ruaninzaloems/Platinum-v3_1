using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class AiInsightsService
{
    private readonly BudgetDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public AiInsightsService(BudgetDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task<AiAnalyticsDto> GetAiAnalyticsAsync(int? financialYearId = null)
    {
        var versions = _db.BudgetVersions
            .Include(v => v.BudgetStrings).ThenInclude(s => s.ScoaItem)
            .Include(v => v.BudgetStrings).ThenInclude(s => s.ScoaFunction)
            .Include(v => v.BudgetStrings).ThenInclude(s => s.Project).ThenInclude(p => p!.Department)
            .AsQueryable();
        if (financialYearId.HasValue) versions = versions.Where(v => v.FinancialYearId == financialYearId.Value);

        var allVersions = await versions.ToListAsync();
        var activeVersion = allVersions.FirstOrDefault(v => v.Status == BudgetVersionStatus.ActiveForImplementation)
            ?? allVersions.FirstOrDefault(v => v.Status == BudgetVersionStatus.Locked)
            ?? allVersions.FirstOrDefault(v => v.Status == BudgetVersionStatus.Approved)
            ?? allVersions.OrderByDescending(v => v.BudgetStrings.Count).FirstOrDefault();
        var allStrings = activeVersion?.BudgetStrings.ToList() ?? new List<BudgetString>();

        var revenueItemCodes = new[] { "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000" };
        var capitalItemCodes = new[] { "7000", "8000" };

        var totalY1 = allStrings.Sum(s => s.Year1Amount);
        var totalY2 = allStrings.Sum(s => s.Year2Amount);
        var totalY3 = allStrings.Sum(s => s.Year3Amount);
        var revenueY1 = allStrings.Where(s => revenueItemCodes.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
        var revenueY2 = allStrings.Where(s => revenueItemCodes.Contains(s.ScoaItem.Code)).Sum(s => s.Year2Amount);
        var capitalY1 = allStrings.Where(s => capitalItemCodes.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
        var expenditureY1 = totalY1 - revenueY1;

        var insights = new List<AiInsightDto>();
        var risks = new List<RiskItemDto>();
        var opportunities = new List<OpportunityDto>();
        decimal healthScore = 70;

        if (revenueY1 > 0 && expenditureY1 > 0)
        {
            var coverageRatio = revenueY1 / expenditureY1 * 100;
            if (coverageRatio < 100)
            {
                insights.Add(new AiInsightDto("Revenue", "warning", "Revenue Gap Detected",
                    $"Revenue covers only {coverageRatio:F1}% of expenditure. The municipality has a funding shortfall of {FormatCurrency(expenditureY1 - revenueY1)}.",
                    "warning", coverageRatio,
                    "Consider reviewing tariff structures and exploring additional revenue streams such as development charges and agency fees."));
                risks.Add(new RiskItemDto("Revenue Shortfall", $"Current revenue of {FormatCurrency(revenueY1)} does not fully cover expenditure of {FormatCurrency(expenditureY1)}.", "High", "May require emergency adjustments or service cuts"));
                healthScore -= 15;
            }
            else
            {
                insights.Add(new AiInsightDto("Revenue", "check_circle", "Revenue Position Healthy",
                    $"Revenue covers {coverageRatio:F1}% of expenditure with a surplus of {FormatCurrency(revenueY1 - expenditureY1)}.",
                    "success", coverageRatio, null));
                healthScore += 5;
            }
        }

        if (capitalY1 > 0 && totalY1 > 0)
        {
            var capitalRatio = capitalY1 / totalY1 * 100;
            if (capitalRatio < 10)
            {
                insights.Add(new AiInsightDto("Capital", "construction", "Low Capital Investment",
                    $"Capital expenditure at {capitalRatio:F1}% of total budget ({FormatCurrency(capitalY1)}) is below the NT guideline of 10-20%.",
                    "warning", capitalRatio,
                    "NT recommends municipalities allocate 10-20% of budget to infrastructure. Consider increasing capital allocations for infrastructure renewal."));
                risks.Add(new RiskItemDto("Infrastructure Backlog", "Capital investment below recommended levels may worsen infrastructure deterioration.", "Medium", "Long-term service delivery risks"));
                healthScore -= 5;
            }
            else if (capitalRatio > 30)
            {
                insights.Add(new AiInsightDto("Capital", "construction", "High Capital Concentration",
                    $"Capital expenditure at {capitalRatio:F1}% of total budget ({FormatCurrency(capitalY1)}) exceeds typical thresholds.",
                    "info", capitalRatio,
                    "Ensure adequate operational budget remains for service delivery and maintenance of new infrastructure."));
            }
            else
            {
                insights.Add(new AiInsightDto("Capital", "check_circle", "Capital Investment On Track",
                    $"Capital allocation of {FormatCurrency(capitalY1)} ({capitalRatio:F1}% of budget) aligns with NT infrastructure investment guidelines.",
                    "success", capitalRatio, null));
                healthScore += 5;
            }
        }

        if (totalY1 > 0 && totalY2 > 0 && totalY3 > 0)
        {
            var growthY1Y2 = (totalY2 - totalY1) / totalY1 * 100;
            var growthY2Y3 = (totalY3 - totalY2) / totalY2 * 100;
            var avgGrowth = (growthY1Y2 + growthY2Y3) / 2;

            insights.Add(new AiInsightDto("MTREF", "trending_up", "MTREF Growth Trajectory",
                $"Budget grows {growthY1Y2:F1}% in Year 2 and {growthY2Y3:F1}% in Year 3. Average annual growth: {avgGrowth:F1}%.",
                avgGrowth > 8 ? "warning" : "info", avgGrowth,
                avgGrowth > 8 ? "Growth exceeds typical CPI+2% targets. Review assumptions for sustainability." : "Growth rate appears sustainable within CPI inflation bands."));

            if (avgGrowth > 8)
            {
                risks.Add(new RiskItemDto("Above-Inflation Growth", $"Budget growth of {avgGrowth:F1}% may not be sustainable.", "Medium", "Revenue collection may not keep pace with expenditure growth"));
            }

            if (revenueY2 > 0)
            {
                var revGrowthY1Y2 = (revenueY2 - revenueY1) / revenueY1 * 100;
                var expGrowthY1Y2 = totalY2 > revenueY2 ? ((totalY2 - revenueY2) - expenditureY1) / expenditureY1 * 100 : 0;
                if (expGrowthY1Y2 > revGrowthY1Y2 + 2)
                {
                    insights.Add(new AiInsightDto("Sustainability", "warning", "Expenditure Outpacing Revenue",
                        $"Expenditure growing at {expGrowthY1Y2:F1}% vs revenue at {revGrowthY1Y2:F1}%. Gap widening over MTREF period.",
                        "warning", expGrowthY1Y2 - revGrowthY1Y2,
                        "Align expenditure growth closer to revenue growth to maintain fiscal sustainability."));
                    healthScore -= 10;
                }
            }
        }

        var byFunction = allStrings.GroupBy(s => s.ScoaFunction.Description)
            .Select(g => new { Function = g.Key, Y1 = g.Sum(s => s.Year1Amount) })
            .OrderByDescending(f => f.Y1).ToList();

        if (byFunction.Count > 1)
        {
            var topFunction = byFunction.First();
            var topPercent = totalY1 > 0 ? topFunction.Y1 / totalY1 * 100 : 0;
            if (topPercent > 40)
            {
                insights.Add(new AiInsightDto("Concentration", "pie_chart", "Budget Concentration Risk",
                    $"{topFunction.Function} consumes {topPercent:F1}% of total budget ({FormatCurrency(topFunction.Y1)}). High concentration in a single function.",
                    "warning", topPercent,
                    "Consider whether this concentration is proportional to service delivery requirements. Diversification may reduce fiscal risk."));
                risks.Add(new RiskItemDto("Function Concentration", $"{topFunction.Function} dominates budget allocation.", "Low", "Reduced flexibility for reallocation"));
            }
        }

        var pendingApprovals = await _db.BudgetVersions.CountAsync(v => v.Status == BudgetVersionStatus.Pending);
        var validationErrors = await _db.ValidationResults.CountAsync(r => r.Status == ValidationStatus.Error);
        var virementCount = await _db.VirementRequests.CountAsync();

        if (pendingApprovals > 0)
        {
            insights.Add(new AiInsightDto("Workflow", "pending_actions", "Pending Approvals",
                $"{pendingApprovals} budget version(s) awaiting approval. Delays may impact implementation timelines.",
                "info", pendingApprovals,
                "Process pending approvals to maintain budget cycle compliance."));
        }

        if (validationErrors > 0)
        {
            insights.Add(new AiInsightDto("Compliance", "gpp_bad", "Validation Errors Outstanding",
                $"{validationErrors} validation error(s) require attention. Unresolved errors may block version approval.",
                "error", validationErrors,
                "Review and resolve validation errors before submitting for approval."));
            healthScore -= 5;
        }

        if (virementCount > 0)
        {
            insights.Add(new AiInsightDto("Virements", "swap_horiz", "Budget Transfers Active",
                $"{virementCount} virement(s) processed. Active transfers indicate budget reallocation activity.",
                "info", virementCount, null));
        }

        var stringsWithDept = allStrings.Where(s => s.Project?.Department != null).ToList();
        var unallocated = allStrings.Where(s => s.Project?.Department == null).Sum(s => s.Year1Amount);
        if (totalY1 > 0 && unallocated > 0)
        {
            var unallocatedPct = unallocated / totalY1 * 100;
            if (unallocatedPct > 20)
            {
                opportunities.Add(new OpportunityDto("Department Allocation", $"{FormatCurrency(unallocated)} ({unallocatedPct:F1}%) is not allocated to specific departments.", "Improved accountability and tracking", unallocated * 0.05m));
            }
        }

        if (capitalY1 > 0)
        {
            var capitalMaintRatio = 0.08m;
            var maintBudget = capitalY1 * capitalMaintRatio;
            opportunities.Add(new OpportunityDto("Maintenance Planning", "Allocate 6-8% of asset value annually for preventive maintenance to extend infrastructure lifecycle.", "Reduced emergency repair costs", maintBudget));
        }

        if (revenueY1 > 0)
        {
            var collectionRate = 0.92m;
            var potentialRevenue = revenueY1 * (1 - collectionRate);
            opportunities.Add(new OpportunityDto("Revenue Enhancement", $"Improving collection rates from 92% to 95% could yield additional {FormatCurrency(potentialRevenue * 0.03m / (1 - collectionRate))} annually.", "Increased revenue without tariff increases", potentialRevenue * 0.03m / (1 - collectionRate)));
        }

        healthScore = Math.Clamp(healthScore, 0, 100);

        string overallRating = healthScore >= 80 ? "Good" : healthScore >= 60 ? "Fair" : healthScore >= 40 ? "Needs Attention" : "Critical";
        string overallSummary = healthScore >= 80
            ? $"The municipality's budget of {FormatCurrency(totalY1)} demonstrates sound fiscal planning with adequate revenue coverage and balanced MTREF projections."
            : healthScore >= 60
            ? $"The budget of {FormatCurrency(totalY1)} shows areas requiring attention. Revenue-expenditure alignment and growth sustainability should be monitored."
            : $"The budget of {FormatCurrency(totalY1)} has significant fiscal risks that require immediate intervention. Revenue shortfalls and compliance gaps need resolution.";

        string? aiNarrative = null;
        try
        {
            aiNarrative = await GenerateAiNarrative(totalY1, revenueY1, expenditureY1, capitalY1, totalY2, totalY3, insights, risks);
        }
        catch { }

        return new AiAnalyticsDto(insights, overallRating, overallSummary, healthScore, risks, opportunities, aiNarrative);
    }

    private async Task<string?> GenerateAiNarrative(decimal totalBudget, decimal revenue, decimal expenditure, decimal capital, decimal y2Total, decimal y3Total, List<AiInsightDto> insights, List<RiskItemDto> risks)
    {
        var baseUrl = Environment.GetEnvironmentVariable("AI_INTEGRATIONS_OPENAI_BASE_URL");
        var apiKey = Environment.GetEnvironmentVariable("AI_INTEGRATIONS_OPENAI_API_KEY");

        if (string.IsNullOrEmpty(baseUrl) || string.IsNullOrEmpty(apiKey)) return null;

        var client = _httpClientFactory.CreateClient();
        client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

        var insightSummary = string.Join("; ", insights.Select(i => $"{i.Title}: {i.Description}"));
        var riskSummary = string.Join("; ", risks.Select(r => $"{r.Title} ({r.Severity}): {r.Description}"));

        var prompt = $@"You are a municipal finance advisor analyzing a South African local government budget. Provide a concise 3-4 sentence CFO-level narrative summary.

Budget Data:
- Total Budget: R{totalBudget:N0}
- Revenue: R{revenue:N0}
- Expenditure: R{expenditure:N0}
- Capital: R{capital:N0}
- Year 2 Total: R{y2Total:N0}
- Year 3 Total: R{y3Total:N0}

Key Insights: {insightSummary}
Risks: {riskSummary}

Write a professional CFO briefing paragraph. Include specific Rand amounts. Reference MFMA compliance where relevant.";

        var requestBody = new
        {
            model = "gpt-5-nano",
            messages = new[] { new { role = "user", content = prompt } },
            max_completion_tokens = 300
        };

        var response = await client.PostAsJsonAsync("chat/completions", requestBody);
        if (!response.IsSuccessStatusCode) return null;

        var result = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        return result.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
    }

    private static string FormatCurrency(decimal value) =>
        $"R {Math.Abs(value):N0}";
}
