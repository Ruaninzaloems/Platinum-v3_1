using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class BudgetIntegrationService : IBudgetIntegrationService
{
    private readonly ILogger<BudgetIntegrationService> _logger;

    public BudgetIntegrationService(ILogger<BudgetIntegrationService> logger) { _logger = logger; }

    public async Task<object> CheckBudgetAvailabilityAsync(string voteNumber, decimal amount, string financialYear)
        => new { VoteNumber = voteNumber, Amount = amount, FinancialYear = financialYear, Available = true, Balance = 0m };

    public async Task<object> GetBudgetSummaryAsync(string? financialYear, int? departmentId)
        => new { FinancialYear = financialYear, TotalBudget = 0m, Committed = 0m, Spent = 0m, Available = 0m };

    public async Task<bool> ReserveBudgetAsync(object reservationDto) { return true; }
    public async Task<bool> ReleaseBudgetAsync(int reservationId) { return true; }

    public async Task<object> GetVoteBalancesAsync(string financialYear, int? departmentId)
        => new List<object>();
}
