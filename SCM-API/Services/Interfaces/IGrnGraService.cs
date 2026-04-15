using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IGrnGraService
{
    Task<object?> GetByIdAsync(int id);
    Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, int? orderId, int page, int pageSize);
    Task<object> CreateAsync(object dto);
    Task<PagedResult<object>> GetGrasAsync(string? financialYear, int? statusId, int page, int pageSize);
    Task<object?> GetGraByIdAsync(int id);
    Task<object> CreateGraAsync(object dto);
    Task<bool> ApproveGrnAsync(int id, object dto);
    Task<bool> ApproveGraAsync(int id, object dto);
    Task<object> GetGrnDetailsAsync(int grnId);

    Task<Dictionary<string, object?>?> GetGrnDictAsync(int id);
    Task<ICollection<Dictionary<string, object?>>> GetAllGrnDictsAsync();
    Task SaveGrnDictAsync(int id, Dictionary<string, object?> grn);
    Task<bool> DeleteGrnDictAsync(int id);
    int AllocateNextGrnId();

    Task<(Dictionary<string, object?>? result, string? error)> CreateGrnDictAsync(Dictionary<string, object?> data);
    Task<(Dictionary<string, object?>? result, string? error)> SubmitGrnDictAsync(int id);
    Task<(Dictionary<string, object?>? result, string? error)> ApproveGrnDictAsync(int id);
    Task<(Dictionary<string, object?>? result, string? error)> VoidGrnDictAsync(int id);

    Task<Dictionary<string, object?>?> GetReturnDictAsync(int id);
    Task<ICollection<Dictionary<string, object?>>> GetAllReturnDictsAsync();
    Task SaveReturnDictAsync(int id, Dictionary<string, object?> ret);
    Task<bool> DeleteReturnDictAsync(int id);
    int AllocateNextReturnId();

    Task<(Dictionary<string, object?>? result, string? error)> CreateReturnDictAsync(int grnId, Dictionary<string, object?> data);
    Task<(Dictionary<string, object?>? result, string? error)> SubmitReturnDictAsync(int id);
    Task<(Dictionary<string, object?>? result, string? error)> ApproveReturnDictAsync(int id);
    Task<(Dictionary<string, object?>? result, string? error)> DeclineReturnDictAsync(int id, string? comment);

    Task<Dictionary<string, object?>?> GetGraDictAsync(int id);
    Task<ICollection<Dictionary<string, object?>>> GetAllGraDictsAsync();
    Task SaveGraDictAsync(int id, Dictionary<string, object?> gra);
    Task<bool> DeleteGraDictAsync(int id);
    int AllocateNextGraId();

    Task<(Dictionary<string, object?>? result, string? error)> CreateGraDictAsync(int returnId, string? description);

    Task<object> GetApprovalSetupAsync();
    Task<object> GetServiceEntrySheetsAsync(int? orderId, int page, int pageSize);
    Task<object?> GetServiceEntrySheetByIdAsync(int id);
    Task<(object? result, string? error)> CreateServiceEntrySheetAsync(Dictionary<string, object?> data);
    Task<(object? result, string? error)> CertifyServiceEntrySheetAsync(int id);
    Task<(object? result, string? error)> ApproveServiceEntrySheetAsync(int id);
}
