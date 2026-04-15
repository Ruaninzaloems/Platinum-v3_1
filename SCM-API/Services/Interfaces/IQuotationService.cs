using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IQuotationService
{
    Task<object?> GetByIdAsync(int id);
    Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
    Task<object> CreateAsync(object dto);
    Task<bool> UpdateAsync(int id, object dto);
    Task<bool> DeleteAsync(int id);
    Task<object> GetServiceDetailsAsync(int quotationId);
    Task<object> GetQuotationVendorsAsync(int quotationId);
    Task<bool> AwardAsync(int quotationId, object awardDto);
    Task<object> GetEvaluationAsync(int quotationId);
    Task<bool> SubmitAsync(int id);
    Task<bool> PublishAsync(int id);
    Task<bool> ApproveAsync(int id, object dto);
    int CreateFromRequisition(string requisitionRef, string demandPlanRef, string title, string description, string department, decimal estimatedValue, string financialYear, string voteNumber, string serviceType, string contactPerson, object[]? lineItems = null, string? category = null, string? scoring = null, int? minQuotes = null, int? advertDays = null);
    List<Dictionary<string, object?>> GetByRequisitionRef(string requisitionRef);
    Dictionary<string, object?>? GetQuotationData(int id);
    Task<object> GetVendorRotationAsync(string? category);
    Task<bool> RecordVendorInvitationAsync(int quotationId, string vendorId, string category);
    Task<object?> CreateDeviationAsync(int quotationId, string reason, string motivatedBy);
    Task<object> GetDeviationsAsync(int quotationId);
}
