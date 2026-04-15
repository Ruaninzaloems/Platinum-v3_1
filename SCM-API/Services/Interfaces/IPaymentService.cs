using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IPaymentService
{
    Task<object?> GetByIdAsync(int id);
    Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, string? search, int page, int pageSize);
    Task<object> CreateAsync(object dto);
    Task<bool> ApproveAsync(int id, object dto);
    Task<object> GetPaymentBatchesAsync(string? financialYear, int page, int pageSize);
    Task<object> GetPaymentDetailsAsync(int paymentId);
    Task<bool> ProcessBatchAsync(int batchId);
    Task<bool> SubmitAsync(int id);

    Task<Dictionary<string, object?>?> GetBatchDictAsync(string id);
    Task<ICollection<Dictionary<string, object?>>> GetAllBatchDictsAsync();
    Task SaveBatchDictAsync(string id, Dictionary<string, object?> batch);
    Task AddInvoiceDetailAsync(string batchId, int invoiceId, decimal amount);
    Task RemoveInvoiceDetailAsync(string batchId, int invoiceId);
    Task<bool> DeleteBatchDictAsync(string id);
    string AllocateNextBatchId();
    int AllocateNextBatchSeq();

    Task<(Dictionary<string, object?>? result, string? error)> SubmitBatchDictAsync(string id);
    Task<(Dictionary<string, object?>? result, string? error)> ApproveBatchDictAsync(string id, string? comments);
    Task<(Dictionary<string, object?>? result, string? error)> ProcessBatchDictAsync(string id);
    Task<(Dictionary<string, object?>? result, string? error)> VoidBatchDictAsync(string id);
    Task<(Dictionary<string, object?>? result, string? error)> ReverseBatchDictAsync(string id, string? reason, string? reversalDate);
    Task<(Dictionary<string, object?>? result, string? error)> CancelBatchDictAsync(string id, string? reason);
    Task<(Dictionary<string, object?>? result, string? error)> GenerateEftDictAsync(string id);

    Task<Dictionary<string, object?>> GetBankConfigAsync();
    Task<Dictionary<string, object?>?> GetRemittanceDictAsync(string id);
    Task<ICollection<Dictionary<string, object?>>> GetAllRemittanceDictsAsync();
    Task SaveRemittanceDictAsync(string id, Dictionary<string, object?> rem);
    Task<Dictionary<string, object?>?> GetReconMatchDictAsync(string id);
    Task SaveReconMatchDictAsync(string id, Dictionary<string, object?> match);
    Task<List<Dictionary<string, object?>>?> GetBatchDocumentsDictAsync(string batchId);
    Task SaveBatchDocumentsDictAsync(string batchId, List<Dictionary<string, object?>> docs);
    int AllocateNextRemittanceId();
    int AllocateNextDocId();
}
