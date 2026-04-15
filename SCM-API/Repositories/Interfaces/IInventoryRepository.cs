using SCM_API.Models.Common;
using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IInventoryRepository : IRepository<Commodity>
{
    Task<PagedResult<Commodity>> GetCommoditiesAsync(string? search, int? storeId, int page, int pageSize);
    Task<PagedResult<InventoryIssue>> GetIssuesAsync(string? finYear, int? statusId, int page, int pageSize);
    Task<PagedResult<Stocktake>> GetStocktakesAsync(string? finYear, int page, int pageSize);
    Task<IEnumerable<InventoryItem>> GetStockMovementsAsync(int commodityId);

    Task<PagedResult<InventoryItem>> GetItemsAsync(string? search, int? storeId, int page, int pageSize);
    Task<InventoryItem?> GetItemByIdAsync(int id);
    Task<InventoryItem> CreateItemAsync(InventoryItem item);
    Task<bool> UpdateItemAsync(InventoryItem item);
    Task<List<InventoryItem>> GetLowStockItemsAsync();

    Task<PagedResult<InventoryDonation>> GetDonationsAsync(string? finYear, int page, int pageSize);
    Task<InventoryDonation> CreateDonationAsync(InventoryDonation donation);

    Task<PagedResult<InventoryDisposal>> GetDisposalsAsync(string? finYear, int page, int pageSize);
    Task<InventoryDisposal> CreateDisposalAsync(InventoryDisposal disposal);
    Task<InventoryDisposal?> GetDisposalByIdAsync(int id);
    Task<bool> UpdateDisposalAsync(InventoryDisposal disposal);

    Task<PagedResult<InventoryReturn>> GetSupplierReturnsAsync(string? finYear, int page, int pageSize);
    Task<InventoryReturn> CreateSupplierReturnAsync(InventoryReturn ret);
    Task<PagedResult<InventoryReturn>> GetReturnToStoreAsync(string? finYear, int page, int pageSize);
    Task<InventoryReturn> CreateReturnToStoreAsync(InventoryReturn ret);
    Task<InventoryReturn?> GetReturnByIdAsync(int id);
    Task<bool> UpdateReturnAsync(InventoryReturn ret);

    Task<PagedResult<InventoryCorrection>> GetCorrectionsAsync(string? finYear, int page, int pageSize);
    Task<InventoryCorrection> CreateCorrectionAsync(InventoryCorrection correction);

    Task<PagedResult<InventoryValuation>> GetValuationsAsync(string? finYear, int page, int pageSize);
    Task<InventoryValuation> CreateValuationAsync(InventoryValuation valuation);
    Task<InventoryValuation?> GetValuationByIdAsync(int id);
    Task<bool> UpdateValuationAsync(InventoryValuation valuation);

    Task<PagedResult<InventoryTransfer>> GetTransfersAsync(string? finYear, int page, int pageSize);
    Task<InventoryTransfer> CreateTransferAsync(InventoryTransfer transfer);
    Task<InventoryTransfer?> GetTransferByIdAsync(int id);
    Task<bool> UpdateTransferAsync(InventoryTransfer transfer);

    Task<Stocktake?> GetStocktakeByIdAsync(int id);
    Task<Stocktake> CreateStocktakeAsync(Stocktake stocktake);
    Task<bool> UpdateStocktakeAsync(Stocktake stocktake);
    Task<bool> DeleteStocktakeAsync(int id);

    Task<Commodity> CreateCommodityAsync(Commodity commodity);
    Task<bool> UpdateCommodityAsync(Commodity commodity);
    Task<PagedResult<Commodity>> GetCommodityApprovalsAsync(int page, int pageSize);

    Task<PagedResult<InventoryItem>> GetStoreCommodityLinksAsync(int? storeId, int page, int pageSize);
    Task<InventoryItem> CreateStoreCommodityLinkAsync(InventoryItem link);

    Task<PagedResult<MonthEndException>> GetClosurePeriodsAsync(string? finYear, int page, int pageSize);
    Task<MonthEndException> CreateClosurePeriodAsync(MonthEndException period);
    Task<MonthEndException?> GetClosurePeriodByIdAsync(int id);
    Task<bool> UpdateClosurePeriodAsync(MonthEndException period);
    Task<List<MonthEndException>> GetClosureExceptionsAsync(string? finYear);

    Task<List<BinLocation>> GetBinLocationsAsync(int storeId);
    Task<List<Store>> GetStoresAsync();

    Task<InventoryIssue> CreateIssueAsync(InventoryIssue issue);
    Task<InventoryIssue?> GetIssueByIdAsync(int id);
    Task<bool> UpdateIssueAsync(InventoryIssue issue);

    Task<List<CommodityVendor>> GetCommodityVendorsAsync(int commodityId);
    Task<PagedResult<CommodityVendor>> GetAllCommodityVendorsAsync(int page, int pageSize);
    Task<CommodityVendor> CreateCommodityVendorAsync(CommodityVendor vendor);

    Task<CommodityVendor?> GetCommodityVendorByBarcodeAsync(string barcode);
    Task<List<VendorBarcode>> GetBarcodesForCommodityAsync(int commodityId);

    Task<PagedResult<InvenNotification>> GetNotificationsAsync(int? userId, int page, int pageSize);
    Task<InvenNotification> CreateNotificationAsync(InvenNotification notification);
    Task<bool> MarkNotificationReadAsync(int id);

    Task<List<TransferLocationDetail>> GetTransferLocationDetailsAsync(int transferId);
    Task<TransferLocationDetail> CreateTransferLocationDetailAsync(TransferLocationDetail detail);

    Task<PagedResult<ReconciliationException>> GetReconciliationExceptionsAsync(string? finYear, int? storeId, int page, int pageSize);
}
