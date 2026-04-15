using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IInventoryService
{
    Task<object> GetDashboardAsync();
    Task<PagedResult<object>> GetItemsAsync(string? search, int? storeId, int page, int pageSize);
    Task<object?> GetItemByIdAsync(int id);
    Task<object> CreateItemAsync(object dto);
    Task<bool> UpdateItemAsync(int id, object dto);
    Task<object> GetLowStockItemsAsync();

    Task<PagedResult<object>> GetCommoditiesAsync(string? search, int? storeId, int page, int pageSize);
    Task<object?> GetCommodityByIdAsync(int id);
    Task<object> CreateCommodityAsync(object dto);
    Task<bool> UpdateCommodityAsync(int id, object dto);
    Task<PagedResult<object>> GetCommodityApprovalsAsync(int page, int pageSize);
    Task<bool> ApproveCommodityAsync(int id);
    Task<bool> RejectCommodityAsync(int id, string reason);
    Task<bool> CancelCommodityAsync(int id);
    Task<object> BulkUploadCommoditiesAsync(List<object> items);

    Task<PagedResult<object>> GetIssuesAsync(string? finYear, int? statusId, int page, int pageSize);
    Task<object> CreateIssueAsync(object dto);
    Task<bool> ApproveIssueAsync(int issueId, object dto);

    Task<PagedResult<object>> GetStocktakesAsync(string? finYear, int page, int pageSize);
    Task<object> CreateStocktakeAsync(object dto);
    Task<bool> VerifyStocktakeAsync(int id, object dto);
    Task<bool> ApproveStocktakeAsync(int id, object dto);
    Task<bool> RejectStocktakeLineAsync(int id, object dto);
    Task<bool> DeleteStocktakeAsync(int id);
    Task<bool> FinalizeStocktakeAsync(int stocktakeId);

    Task<object> GetStockMovementsAsync(int commodityId);

    Task<PagedResult<object>> GetDonationsAsync(string? finYear, int page, int pageSize);
    Task<object> CreateDonationAsync(object dto);

    Task<PagedResult<object>> GetDisposalsAsync(string? finYear, int page, int pageSize);
    Task<object> CreateDisposalAsync(object dto);
    Task<bool> ApproveDisposalAsync(int id);
    Task<bool> DeclineDisposalAsync(int id, string reason);
    Task<bool> JournalDisposalAsync(int id, object dto);

    Task<PagedResult<object>> GetSupplierReturnsAsync(string? finYear, int page, int pageSize);
    Task<object> CreateSupplierReturnAsync(object dto);

    Task<PagedResult<object>> GetAdjustmentsAsync(string? finYear, int page, int pageSize);
    Task<object> CreateAdjustmentAsync(object dto);

    Task<PagedResult<object>> GetValuationsAsync(string? finYear, int page, int pageSize);
    Task<object> CreateValuationAsync(object dto);
    Task<bool> UpdateValuationAsync(int id, object dto);
    Task<bool> RejectValuationAsync(int id, string reason);

    Task<PagedResult<object>> GetTransfersAsync(string? finYear, int page, int pageSize);
    Task<object> CreateTransferAsync(object dto);
    Task<bool> DispatchTransferAsync(int id, object dto);
    Task<bool> ReceiveTransferAsync(int id, object dto);
    Task<bool> RejectTransferAsync(int id, string reason);

    Task<bool> ApproveRecordAsync(string type, int id);

    Task<PagedResult<object>> GetStoreCommodityLinksAsync(int? storeId, int page, int pageSize);
    Task<object> CreateStoreCommodityLinkAsync(object dto);
    Task<bool> UpdateStoreCommodityLinkAsync(int id, object dto);

    Task<PagedResult<object>> GetReturnToStoreAsync(string? finYear, int page, int pageSize);
    Task<object> CreateReturnToStoreAsync(object dto);
    Task<bool> ApproveReturnToStoreAsync(int id);
    Task<bool> SubmitReturnForApprovalAsync(int id);

    Task<PagedResult<object>> GetClosurePeriodsAsync(string? finYear, int page, int pageSize);
    Task<object> CreateClosurePeriodAsync(object dto);
    Task<bool> UpdateClosurePeriodAsync(int id, object dto);
    Task<object> GetClosureConfigAsync();
    Task<bool> SaveClosureConfigAsync(object dto);
    Task<object> GetClosureExceptionsAsync(string? finYear);

    Task<object> GetProcurementPipelineAsync(int page, int pageSize);
    Task<bool> AdvancePipelineItemAsync(int id);
    Task<object> InspectPipelineItemAsync(int id);

    Task<object> GetReplenishmentRulesAsync();
    Task<bool> TriggerReplenishmentAsync();

    Task<object> GetAiInsightsAsync();

    Task<object> GetBinLocationsAsync(int storeId);
    Task<object> GetStoresAsync();

    Task<object> GetReportStocklistAsync(string? finYear, int? storeId);
    Task<object> GetReportStockMovementAsync(string? finYear, int? storeId);

    Task<object> GetCommodityVendorsAsync(int commodityId);
    Task<PagedResult<object>> GetAllCommodityVendorsAsync(int page, int pageSize);
    Task<object> CreateCommodityVendorAsync(object dto);
    Task<object?> LookupBarcodeAsync(string barcode);
    Task<object> GetBarcodesForCommodityAsync(int commodityId);

    Task<PagedResult<object>> GetNotificationsAsync(int? userId, int page, int pageSize);
    Task<object> CreateNotificationAsync(object dto);
    Task<bool> MarkNotificationReadAsync(int id);

    Task<object> GetTransferLocationDetailsAsync(int transferId);
    Task<object> CreateTransferLocationDetailAsync(object dto);

    Task<PagedResult<object>> GetReconciliationExceptionsAsync(string? finYear, int? storeId, int page, int pageSize);
}
