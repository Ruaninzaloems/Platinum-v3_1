using System.Collections.Concurrent;
using System.Text.Json;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class InventoryService : IInventoryService
{
    private readonly IInventoryRepository _repository;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<InventoryService> _logger;

    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<int, Dictionary<string, object?>>> _mockStore = new();
    private static bool _seeded = false;
    private static readonly object _seedLock = new();

    public InventoryService(IInventoryRepository repository, DbAvailabilityChecker dbChecker, ILogger<InventoryService> logger)
    {
        _repository = repository;
        _dbChecker = dbChecker;
        _logger = logger;
        EnsureSeeded();
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    private ConcurrentDictionary<int, Dictionary<string, object?>> GetCollection(string name)
    {
        return _mockStore.GetOrAdd(name, _ => new ConcurrentDictionary<int, Dictionary<string, object?>>());
    }

    private void EnsureSeeded()
    {
        if (_seeded) return;
        lock (_seedLock)
        {
            if (_seeded) return;
            _seeded = true;
        }
    }

    private PagedResult<object> PageMock(ConcurrentDictionary<int, Dictionary<string, object?>> coll, int page, int pageSize)
    {
        var items = coll.Values.Skip((page - 1) * pageSize).Take(pageSize).Cast<object>().ToList();
        return new PagedResult<object> { Items = items, Page = page, PageSize = pageSize, TotalCount = coll.Count };
    }

    public async Task<object> GetDashboardAsync()
    {
        if (UseDb)
        {
            try
            {
                var items = await _repository.GetItemsAsync(null, null, 1, 1);
                var lowStock = await _repository.GetLowStockItemsAsync();
                return new
                {
                    totalItems = items.TotalCount,
                    totalValue = 0m,
                    lowStock = lowStock.Count,
                    reorderRequired = lowStock.Count,
                    categories = Array.Empty<object>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for inventory dashboard, falling back");
                _dbChecker.MarkUnavailable();
            }
        }
        return new { totalItems = 0, totalValue = 0m, lowStock = 0, reorderRequired = 0, categories = Array.Empty<object>() };
    }

    public async Task<PagedResult<object>> GetItemsAsync(string? search, int? storeId, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetItemsAsync(search, storeId, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for inventory items, falling back");
                _dbChecker.MarkUnavailable();
            }
        }
        return PageMock(GetCollection("items"), page, pageSize);
    }

    public async Task<object?> GetItemByIdAsync(int id)
    {
        if (UseDb)
        {
            try { return await _repository.GetItemByIdAsync(id); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for item {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        GetCollection("items").TryGetValue(id, out var item);
        return item;
    }

    public async Task<object> CreateItemAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var item = JsonSerializer.Deserialize<InventoryItem>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InventoryItem();
                item.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateItemAsync(item);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for item create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<bool> UpdateItemAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetItemByIdAsync(id);
                if (existing == null) return false;
                var props = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(dto));
                if (props != null) ApplyUpdates(existing, props);
                existing.DateModified = DateTime.UtcNow;
                return await _repository.UpdateItemAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for item update {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<object> GetLowStockItemsAsync()
    {
        if (UseDb)
        {
            try { return await _repository.GetLowStockItemsAsync(); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for low stock items"); _dbChecker.MarkUnavailable(); }
        }
        return new List<object>();
    }

    public async Task<PagedResult<object>> GetCommoditiesAsync(string? search, int? storeId, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetCommoditiesAsync(search, storeId, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for commodities"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("commodities"), page, pageSize);
    }

    public async Task<object?> GetCommodityByIdAsync(int id)
    {
        if (UseDb)
        {
            try { return await _repository.GetByIdAsync(id); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for commodity {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        GetCollection("commodities").TryGetValue(id, out var c);
        return c;
    }

    public async Task<object> CreateCommodityAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var commodity = JsonSerializer.Deserialize<Commodity>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new Commodity();
                commodity.IsAwaitingApproval = true;
                commodity.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateCommodityAsync(commodity);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for commodity create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<bool> UpdateCommodityAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetByIdAsync(id);
                if (existing == null) return false;
                var props = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(dto));
                if (props != null) ApplyUpdates(existing, props);
                existing.DateModified = DateTime.UtcNow;
                return await _repository.UpdateCommodityAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for commodity update {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<PagedResult<object>> GetCommodityApprovalsAsync(int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetCommodityApprovalsAsync(page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for commodity approvals"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("commodities"), page, pageSize);
    }

    public async Task<bool> ApproveCommodityAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetByIdAsync(id);
                if (existing == null) return false;
                existing.IsAwaitingApproval = false;
                existing.DateApproved = DateTime.UtcNow;
                return await _repository.UpdateCommodityAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for commodity approve {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> RejectCommodityAsync(int id, string reason)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetByIdAsync(id);
                if (existing == null) return false;
                existing.IsAwaitingApproval = false;
                existing.RejectedReason = reason;
                return await _repository.UpdateCommodityAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for commodity reject {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> CancelCommodityAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetByIdAsync(id);
                if (existing == null) return false;
                existing.StatusId = 0;
                return await _repository.UpdateCommodityAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for commodity cancel {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<object> BulkUploadCommoditiesAsync(List<object> items)
    {
        var count = 0;
        if (UseDb)
        {
            try
            {
                foreach (var item in items)
                {
                    var commodity = JsonSerializer.Deserialize<Commodity>(JsonSerializer.Serialize(item), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (commodity != null)
                    {
                        commodity.DateCaptured = DateTime.UtcNow;
                        await _repository.CreateCommodityAsync(commodity);
                        count++;
                    }
                }
                return new { imported = count, total = items.Count };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for bulk commodity upload"); _dbChecker.MarkUnavailable(); }
        }
        return new { imported = 0, total = items.Count, message = "DB unavailable" };
    }

    public async Task<PagedResult<object>> GetIssuesAsync(string? finYear, int? statusId, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetIssuesAsync(finYear, statusId, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for issues"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("issues"), page, pageSize);
    }

    public async Task<object> CreateIssueAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var issue = JsonSerializer.Deserialize<InventoryIssue>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InventoryIssue();
                issue.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateIssueAsync(issue);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for issue create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<bool> ApproveIssueAsync(int issueId, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetIssueByIdAsync(issueId);
                if (existing == null) return false;
                existing.StatusId = 2;
                return await _repository.UpdateIssueAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for issue approve {Id}", issueId); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<PagedResult<object>> GetStocktakesAsync(string? finYear, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetStocktakesAsync(finYear, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for stocktakes"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("stocktakes"), page, pageSize);
    }

    public async Task<object> CreateStocktakeAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var st = JsonSerializer.Deserialize<Stocktake>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new Stocktake();
                st.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateStocktakeAsync(st);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for stocktake create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<bool> VerifyStocktakeAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetStocktakeByIdAsync(id);
                if (existing == null) return false;
                existing.IsVerified = true;
                existing.StocktakeStatus = "Verified";
                return await _repository.UpdateStocktakeAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for stocktake verify {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> ApproveStocktakeAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetStocktakeByIdAsync(id);
                if (existing == null) return false;
                existing.IsApproved = true;
                existing.StocktakeStatus = "Approved";
                return await _repository.UpdateStocktakeAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for stocktake approve {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> RejectStocktakeLineAsync(int id, object dto)
    {
        return true;
    }

    public async Task<bool> DeleteStocktakeAsync(int id)
    {
        if (UseDb)
        {
            try { return await _repository.DeleteStocktakeAsync(id); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for stocktake delete {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> FinalizeStocktakeAsync(int stocktakeId) => await ApproveStocktakeAsync(stocktakeId, new { });

    public async Task<object> GetStockMovementsAsync(int commodityId)
    {
        if (UseDb)
        {
            try { return await _repository.GetStockMovementsAsync(commodityId); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for stock movements"); _dbChecker.MarkUnavailable(); }
        }
        return new List<object>();
    }

    public async Task<PagedResult<object>> GetDonationsAsync(string? finYear, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetDonationsAsync(finYear, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for donations"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("donations"), page, pageSize);
    }

    public async Task<object> CreateDonationAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var d = JsonSerializer.Deserialize<InventoryDonation>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InventoryDonation();
                d.DonationDate = d.DonationDate ?? DateTime.UtcNow;
                return await _repository.CreateDonationAsync(d);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for donation create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<PagedResult<object>> GetDisposalsAsync(string? finYear, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetDisposalsAsync(finYear, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for disposals"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("disposals"), page, pageSize);
    }

    public async Task<object> CreateDisposalAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var d = JsonSerializer.Deserialize<InventoryDisposal>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InventoryDisposal();
                d.Enabled = true;
                d.DateCaptured = d.DateCaptured ?? DateTime.UtcNow;
                return await _repository.CreateDisposalAsync(d);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for disposal create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<bool> ApproveDisposalAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetDisposalByIdAsync(id);
                if (existing == null) return false;
                foreach (var line in existing.LineItems) { line.IsApproved = true; line.ApprovedDate = DateTime.UtcNow; }
                return await _repository.UpdateDisposalAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for disposal approve {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> DeclineDisposalAsync(int id, string reason)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetDisposalByIdAsync(id);
                if (existing == null) return false;
                foreach (var line in existing.LineItems) { line.IsApproved = false; line.RejectionReason = reason; }
                return await _repository.UpdateDisposalAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for disposal decline {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> JournalDisposalAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetDisposalByIdAsync(id);
                if (existing == null) return false;
                existing.DateModified = DateTime.UtcNow;
                return await _repository.UpdateDisposalAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for disposal journal {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<PagedResult<object>> GetSupplierReturnsAsync(string? finYear, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetSupplierReturnsAsync(finYear, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for supplier returns"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("supplierReturns"), page, pageSize);
    }

    public async Task<object> CreateSupplierReturnAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var r = JsonSerializer.Deserialize<InventoryReturn>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InventoryReturn();
                r.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateSupplierReturnAsync(r);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for supplier return create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<PagedResult<object>> GetAdjustmentsAsync(string? finYear, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetCorrectionsAsync(finYear, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for adjustments"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("adjustments"), page, pageSize);
    }

    public async Task<object> CreateAdjustmentAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var c = JsonSerializer.Deserialize<InventoryCorrection>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InventoryCorrection();
                c.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateCorrectionAsync(c);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for adjustment create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<PagedResult<object>> GetValuationsAsync(string? finYear, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetValuationsAsync(finYear, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for valuations"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("valuations"), page, pageSize);
    }

    public async Task<object> CreateValuationAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var v = JsonSerializer.Deserialize<InventoryValuation>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InventoryValuation();
                v.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateValuationAsync(v);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for valuation create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<bool> UpdateValuationAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetValuationByIdAsync(id);
                if (existing == null) return false;
                var props = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(dto));
                if (props != null) ApplyUpdates(existing, props);
                return await _repository.UpdateValuationAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for valuation update {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> RejectValuationAsync(int id, string reason)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetValuationByIdAsync(id);
                if (existing == null) return false;
                existing.StatusId = 3;
                existing.Comment = reason;
                return await _repository.UpdateValuationAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for valuation reject {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<PagedResult<object>> GetTransfersAsync(string? finYear, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetTransfersAsync(finYear, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for transfers"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("transfers"), page, pageSize);
    }

    public async Task<object> CreateTransferAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var t = JsonSerializer.Deserialize<InventoryTransfer>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InventoryTransfer();
                t.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateTransferAsync(t);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for transfer create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<bool> DispatchTransferAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetTransferByIdAsync(id);
                if (existing == null) return false;
                foreach (var line in existing.LineItems) { line.DispatchedByDate = DateTime.UtcNow; }
                existing.DateModified = DateTime.UtcNow;
                return await _repository.UpdateTransferAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for transfer dispatch {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> ReceiveTransferAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetTransferByIdAsync(id);
                if (existing == null) return false;
                foreach (var line in existing.LineItems) { line.ReceivedByDate = DateTime.UtcNow; }
                existing.DateModified = DateTime.UtcNow;
                return await _repository.UpdateTransferAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for transfer receive {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> RejectTransferAsync(int id, string reason)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetTransferByIdAsync(id);
                if (existing == null) return false;
                foreach (var line in existing.LineItems) { line.RejectedByDate = DateTime.UtcNow; line.RejectionReason = "Rejected"; }
                existing.DateModified = DateTime.UtcNow;
                return await _repository.UpdateTransferAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for transfer reject {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> ApproveRecordAsync(string type, int id)
    {
        if (UseDb)
        {
            try
            {
                switch (type.ToLower())
                {
                    case "issues": return await ApproveIssueAsync(id, new { });
                    case "transfers": var t = await _repository.GetTransferByIdAsync(id); if (t != null) { foreach (var li in t.LineItems) { li.ApprovedByDate = DateTime.UtcNow; } t.DateModified = DateTime.UtcNow; return await _repository.UpdateTransferAsync(t); } break;
                    case "donations": return true;
                    case "disposals": return await ApproveDisposalAsync(id);
                    case "returns": return true;
                }
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for approve {Type}/{Id}", type, id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<PagedResult<object>> GetStoreCommodityLinksAsync(int? storeId, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetStoreCommodityLinksAsync(storeId, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for store commodity links"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("storeLinks"), page, pageSize);
    }

    public async Task<object> CreateStoreCommodityLinkAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var link = JsonSerializer.Deserialize<InventoryItem>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InventoryItem();
                link.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateStoreCommodityLinkAsync(link);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for store commodity link create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<bool> UpdateStoreCommodityLinkAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetItemByIdAsync(id);
                if (existing == null) return false;
                var props = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(dto));
                if (props != null) ApplyUpdates(existing, props);
                return await _repository.UpdateItemAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for store commodity link update {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<PagedResult<object>> GetReturnToStoreAsync(string? finYear, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetReturnToStoreAsync(finYear, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for return to store"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("returnToStore"), page, pageSize);
    }

    public async Task<object> CreateReturnToStoreAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var r = JsonSerializer.Deserialize<InventoryReturn>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InventoryReturn();
                r.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateReturnToStoreAsync(r);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for return to store create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<bool> ApproveReturnToStoreAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetReturnByIdAsync(id);
                if (existing == null) return false;
                existing.DateModified = DateTime.UtcNow;
                return await _repository.UpdateReturnAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for return to store approve {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<bool> SubmitReturnForApprovalAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetReturnByIdAsync(id);
                if (existing == null) return false;
                existing.DateModified = DateTime.UtcNow;
                return await _repository.UpdateReturnAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for return submit {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<PagedResult<object>> GetClosurePeriodsAsync(string? finYear, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetClosurePeriodsAsync(finYear, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for closure periods"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("closurePeriods"), page, pageSize);
    }

    public async Task<object> CreateClosurePeriodAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var p = JsonSerializer.Deserialize<MonthEndException>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new MonthEndException();
                p.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateClosurePeriodAsync(p);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for closure period create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<bool> UpdateClosurePeriodAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await _repository.GetClosurePeriodByIdAsync(id);
                if (existing == null) return false;
                var props = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(dto));
                if (props != null) ApplyUpdates(existing, props);
                return await _repository.UpdateClosurePeriodAsync(existing);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for closure period update {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<object> GetClosureConfigAsync()
    {
        return new { closureDate = (DateTime?)null, status = "open", periods = Array.Empty<object>() };
    }

    public async Task<bool> SaveClosureConfigAsync(object dto) => true;

    public async Task<object> GetClosureExceptionsAsync(string? finYear)
    {
        if (UseDb)
        {
            try { return await _repository.GetClosureExceptionsAsync(finYear); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for closure exceptions"); _dbChecker.MarkUnavailable(); }
        }
        return new List<object>();
    }

    public async Task<object> GetProcurementPipelineAsync(int page, int pageSize)
    {
        return new { items = Array.Empty<object>(), total = 0, page, pageSize };
    }

    public async Task<bool> AdvancePipelineItemAsync(int id) => true;
    public async Task<object> InspectPipelineItemAsync(int id) => new { id, status = "inspected" };

    public async Task<object> GetReplenishmentRulesAsync()
    {
        if (UseDb)
        {
            try { return await _repository.GetLowStockItemsAsync(); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for replenishment rules"); _dbChecker.MarkUnavailable(); }
        }
        return new List<object>();
    }

    public async Task<bool> TriggerReplenishmentAsync() => true;

    public async Task<object> GetAiInsightsAsync()
    {
        return new { insights = Array.Empty<object>(), lastUpdated = DateTime.UtcNow };
    }

    public async Task<object> GetBinLocationsAsync(int storeId)
    {
        if (UseDb)
        {
            try { return await _repository.GetBinLocationsAsync(storeId); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for bin locations"); _dbChecker.MarkUnavailable(); }
        }
        return new List<object>();
    }

    public async Task<object> GetStoresAsync()
    {
        if (UseDb)
        {
            try { return await _repository.GetStoresAsync(); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for stores"); _dbChecker.MarkUnavailable(); }
        }
        return new List<object>();
    }

    public async Task<object> GetReportStocklistAsync(string? finYear, int? storeId)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetItemsAsync(null, storeId, 1, 1000);
                return new { items = result.Items, total = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for stocklist report"); _dbChecker.MarkUnavailable(); }
        }
        return new { items = Array.Empty<object>(), total = 0 };
    }

    public async Task<object> GetReportStockMovementAsync(string? finYear, int? storeId)
    {
        return new { items = Array.Empty<object>(), total = 0 };
    }

    public async Task<object> GetCommodityVendorsAsync(int commodityId)
    {
        if (UseDb)
        {
            try { return await _repository.GetCommodityVendorsAsync(commodityId); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for commodity vendors"); _dbChecker.MarkUnavailable(); }
        }
        return new List<object>();
    }

    public async Task<PagedResult<object>> GetAllCommodityVendorsAsync(int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetAllCommodityVendorsAsync(page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for all commodity vendors"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("commodityVendors"), page, pageSize);
    }

    public async Task<object> CreateCommodityVendorAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var cv = JsonSerializer.Deserialize<CommodityVendor>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new CommodityVendor();
                cv.Enabled = true;
                cv.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateCommodityVendorAsync(cv);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for commodity vendor create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<object?> LookupBarcodeAsync(string barcode)
    {
        if (UseDb)
        {
            try { return await _repository.GetCommodityVendorByBarcodeAsync(barcode); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for barcode lookup"); _dbChecker.MarkUnavailable(); }
        }
        return null;
    }

    public async Task<object> GetBarcodesForCommodityAsync(int commodityId)
    {
        if (UseDb)
        {
            try { return await _repository.GetBarcodesForCommodityAsync(commodityId); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for barcodes"); _dbChecker.MarkUnavailable(); }
        }
        return new List<object>();
    }

    public async Task<PagedResult<object>> GetNotificationsAsync(int? userId, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetNotificationsAsync(userId, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for notifications"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("notifications"), page, pageSize);
    }

    public async Task<object> CreateNotificationAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var n = JsonSerializer.Deserialize<InvenNotification>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InvenNotification();
                n.Enabled = true;
                n.IsRead = false;
                n.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateNotificationAsync(n);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for notification create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<bool> MarkNotificationReadAsync(int id)
    {
        if (UseDb)
        {
            try { return await _repository.MarkNotificationReadAsync(id); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for notification read {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return true;
    }

    public async Task<object> GetTransferLocationDetailsAsync(int transferId)
    {
        if (UseDb)
        {
            try { return await _repository.GetTransferLocationDetailsAsync(transferId); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for transfer location details"); _dbChecker.MarkUnavailable(); }
        }
        return new List<object>();
    }

    public async Task<object> CreateTransferLocationDetailAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var d = JsonSerializer.Deserialize<TransferLocationDetail>(JsonSerializer.Serialize(dto), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new TransferLocationDetail();
                d.DateCaptured = DateTime.UtcNow;
                return await _repository.CreateTransferLocationDetailAsync(d);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB write failed for transfer location detail create"); _dbChecker.MarkUnavailable(); }
        }
        return dto;
    }

    public async Task<PagedResult<object>> GetReconciliationExceptionsAsync(string? finYear, int? storeId, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetReconciliationExceptionsAsync(finYear, storeId, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB read failed for reconciliation exceptions"); _dbChecker.MarkUnavailable(); }
        }
        return PageMock(GetCollection("reconciliationExceptions"), page, pageSize);
    }

    private void ApplyUpdates<T>(T entity, Dictionary<string, JsonElement> props) where T : class
    {
        var type = typeof(T);
        foreach (var kvp in props)
        {
            var propName = char.ToUpper(kvp.Key[0]) + kvp.Key.Substring(1);
            var prop = type.GetProperty(propName);
            if (prop == null) continue;
            try
            {
                var val = JsonSerializer.Deserialize(kvp.Value.GetRawText(), prop.PropertyType, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                prop.SetValue(entity, val);
            }
            catch { }
        }
    }
}
