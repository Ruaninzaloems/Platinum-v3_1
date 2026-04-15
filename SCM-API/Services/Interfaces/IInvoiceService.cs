using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IInvoiceService
{
    Task<Dictionary<string, object?>?> GetInvoiceDictAsync(int id);
    Task<ICollection<Dictionary<string, object?>>> GetAllInvoiceDictsAsync();
    Task SaveInvoiceDictAsync(int id, Dictionary<string, object?> invoice);
    Task<bool> DeleteInvoiceDictAsync(int id);
    int AllocateNextId();

    Task<(Dictionary<string, object?>? result, string? error)> CreateInvoiceDictAsync(Dictionary<string, object?> data);
    Task<(Dictionary<string, object?>? result, string? error)> UpdateInvoiceDictAsync(int id, Dictionary<string, object?> updates);
    Task<(Dictionary<string, object?>? result, string? error)> SubmitInvoiceDictAsync(int id);
    Task<(Dictionary<string, object?>? result, string? error)> VerifyInvoiceDictAsync(int id);
    Task<(Dictionary<string, object?>? result, string? error)> ApproveInvoiceDictAsync(int id);
    Task<(Dictionary<string, object?>? result, string? error)> RejectInvoiceDictAsync(int id, string? reason);
    Task<(Dictionary<string, object?>? result, string? error)> VoidInvoiceDictAsync(int id, string? reason);
    Task<(Dictionary<string, object?>? result, string? error)> MarkPaidDictAsync(int id);
    Task<(Dictionary<string, object?>? result, string? error)> HoldInvoiceDictAsync(int id);
    Task<(Dictionary<string, object?>? result, string? error)> ReleaseHoldDictAsync(int id);
    Task<(Dictionary<string, object?>? result, string? error)> DisputeInvoiceDictAsync(int id, string? reason);
    Task<(Dictionary<string, object?>? result, string? error)> RunMatchDictAsync(int id);

    Task<object?> GetByIdAsync(int id);
    Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
    Task<object> CreateAsync(object dto);
    Task<bool> UpdateAsync(int id, object dto);
    Task<object> GetInvoiceDetailsAsync(int invoiceId);
    Task<bool> ApproveAsync(int id, object dto);
    Task<bool> SubmitAsync(int id);
    Task<object> GetInvoiceByOrderAsync(int orderId);
    Task<bool> MatchAsync(int invoiceId);
}
