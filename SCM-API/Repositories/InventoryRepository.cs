using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class InventoryRepository : Repository<Commodity>, IInventoryRepository
{
    public InventoryRepository(ApplicationDbContext context, ILogger<InventoryRepository> logger) : base(context, logger) { }

    public async Task<PagedResult<Commodity>> GetCommoditiesAsync(string? search, int? storeId, int page, int pageSize)
    {
        var query = _context.Commodities.Where(c => c.StatusId != null && c.StatusId != 0);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.CommodityDesc!.Contains(search) || c.CommodityExtendedDesc!.Contains(search));
        if (storeId.HasValue)
            query = query.Where(c => c.StoreId == storeId.Value);
        query = query.OrderBy(c => c.CommodityDesc);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<PagedResult<InventoryIssue>> GetIssuesAsync(string? finYear, int? statusId, int page, int pageSize)
    {
        var query = _context.InventoryIssues.Include(i => i.LineItems).Where(i => i.Canceled != true);
        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(i => i.FinYear == finYear);
        if (statusId.HasValue)
            query = query.Where(i => i.StatusId == statusId.Value);
        query = query.OrderByDescending(i => i.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<PagedResult<Stocktake>> GetStocktakesAsync(string? finYear, int page, int pageSize)
    {
        var query = _context.Stocktakes.Include(s => s.LineItems).Where(s => s.IsCancelled != true);
        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(s => s.FinYear == finYear);
        query = query.OrderByDescending(s => s.StocktakeDate);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<IEnumerable<InventoryItem>> GetStockMovementsAsync(int commodityId)
    {
        return await _context.InventoryItems
            .Where(i => i.CommodityId == commodityId)
            .OrderByDescending(i => i.DateCaptured)
            .ToListAsync();
    }

    public async Task<PagedResult<InventoryItem>> GetItemsAsync(string? search, int? storeId, int page, int pageSize)
    {
        var query = _context.InventoryItems.AsQueryable();
        if (storeId.HasValue)
            query = query.Where(i => i.StoreId == storeId.Value);
        query = query.OrderByDescending(i => i.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<InventoryItem?> GetItemByIdAsync(int id)
    {
        return await _context.InventoryItems.FindAsync(id);
    }

    public async Task<InventoryItem> CreateItemAsync(InventoryItem item)
    {
        await _context.InventoryItems.AddAsync(item);
        await _context.SaveChangesAsync();
        return item;
    }

    public async Task<bool> UpdateItemAsync(InventoryItem item)
    {
        _context.InventoryItems.Update(item);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<InventoryItem>> GetLowStockItemsAsync()
    {
        return await _context.InventoryItems
            .Where(i => i.Quantity.HasValue && i.ReorderLevel.HasValue && i.Quantity <= i.ReorderLevel)
            .OrderBy(i => i.Quantity)
            .Take(100)
            .ToListAsync();
    }

    public async Task<PagedResult<InventoryDonation>> GetDonationsAsync(string? finYear, int page, int pageSize)
    {
        var query = _context.InventoryDonations.AsQueryable();
        query = query.OrderByDescending(d => d.DonationDate);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<InventoryDonation> CreateDonationAsync(InventoryDonation donation)
    {
        await _context.InventoryDonations.AddAsync(donation);
        await _context.SaveChangesAsync();
        return donation;
    }

    public async Task<PagedResult<InventoryDisposal>> GetDisposalsAsync(string? finYear, int page, int pageSize)
    {
        var query = _context.InventoryDisposals.Include(d => d.LineItems).Where(d => d.Enabled == true);
        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(d => d.FinYear == finYear);
        query = query.OrderByDescending(d => d.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<InventoryDisposal> CreateDisposalAsync(InventoryDisposal disposal)
    {
        await _context.InventoryDisposals.AddAsync(disposal);
        await _context.SaveChangesAsync();
        return disposal;
    }

    public async Task<InventoryDisposal?> GetDisposalByIdAsync(int id)
    {
        return await _context.InventoryDisposals.Include(d => d.LineItems).FirstOrDefaultAsync(d => d.DisposalId == id);
    }

    public async Task<bool> UpdateDisposalAsync(InventoryDisposal disposal)
    {
        _context.InventoryDisposals.Update(disposal);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<PagedResult<InventoryReturn>> GetSupplierReturnsAsync(string? finYear, int page, int pageSize)
    {
        var query = _context.InventoryReturns.Include(r => r.LineItems)
            .Where(r => r.ReturnType == 1);
        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(r => r.FinYear == finYear);
        query = query.OrderByDescending(r => r.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<InventoryReturn> CreateSupplierReturnAsync(InventoryReturn ret)
    {
        ret.ReturnType = 1;
        await _context.InventoryReturns.AddAsync(ret);
        await _context.SaveChangesAsync();
        return ret;
    }

    public async Task<PagedResult<InventoryReturn>> GetReturnToStoreAsync(string? finYear, int page, int pageSize)
    {
        var query = _context.InventoryReturns.Include(r => r.LineItems)
            .Where(r => r.ReturnType == 0 || r.ReturnType == null);
        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(r => r.FinYear == finYear);
        query = query.OrderByDescending(r => r.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<InventoryReturn> CreateReturnToStoreAsync(InventoryReturn ret)
    {
        ret.ReturnType = 0;
        await _context.InventoryReturns.AddAsync(ret);
        await _context.SaveChangesAsync();
        return ret;
    }

    public async Task<InventoryReturn?> GetReturnByIdAsync(int id)
    {
        return await _context.InventoryReturns.Include(r => r.LineItems).FirstOrDefaultAsync(r => r.ReturnId == id);
    }

    public async Task<bool> UpdateReturnAsync(InventoryReturn ret)
    {
        _context.InventoryReturns.Update(ret);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<PagedResult<InventoryCorrection>> GetCorrectionsAsync(string? finYear, int page, int pageSize)
    {
        var query = _context.InventoryCorrections.AsQueryable();
        query = query.OrderByDescending(c => c.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<InventoryCorrection> CreateCorrectionAsync(InventoryCorrection correction)
    {
        await _context.InventoryCorrections.AddAsync(correction);
        await _context.SaveChangesAsync();
        return correction;
    }

    public async Task<PagedResult<InventoryValuation>> GetValuationsAsync(string? finYear, int page, int pageSize)
    {
        var query = _context.InventoryValuations.AsQueryable();
        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(v => v.FinYear == finYear);
        query = query.OrderByDescending(v => v.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<InventoryValuation> CreateValuationAsync(InventoryValuation valuation)
    {
        await _context.InventoryValuations.AddAsync(valuation);
        await _context.SaveChangesAsync();
        return valuation;
    }

    public async Task<InventoryValuation?> GetValuationByIdAsync(int id)
    {
        return await _context.InventoryValuations.FindAsync(id);
    }

    public async Task<bool> UpdateValuationAsync(InventoryValuation valuation)
    {
        _context.InventoryValuations.Update(valuation);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<PagedResult<InventoryTransfer>> GetTransfersAsync(string? finYear, int page, int pageSize)
    {
        var query = _context.InventoryTransfers.Include(t => t.LineItems).AsQueryable();
        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(t => t.FinYear == finYear);
        query = query.OrderByDescending(t => t.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<InventoryTransfer> CreateTransferAsync(InventoryTransfer transfer)
    {
        await _context.InventoryTransfers.AddAsync(transfer);
        await _context.SaveChangesAsync();
        return transfer;
    }

    public async Task<InventoryTransfer?> GetTransferByIdAsync(int id)
    {
        return await _context.InventoryTransfers.Include(t => t.LineItems).FirstOrDefaultAsync(t => t.TransferId == id);
    }

    public async Task<bool> UpdateTransferAsync(InventoryTransfer transfer)
    {
        _context.InventoryTransfers.Update(transfer);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<Stocktake?> GetStocktakeByIdAsync(int id)
    {
        return await _context.Stocktakes.Include(s => s.LineItems).FirstOrDefaultAsync(s => s.StocktakeId == id);
    }

    public async Task<Stocktake> CreateStocktakeAsync(Stocktake stocktake)
    {
        await _context.Stocktakes.AddAsync(stocktake);
        await _context.SaveChangesAsync();
        return stocktake;
    }

    public async Task<bool> UpdateStocktakeAsync(Stocktake stocktake)
    {
        _context.Stocktakes.Update(stocktake);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteStocktakeAsync(int id)
    {
        var entity = await _context.Stocktakes.FindAsync(id);
        if (entity == null) return false;
        entity.IsCancelled = true;
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<Commodity> CreateCommodityAsync(Commodity commodity)
    {
        await _context.Commodities.AddAsync(commodity);
        await _context.SaveChangesAsync();
        return commodity;
    }

    public async Task<bool> UpdateCommodityAsync(Commodity commodity)
    {
        _context.Commodities.Update(commodity);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<PagedResult<Commodity>> GetCommodityApprovalsAsync(int page, int pageSize)
    {
        var query = _context.Commodities
            .Where(c => c.IsAwaitingApproval == true)
            .OrderByDescending(c => c.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<PagedResult<InventoryItem>> GetStoreCommodityLinksAsync(int? storeId, int page, int pageSize)
    {
        var query = _context.InventoryItems.AsQueryable();
        if (storeId.HasValue)
            query = query.Where(i => i.StoreId == storeId.Value);
        query = query.OrderBy(i => i.CommodityId);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<InventoryItem> CreateStoreCommodityLinkAsync(InventoryItem link)
    {
        await _context.InventoryItems.AddAsync(link);
        await _context.SaveChangesAsync();
        return link;
    }

    public async Task<PagedResult<MonthEndException>> GetClosurePeriodsAsync(string? finYear, int page, int pageSize)
    {
        var query = _context.MonthEndExceptions.AsQueryable();
        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(m => m.FinYearEnd == finYear);
        query = query.OrderByDescending(m => m.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<MonthEndException> CreateClosurePeriodAsync(MonthEndException period)
    {
        await _context.MonthEndExceptions.AddAsync(period);
        await _context.SaveChangesAsync();
        return period;
    }

    public async Task<MonthEndException?> GetClosurePeriodByIdAsync(int id)
    {
        return await _context.MonthEndExceptions.FindAsync(id);
    }

    public async Task<bool> UpdateClosurePeriodAsync(MonthEndException period)
    {
        _context.MonthEndExceptions.Update(period);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<MonthEndException>> GetClosureExceptionsAsync(string? finYear)
    {
        var query = _context.MonthEndExceptions.Where(m => m.Type != null);
        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(m => m.FinYearEnd == finYear);
        return await query.OrderByDescending(m => m.DateCaptured).ToListAsync();
    }

    public async Task<List<BinLocation>> GetBinLocationsAsync(int storeId)
    {
        return await _context.BinLocations.Where(b => b.StoreId == storeId && b.IsActive == true).ToListAsync();
    }

    public async Task<List<Store>> GetStoresAsync()
    {
        return await _context.Stores.Where(s => s.Enabled == true).OrderBy(s => s.StoreName).ToListAsync();
    }

    public async Task<InventoryIssue> CreateIssueAsync(InventoryIssue issue)
    {
        await _context.InventoryIssues.AddAsync(issue);
        await _context.SaveChangesAsync();
        return issue;
    }

    public async Task<InventoryIssue?> GetIssueByIdAsync(int id)
    {
        return await _context.InventoryIssues.Include(i => i.LineItems).FirstOrDefaultAsync(i => i.IssueId == id);
    }

    public async Task<bool> UpdateIssueAsync(InventoryIssue issue)
    {
        _context.InventoryIssues.Update(issue);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<CommodityVendor>> GetCommodityVendorsAsync(int commodityId)
    {
        return await _context.CommodityVendors
            .Where(cv => cv.CommodityId == commodityId && cv.Enabled == true)
            .ToListAsync();
    }

    public async Task<PagedResult<CommodityVendor>> GetAllCommodityVendorsAsync(int page, int pageSize)
    {
        var query = _context.CommodityVendors
            .Where(cv => cv.Enabled == true)
            .OrderByDescending(cv => cv.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<CommodityVendor> CreateCommodityVendorAsync(CommodityVendor vendor)
    {
        await _context.CommodityVendors.AddAsync(vendor);
        await _context.SaveChangesAsync();
        return vendor;
    }

    public async Task<CommodityVendor?> GetCommodityVendorByBarcodeAsync(string barcode)
    {
        var vb = await _context.VendorBarcodes
            .FirstOrDefaultAsync(b => b.Barcode == barcode && b.Enabled == true);
        if (vb?.CommodityId == null) return null;
        return await _context.CommodityVendors
            .FirstOrDefaultAsync(cv => cv.CommodityId == vb.CommodityId && cv.VendorId == vb.VendorId && cv.Enabled == true);
    }

    public async Task<List<VendorBarcode>> GetBarcodesForCommodityAsync(int commodityId)
    {
        return await _context.VendorBarcodes
            .Where(b => b.CommodityId == commodityId && b.Enabled == true)
            .ToListAsync();
    }

    public async Task<PagedResult<InvenNotification>> GetNotificationsAsync(int? userId, int page, int pageSize)
    {
        var query = _context.InvenNotifications.Where(n => n.Enabled == true);
        if (userId.HasValue)
            query = query.Where(n => n.UserId == userId.Value);
        query = query.OrderByDescending(n => n.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<InvenNotification> CreateNotificationAsync(InvenNotification notification)
    {
        await _context.InvenNotifications.AddAsync(notification);
        await _context.SaveChangesAsync();
        return notification;
    }

    public async Task<bool> MarkNotificationReadAsync(int id)
    {
        var n = await _context.InvenNotifications.FindAsync(id);
        if (n == null) return false;
        n.IsRead = true;
        n.DateRead = DateTime.UtcNow;
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<TransferLocationDetail>> GetTransferLocationDetailsAsync(int transferId)
    {
        return await _context.TransferLocationDetails
            .Where(d => d.TransferId == transferId)
            .ToListAsync();
    }

    public async Task<TransferLocationDetail> CreateTransferLocationDetailAsync(TransferLocationDetail detail)
    {
        await _context.TransferLocationDetails.AddAsync(detail);
        await _context.SaveChangesAsync();
        return detail;
    }

    public async Task<PagedResult<ReconciliationException>> GetReconciliationExceptionsAsync(string? finYear, int? storeId, int page, int pageSize)
    {
        var query = _context.ReconciliationExceptions.Where(r => r.Enabled == true);
        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(r => r.FinYear == finYear);
        if (storeId.HasValue)
            query = query.Where(r => r.StoreId == storeId.Value);
        query = query.OrderByDescending(r => r.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }
}
