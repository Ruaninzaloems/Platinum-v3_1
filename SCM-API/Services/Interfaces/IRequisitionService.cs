using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IRequisitionService
{
    Task<object?> GetByIdAsync(int id);
    Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, int? departmentId, string? search, int page, int pageSize);
    Task<object> CreateAsync(object dto);
    Task<bool> UpdateAsync(int id, object dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> ApproveAsync(int id, object dto);
    Task<bool> SubmitAsync(int id);
    Task<object> GetServiceDetailsAsync(int requisitionId);
    Task<object> GetDocumentsAsync(int requisitionId);
    Task<object> GetApprovalHistoryAsync(int requisitionId);
    Task<object> GetBillOfQuantityAsync(int requisitionId);
    Task<bool> RouteAsync(int id, object routingDto);
    Task<bool> AmendAsync(int id, object amendDto);
    Task<bool> ReturnAsync(int id, object returnDto);
    Task<object> GetDeviationsAsync(int requisitionId);
    int CreateFromDemandPlan(string demandPlanRef, string department, int departmentId, string description, decimal estimatedValue, string requestedBy, string financialYear, string voteNumber, string procurementRoute, string priority, object[]? lineItems = null);
    List<Dictionary<string, object?>> GetByDemandPlanRef(string demandPlanRef);
}
