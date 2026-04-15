using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IGovernanceService
{
    Task<object> GetComplianceCheckAsync(string entityType, int entityId);
    Task<object> GetDeviationsAsync(string? financialYear, int? statusId, int page, int pageSize);
    Task<object> CreateDeviationAsync(object dto);
    Task<bool> ApproveDeviationAsync(int deviationId, object dto);
    Task<object> GetRegulationsAsync();
    Task<object> GetThresholdsAsync();
    Task<object> GetScmPolicyAsync();
    Task<object> GetPreferentialProcurementAsync(string? financialYear);
    Task<object> GetBbbeeComplianceAsync(int vendorId);
}
