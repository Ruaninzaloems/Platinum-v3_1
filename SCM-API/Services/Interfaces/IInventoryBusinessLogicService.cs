using SCM_API.Models.Domain;

namespace SCM_API.Services.Interfaces;

public interface IInventoryBusinessLogicService
{
    Task<bool> CheckStorePermissionAsync(int userId, int storeId, string permissionType = "view");
    Task<List<int>> GetUserStoreIdsAsync(int userId);
    Task<bool> IsMonthClosedAsync(string finYear, int month);

    Task<(bool success, string message)> ProcessStocktakeCountAsync(int stocktakeId, int userId);
    Task<(bool success, string message)> ProcessStocktakeCheckAsync(int stocktakeId, int userId);
    Task<(bool success, string message)> ProcessStocktakeVerifyAsync(int stocktakeId, int userId);
    Task<(bool success, string message)> ProcessStocktakeApproveAsync(int stocktakeId, int userId);
    Task<(bool success, string message)> ProcessStocktakeRejectLineAsync(int stocktakeId, int lineItemId, string reason, int userId);

    Task<(bool success, string message, object? result)> ProcessIssueWithValidationAsync(InventoryIssue issue, int userId);
    Task<(bool success, string message)> ProcessReturnWithValidationAsync(InventoryReturn ret, int userId);

    Task<(bool success, string message)> ProcessTransferDispatchAsync(int transferId, int userId);
    Task<(bool success, string message)> ProcessTransferReceiveAsync(int transferId, int userId);
    Task<(bool success, string message)> ProcessTransferRejectAsync(int transferId, string reason, int userId);

    Task<(bool success, string message)> ProcessDisposalApproveAsync(int disposalId, int userId);
    Task<(bool success, string message)> ProcessDisposalJournalAsync(int disposalId, int userId);

    Task<(bool success, string message, object? result)> ProcessCorrectionAsync(InventoryCorrection correction, int userId);

    Task<(bool success, string message)> ProcessValuationApproveAsync(int valuationId, int userId);
    Task<(bool success, string message)> ProcessValuationRejectAsync(int valuationId, string reason, int userId);

    Task<object> GetReplenishmentSuggestionsAsync();

    Task<(bool success, string message)> CloseMonthEndAsync(string finYear, int month, int userId);
    Task<(bool success, string message)> ReopenMonthEndAsync(string finYear, int month, int userId);
    Task<object> GetMonthEndStatusAsync(string finYear);
    Task<object> GetMonthEndExceptionsAsync(string finYear, int? storeId);
}
