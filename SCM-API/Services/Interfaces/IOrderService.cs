using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IOrderService
{
    Task<object?> GetByIdAsync(int id);
    Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, int? vendorId, string? search, int page, int pageSize);
    Task<object> CreateAsync(object dto);
    Task<bool> UpdateAsync(int id, object dto);
    Task<bool> ApproveAsync(int id, object dto);
    Task<bool> VoidAsync(int id, string reason, int userId);
    Task<object> GetOrderDetailsAsync(int orderId);
    Task<bool> ForwardToVendorAsync(int orderId);
    Task<object> GetOrderSplitDetailsAsync(int orderId);
    Task<bool> CessionAsync(int orderId, object cessionDto);
    Task<bool> DeclineAsync(int id, string? reason = null);
    Task<bool> SubmitAsync(int id);
    int CreateFromQuotation(string quotationRef, string requisitionRef, string demandPlanRef, string department, string supplierName, int bbbeeLevel, decimal totalValue, string financialYear, string voteNumber, string contactPerson, object[]? lineItems = null);
    List<Dictionary<string, object?>> GetByQuotationRef(string quotationRef);
    Dictionary<string, object?>? GetByOrderNumber(string orderNumber);
}
