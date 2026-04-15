using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IBudgetIntegrationService
{
    Task<object> CheckBudgetAvailabilityAsync(string voteNumber, decimal amount, string financialYear);
    Task<object> GetBudgetSummaryAsync(string? financialYear, int? departmentId);
    Task<bool> ReserveBudgetAsync(object reservationDto);
    Task<bool> ReleaseBudgetAsync(int reservationId);
    Task<object> GetVoteBalancesAsync(string financialYear, int? departmentId);
}
