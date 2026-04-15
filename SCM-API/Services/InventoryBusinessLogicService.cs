using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class InventoryBusinessLogicService : IInventoryBusinessLogicService
{
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly IAuditService _auditService;
    private readonly ILogger<InventoryBusinessLogicService> _logger;

    public InventoryBusinessLogicService(
        ApplicationDbContext context,
        DbAvailabilityChecker dbChecker,
        IAuditService auditService,
        ILogger<InventoryBusinessLogicService> logger)
    {
        _context = context;
        _dbChecker = dbChecker;
        _auditService = auditService;
        _logger = logger;
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    public async Task<bool> CheckStorePermissionAsync(int userId, int storeId, string permissionType = "view")
    {
        if (!UseDb) return true;
        try
        {
            var perm = await _context.UserStorePermissions
                .FirstOrDefaultAsync(p => p.UserId == userId && p.StoreId == storeId && p.Enabled == true);
            if (perm == null) return false;
            return permissionType.ToLower() switch
            {
                "capture" => perm.CanCapture == true,
                "approve" => perm.CanApprove == true,
                "view" => perm.CanView == true,
                _ => perm.CanView == true
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to check store permission");
            _dbChecker.MarkUnavailable();
            return true;
        }
    }

    public async Task<List<int>> GetUserStoreIdsAsync(int userId)
    {
        if (!UseDb) return new List<int>();
        try
        {
            return await _context.UserStorePermissions
                .Where(p => p.UserId == userId && p.Enabled == true && p.CanView == true)
                .Select(p => p.StoreId ?? 0)
                .Where(id => id > 0)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get user store IDs");
            _dbChecker.MarkUnavailable();
            return new List<int>();
        }
    }

    public async Task<bool> IsMonthClosedAsync(string finYear, int month)
    {
        if (!UseDb) return false;
        try
        {
            var closure = await _context.InvenMonthEnds
                .FirstOrDefaultAsync(m => m.FinYear == finYear && m.Month == month && m.IsClosed == true);
            return closure != null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to check month closure");
            _dbChecker.MarkUnavailable();
            return false;
        }
    }

    public async Task<(bool success, string message)> ProcessStocktakeCountAsync(int stocktakeId, int userId)
    {
        if (!UseDb) return (true, "Counted (offline mode)");
        try
        {
            var st = await _context.Stocktakes.Include(s => s.LineItems).FirstOrDefaultAsync(s => s.StocktakeId == stocktakeId);
            if (st == null) return (false, "Stocktake not found");

            if (st.StoreId.HasValue)
            {
                var hasPerm = await CheckStorePermissionAsync(userId, st.StoreId.Value, "capture");
                if (!hasPerm) return (false, "User does not have capture permission for this store");
            }

            st.CounterId = userId;
            st.StocktakeStatus = "Counted";
            st.DateModified = DateTime.UtcNow;
            st.ModifierId = userId;

            foreach (var line in st.LineItems)
            {
                if (line.InventoryId.HasValue)
                {
                    var inv = await _context.InventoryItems.FindAsync(line.InventoryId.Value);
                    if (inv != null)
                    {
                        line.OnHandQty = inv.Quantity;
                        line.QuantityVariance = (line.QuantityCounted ?? 0) - (inv.Quantity ?? 0);
                        line.ValueVariance = line.QuantityVariance * (inv.UnitPrice ?? 0);
                    }
                }
            }

            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("Stocktake", stocktakeId, "Count", $"Stocktake counted by user {userId}", userId);
            return (true, "Stocktake counted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Stocktake count failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message)> ProcessStocktakeCheckAsync(int stocktakeId, int userId)
    {
        if (!UseDb) return (true, "Checked (offline mode)");
        try
        {
            var st = await _context.Stocktakes.Include(s => s.LineItems).FirstOrDefaultAsync(s => s.StocktakeId == stocktakeId);
            if (st == null) return (false, "Stocktake not found");
            if (st.StocktakeStatus != "Counted") return (false, "Stocktake must be counted before checking");

            if (st.StoreId.HasValue)
            {
                var hasPerm = await CheckStorePermissionAsync(userId, st.StoreId.Value, "capture");
                if (!hasPerm) return (false, "User does not have capture permission for this store");
            }

            st.CheckerId = userId;
            st.StocktakeStatus = "Checked";
            st.DateModified = DateTime.UtcNow;
            st.ModifierId = userId;

            foreach (var line in st.LineItems.Where(l => l.NeedChecking == true))
            {
                line.QuantityVariance = (line.QuantityChecked ?? line.QuantityCounted ?? 0) - (line.OnHandQty ?? 0);
                line.ValueVariance = line.QuantityVariance * ((line.ValueCounted ?? 0) / Math.Max(line.QuantityCounted ?? 1, 1));
            }

            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("Stocktake", stocktakeId, "Check", $"Stocktake checked by user {userId}", userId);
            return (true, "Stocktake checked successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Stocktake check failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message)> ProcessStocktakeVerifyAsync(int stocktakeId, int userId)
    {
        if (!UseDb) return (true, "Verified (offline mode)");
        try
        {
            var st = await _context.Stocktakes.Include(s => s.LineItems).FirstOrDefaultAsync(s => s.StocktakeId == stocktakeId);
            if (st == null) return (false, "Stocktake not found");
            if (st.StocktakeStatus != "Checked" && st.StocktakeStatus != "Counted")
                return (false, "Stocktake must be counted/checked before verification");

            if (st.StoreId.HasValue)
            {
                var hasPerm = await CheckStorePermissionAsync(userId, st.StoreId.Value, "approve");
                if (!hasPerm) return (false, "User does not have approve permission for this store");
            }

            st.VerifierId = userId;
            st.IsVerified = true;
            st.StocktakeStatus = "Verified";
            st.DateModified = DateTime.UtcNow;
            st.ModifierId = userId;

            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("Stocktake", stocktakeId, "Verify", $"Stocktake verified by user {userId}", userId);
            return (true, "Stocktake verified successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Stocktake verify failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message)> ProcessStocktakeApproveAsync(int stocktakeId, int userId)
    {
        if (!UseDb) return (true, "Approved (offline mode)");
        try
        {
            var st = await _context.Stocktakes.Include(s => s.LineItems).FirstOrDefaultAsync(s => s.StocktakeId == stocktakeId);
            if (st == null) return (false, "Stocktake not found");
            if (st.IsVerified != true) return (false, "Stocktake must be verified before approval");

            if (st.StoreId.HasValue)
            {
                var hasPerm = await CheckStorePermissionAsync(userId, st.StoreId.Value, "approve");
                if (!hasPerm) return (false, "User does not have approve permission for this store");
            }

            st.ApprovedById = userId;
            st.IsApproved = true;
            st.StocktakeStatus = "Approved";
            st.DateModified = DateTime.UtcNow;
            st.ModifierId = userId;

            foreach (var line in st.LineItems.Where(l => l.Approved == true && l.QuantityVariance != 0))
            {
                if (line.InventoryId.HasValue)
                {
                    var inv = await _context.InventoryItems.FindAsync(line.InventoryId.Value);
                    if (inv != null)
                    {
                        inv.Quantity = line.QuantityCounted ?? inv.Quantity;
                        inv.DateModified = DateTime.UtcNow;
                    }
                }
            }

            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("Stocktake", stocktakeId, "Approve", $"Stocktake approved by user {userId}. Inventory quantities adjusted.", userId);
            return (true, "Stocktake approved and inventory adjusted");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Stocktake approve failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message)> ProcessStocktakeRejectLineAsync(int stocktakeId, int lineItemId, string reason, int userId)
    {
        if (!UseDb) return (true, "Rejected (offline mode)");
        try
        {
            var line = await _context.Set<StocktakeLineItem>().FirstOrDefaultAsync(l => l.StocktakeLineItemId == lineItemId && l.StocktakeId == stocktakeId);
            if (line == null) return (false, "Line item not found");

            line.Approved = false;
            line.RejectionReason = reason;
            line.DateModified = DateTime.UtcNow;
            line.ModifierId = userId;

            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("StocktakeLineItem", lineItemId, "Reject", $"Rejected: {reason}", userId);
            return (true, "Line item rejected");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Stocktake reject line failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message, object? result)> ProcessIssueWithValidationAsync(InventoryIssue issue, int userId)
    {
        if (!UseDb) return (true, "Issue created (offline mode)", issue);
        try
        {
            if (issue.StoreId.HasValue)
            {
                var hasPerm = await CheckStorePermissionAsync(userId, issue.StoreId.Value, "capture");
                if (!hasPerm) return (false, "User does not have capture permission for this store", null);
            }

            if (!string.IsNullOrEmpty(issue.FinYear))
            {
                var currentMonth = DateTime.UtcNow.Month;
                var isClosed = await IsMonthClosedAsync(issue.FinYear, currentMonth);
                if (isClosed) return (false, "Cannot create issues in a closed period", null);
            }

            foreach (var lineItem in issue.LineItems)
            {
                if (lineItem.InventoryId.HasValue && lineItem.Quantity.HasValue)
                {
                    var inv = await _context.InventoryItems.FindAsync(lineItem.InventoryId.Value);
                    if (inv == null) return (false, $"Inventory item {lineItem.InventoryId} not found", null);
                    if ((inv.Quantity ?? 0) < lineItem.Quantity.Value)
                        return (false, $"Insufficient quantity for item {lineItem.InventoryId}. Available: {inv.Quantity ?? 0}, Requested: {lineItem.Quantity.Value}", null);
                }
            }

            issue.DateCaptured = DateTime.UtcNow;
            issue.CapturerId = userId;
            issue.StatusId = 1;
            await _context.InventoryIssues.AddAsync(issue);
            await _context.SaveChangesAsync();

            foreach (var lineItem in issue.LineItems)
            {
                if (lineItem.InventoryId.HasValue && lineItem.Quantity.HasValue)
                {
                    var inv = await _context.InventoryItems.FindAsync(lineItem.InventoryId.Value);
                    if (inv != null)
                    {
                        inv.Quantity = (inv.Quantity ?? 0) - lineItem.Quantity.Value;
                        inv.DateModified = DateTime.UtcNow;
                        lineItem.Price = inv.UnitPrice;
                        lineItem.DateIssued = DateTime.UtcNow;
                    }
                }
            }

            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("InventoryIssue", issue.IssueId, "Create", $"Issue created with {issue.LineItems.Count} line items", userId);
            return (true, "Issue created successfully", issue);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Issue creation with validation failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed", null);
        }
    }

    public async Task<(bool success, string message)> ProcessReturnWithValidationAsync(InventoryReturn ret, int userId)
    {
        if (!UseDb) return (true, "Return processed (offline mode)");
        try
        {
            ret.DateCaptured = DateTime.UtcNow;
            ret.CapturerId = userId;
            await _context.InventoryReturns.AddAsync(ret);
            await _context.SaveChangesAsync();

            foreach (var lineItem in ret.LineItems)
            {
                if (lineItem.InventoryId.HasValue && lineItem.Quantity.HasValue)
                {
                    var inv = await _context.InventoryItems.FindAsync(lineItem.InventoryId.Value);
                    if (inv != null)
                    {
                        inv.Quantity = (inv.Quantity ?? 0) + lineItem.Quantity.Value;
                        inv.DateModified = DateTime.UtcNow;
                        lineItem.DateReturned = DateTime.UtcNow;
                    }
                }
            }

            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("InventoryReturn", ret.ReturnId, "Create", $"Return processed with {ret.LineItems.Count} line items", userId);
            return (true, "Return processed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Return processing failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message)> ProcessTransferDispatchAsync(int transferId, int userId)
    {
        if (!UseDb) return (true, "Dispatched (offline mode)");
        try
        {
            var transfer = await _context.InventoryTransfers.Include(t => t.LineItems).FirstOrDefaultAsync(t => t.TransferId == transferId);
            if (transfer == null) return (false, "Transfer not found");

            if (transfer.FromStoreId.HasValue)
            {
                var hasPerm = await CheckStorePermissionAsync(userId, transfer.FromStoreId.Value, "capture");
                if (!hasPerm) return (false, "User does not have capture permission for the source store");
            }

            foreach (var line in transfer.LineItems)
            {
                if (line.FromInventoryId.HasValue && line.QuantityToTransfer.HasValue)
                {
                    var inv = await _context.InventoryItems.FindAsync(line.FromInventoryId.Value);
                    if (inv == null) return (false, $"Source inventory item {line.FromInventoryId} not found");
                    if ((inv.Quantity ?? 0) < line.QuantityToTransfer.Value)
                        return (false, $"Insufficient quantity in source for item {line.FromInventoryId}. Available: {inv.Quantity ?? 0}");

                    inv.Quantity = (inv.Quantity ?? 0) - line.QuantityToTransfer.Value;
                    inv.DateModified = DateTime.UtcNow;

                    line.DispatchedById = userId;
                    line.DispatchedByDate = DateTime.UtcNow;
                    line.TransferStatusId = 2;
                }
            }

            transfer.DateModified = DateTime.UtcNow;
            transfer.ModifierId = userId;
            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("InventoryTransfer", transferId, "Dispatch", $"Transfer dispatched. Source quantities deducted.", userId);
            return (true, "Transfer dispatched and source quantities deducted");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Transfer dispatch failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message)> ProcessTransferReceiveAsync(int transferId, int userId)
    {
        if (!UseDb) return (true, "Received (offline mode)");
        try
        {
            var transfer = await _context.InventoryTransfers.Include(t => t.LineItems).FirstOrDefaultAsync(t => t.TransferId == transferId);
            if (transfer == null) return (false, "Transfer not found");

            if (transfer.ToStoreId.HasValue)
            {
                var hasPerm = await CheckStorePermissionAsync(userId, transfer.ToStoreId.Value, "capture");
                if (!hasPerm) return (false, "User does not have capture permission for the destination store");
            }

            foreach (var line in transfer.LineItems)
            {
                if (line.ToInventoryId.HasValue)
                {
                    var inv = await _context.InventoryItems.FindAsync(line.ToInventoryId.Value);
                    if (inv != null)
                    {
                        var qty = line.QuantityReceived ?? line.QuantityToTransfer ?? 0;
                        inv.Quantity = (inv.Quantity ?? 0) + qty;
                        inv.DateModified = DateTime.UtcNow;
                    }
                }

                line.ReceivedById = userId;
                line.ReceivedByDate = DateTime.UtcNow;
                line.TransferStatusId = 3;
                line.TransferReceiveDate = DateTime.UtcNow;
            }

            transfer.DateModified = DateTime.UtcNow;
            transfer.ModifierId = userId;
            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("InventoryTransfer", transferId, "Receive", $"Transfer received. Destination quantities updated.", userId);
            return (true, "Transfer received and destination quantities updated");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Transfer receive failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message)> ProcessTransferRejectAsync(int transferId, string reason, int userId)
    {
        if (!UseDb) return (true, "Rejected (offline mode)");
        try
        {
            var transfer = await _context.InventoryTransfers.Include(t => t.LineItems).FirstOrDefaultAsync(t => t.TransferId == transferId);
            if (transfer == null) return (false, "Transfer not found");

            foreach (var line in transfer.LineItems.Where(l => l.DispatchedByDate != null && l.ReceivedByDate == null))
            {
                if (line.FromInventoryId.HasValue && line.QuantityToTransfer.HasValue)
                {
                    var inv = await _context.InventoryItems.FindAsync(line.FromInventoryId.Value);
                    if (inv != null)
                    {
                        inv.Quantity = (inv.Quantity ?? 0) + line.QuantityToTransfer.Value;
                        inv.DateModified = DateTime.UtcNow;
                    }
                }

                line.RejectedById = userId;
                line.RejectedByDate = DateTime.UtcNow;
                line.RejectionReason = reason;
                line.TransferStatusId = 4;
            }

            transfer.DateModified = DateTime.UtcNow;
            transfer.ModifierId = userId;
            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("InventoryTransfer", transferId, "Reject", $"Transfer rejected: {reason}. Source quantities restored.", userId);
            return (true, "Transfer rejected and source quantities restored");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Transfer reject failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message)> ProcessDisposalApproveAsync(int disposalId, int userId)
    {
        if (!UseDb) return (true, "Approved (offline mode)");
        try
        {
            var disposal = await _context.InventoryDisposals.Include(d => d.LineItems).FirstOrDefaultAsync(d => d.DisposalId == disposalId);
            if (disposal == null) return (false, "Disposal not found");

            foreach (var line in disposal.LineItems)
            {
                line.IsApproved = true;
                line.ApprovedBy = userId;
                line.ApprovedDate = DateTime.UtcNow;

                if (line.QuantityOnHand.HasValue && line.UnitCost.HasValue && line.SalesUnitPrice.HasValue)
                {
                    var costValue = (line.QuantityToDispose ?? 0) * line.UnitCost.Value;
                    var salesValue = (line.QuantityToSell ?? line.QuantityToDispose ?? 0) * line.SalesUnitPrice.Value;
                    line.DisposalValue = costValue;
                    line.TotalCostOfDisposal = costValue - salesValue;
                }
            }

            disposal.DateModified = DateTime.UtcNow;
            disposal.ModifierId = userId;
            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("InventoryDisposal", disposalId, "Approve", $"Disposal approved with {disposal.LineItems.Count} line items. Gain/loss calculated.", userId);
            return (true, "Disposal approved with gain/loss calculation");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Disposal approve failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message)> ProcessDisposalJournalAsync(int disposalId, int userId)
    {
        if (!UseDb) return (true, "Journalled (offline mode)");
        try
        {
            var disposal = await _context.InventoryDisposals.Include(d => d.LineItems).FirstOrDefaultAsync(d => d.DisposalId == disposalId);
            if (disposal == null) return (false, "Disposal not found");

            foreach (var line in disposal.LineItems.Where(l => l.IsApproved == true))
            {
                if (line.CommodityId.HasValue && line.StoreId.HasValue)
                {
                    var inv = await _context.InventoryItems.FirstOrDefaultAsync(i => i.CommodityId == line.CommodityId && i.StoreId == line.StoreId);
                    if (inv != null)
                    {
                        inv.Quantity = (inv.Quantity ?? 0) - (line.QuantityToDispose ?? 0);
                        if (inv.Quantity < 0) inv.Quantity = 0;
                        inv.DateModified = DateTime.UtcNow;
                    }
                }
            }

            disposal.DateModified = DateTime.UtcNow;
            disposal.ModifierId = userId;
            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("InventoryDisposal", disposalId, "Journal", "Disposal journalled. Inventory quantities adjusted.", userId);
            return (true, "Disposal journalled and inventory adjusted");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Disposal journal failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message, object? result)> ProcessCorrectionAsync(InventoryCorrection correction, int userId)
    {
        if (!UseDb) return (true, "Correction processed (offline mode)", correction);
        try
        {
            correction.DateCaptured = DateTime.UtcNow;
            correction.CapturerId = userId;
            correction.DateOfCorrection = DateTime.UtcNow;
            correction.CorrectedBy = userId;

            if (correction.CommodityId.HasValue && correction.StoreId.HasValue)
            {
                var inv = await _context.InventoryItems.FirstOrDefaultAsync(i => i.CommodityId == correction.CommodityId && i.StoreId == correction.StoreId);
                if (inv != null)
                {
                    var oldQty = inv.Quantity ?? 0;
                    var correctionQty = correction.Quantity ?? 0;

                    correction.UnitOfCost = inv.UnitPrice;
                    correction.TotalCost = correctionQty * (inv.UnitPrice ?? 0);

                    if (correction.CorrectionType?.ToLower() == "increase")
                    {
                        inv.Quantity = oldQty + correctionQty;
                        correction.CommodityDr = correction.TotalCost;
                        correction.CommodityCr = 0;
                    }
                    else
                    {
                        inv.Quantity = Math.Max(0, oldQty - correctionQty);
                        correction.CommodityDr = 0;
                        correction.CommodityCr = correction.TotalCost;
                    }

                    inv.DateModified = DateTime.UtcNow;
                }
            }

            await _context.InventoryCorrections.AddAsync(correction);
            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("InventoryCorrection", correction.InventoryCorrectionId, "Create",
                $"Correction: {correction.CorrectionType} qty {correction.Quantity} for commodity {correction.CommodityId}", userId);
            return (true, "Correction processed", correction);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Correction processing failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed", null);
        }
    }

    public async Task<(bool success, string message)> ProcessValuationApproveAsync(int valuationId, int userId)
    {
        if (!UseDb) return (true, "Approved (offline mode)");
        try
        {
            var valuation = await _context.InventoryValuations.FindAsync(valuationId);
            if (valuation == null) return (false, "Valuation not found");

            valuation.StatusId = 2;
            valuation.DateModified = DateTime.UtcNow;
            valuation.ModifierId = userId;

            if (valuation.InventoryId.HasValue)
            {
                var inv = await _context.InventoryItems.FindAsync(valuation.InventoryId.Value);
                if (inv != null && valuation.ValuatedCost.HasValue)
                {
                    if (valuation.ValuationMethodId == 1)
                    {
                        inv.FifoUnitTotal = valuation.UnitCost;
                        inv.FifoValueTotal = valuation.ValuatedCost;
                    }
                    else
                    {
                        inv.CommodityWeightedAvg = valuation.UnitCost;
                    }
                    inv.DateModified = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            var methodName = valuation.ValuationMethodId == 1 ? "FIFO" : "WAC";
            await _auditService.LogActionAsync("InventoryValuation", valuationId, "Approve",
                $"Valuation approved using {methodName} method. Cost: {valuation.ValuatedCost}", userId);
            return (true, $"Valuation approved ({methodName})");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Valuation approve failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message)> ProcessValuationRejectAsync(int valuationId, string reason, int userId)
    {
        if (!UseDb) return (true, "Rejected (offline mode)");
        try
        {
            var valuation = await _context.InventoryValuations.FindAsync(valuationId);
            if (valuation == null) return (false, "Valuation not found");

            valuation.StatusId = 3;
            valuation.Comment = reason;
            valuation.DateModified = DateTime.UtcNow;
            valuation.ModifierId = userId;

            var rejReason = new ValuationRejectionReason
            {
                ValuationId = valuationId,
                RejectionReason = reason,
                RejectedById = userId,
                RejectedDate = DateTime.UtcNow,
                Enabled = true,
                DateCaptured = DateTime.UtcNow,
                CapturerId = userId
            };
            await _context.ValuationRejectionReasons.AddAsync(rejReason);
            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("InventoryValuation", valuationId, "Reject", $"Valuation rejected: {reason}", userId);
            return (true, "Valuation rejected");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Valuation reject failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<object> GetReplenishmentSuggestionsAsync()
    {
        if (!UseDb) return new { suggestions = Array.Empty<object>(), total = 0 };
        try
        {
            var lowStockItems = await _context.InventoryItems
                .Where(i => i.Quantity.HasValue && i.ReorderLevel.HasValue && i.Quantity <= i.ReorderLevel)
                .OrderBy(i => i.Quantity)
                .Take(200)
                .ToListAsync();

            var commodityIds = lowStockItems.Select(i => i.CommodityId).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
            var commodities = await _context.Commodities.Where(c => commodityIds.Contains(c.CommodityId)).ToDictionaryAsync(c => c.CommodityId);

            var suggestions = lowStockItems.Select(item =>
            {
                var reorderQty = (item.MaximumLevel ?? item.ReorderQuantity ?? 0) - (item.Quantity ?? 0);
                if (reorderQty <= 0) reorderQty = item.ReorderQuantity ?? 10;
                commodities.TryGetValue(item.CommodityId ?? 0, out var commodity);
                return new
                {
                    inventoryId = item.InventoryId,
                    commodityId = item.CommodityId,
                    commodityDesc = commodity?.CommodityDesc,
                    storeId = item.StoreId,
                    currentQuantity = item.Quantity,
                    reorderLevel = item.ReorderLevel,
                    minimumLevel = item.MinimumLevel,
                    maximumLevel = item.MaximumLevel,
                    suggestedOrderQuantity = reorderQty,
                    estimatedCost = reorderQty * (item.UnitPrice ?? 0),
                    priority = (item.Quantity ?? 0) <= (item.MinimumLevel ?? 0) ? "Critical" :
                               (item.Quantity ?? 0) <= (item.ReorderLevel ?? 0) ? "High" : "Normal"
                };
            }).ToList();

            return new
            {
                suggestions,
                total = suggestions.Count,
                criticalCount = suggestions.Count(s => s.priority == "Critical"),
                highCount = suggestions.Count(s => s.priority == "High"),
                totalEstimatedCost = suggestions.Sum(s => s.estimatedCost)
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Replenishment suggestions failed");
            _dbChecker.MarkUnavailable();
            return new { suggestions = Array.Empty<object>(), total = 0 };
        }
    }

    public async Task<(bool success, string message)> CloseMonthEndAsync(string finYear, int month, int userId)
    {
        if (!UseDb) return (true, "Period closed (offline mode)");
        try
        {
            var exceptionsResult = await GetMonthEndExceptionsAsync(finYear, null);
            var canCloseProperty = exceptionsResult.GetType().GetProperty("canClose");
            if (canCloseProperty != null)
            {
                var canClose = (bool)(canCloseProperty.GetValue(exceptionsResult) ?? true);
                if (!canClose) return (false, "Cannot close period: outstanding exceptions exist (open issues, in-transit transfers, or pending stocktakes)");
            }

            var existing = await _context.InvenMonthEnds
                .FirstOrDefaultAsync(m => m.FinYear == finYear && m.Month == month);

            if (existing != null)
            {
                if (existing.IsClosed == true) return (false, "Period is already closed");
                existing.IsClosed = true;
                existing.ClosedDate = DateTime.UtcNow;
                existing.ClosedById = userId;
            }
            else
            {
                var newClosure = new InvenMonthEnd
                {
                    FinYear = finYear,
                    Month = month,
                    IsClosed = true,
                    ClosedDate = DateTime.UtcNow,
                    ClosedById = userId,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = userId
                };
                await _context.InvenMonthEnds.AddAsync(newClosure);
            }

            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("MonthEnd", month, "Close",
                $"Period {month} closed for fin year {finYear}", userId);
            return (true, $"Period {month} closed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Month-end close failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<(bool success, string message)> ReopenMonthEndAsync(string finYear, int month, int userId)
    {
        if (!UseDb) return (true, "Period reopened (offline mode)");
        try
        {
            var existing = await _context.InvenMonthEnds
                .FirstOrDefaultAsync(m => m.FinYear == finYear && m.Month == month);

            if (existing == null || existing.IsClosed != true) return (false, "Period is not closed");

            existing.IsClosed = false;
            existing.ClosedDate = null;
            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("MonthEnd", month, "Reopen",
                $"Period {month} reopened for fin year {finYear}", userId);
            return (true, $"Period {month} reopened successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Month-end reopen failed");
            _dbChecker.MarkUnavailable();
            return (false, "Processing failed");
        }
    }

    public async Task<object> GetMonthEndStatusAsync(string finYear)
    {
        if (!UseDb) return new { periods = Array.Empty<object>() };
        try
        {
            var periods = await _context.InvenMonthEnds
                .Where(m => m.FinYear == finYear)
                .OrderBy(m => m.Month)
                .Select(m => new
                {
                    month = m.Month,
                    monthName = m.MonthName,
                    isClosed = m.IsClosed,
                    closedDate = m.ClosedDate,
                    closedById = m.ClosedById
                })
                .ToListAsync();

            var exceptions = await _context.MonthEndExceptions
                .Where(m => m.FinYearEnd == finYear)
                .CountAsync();

            return new { periods, exceptionCount = exceptions, finYear };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Month-end status failed");
            _dbChecker.MarkUnavailable();
            return new { periods = Array.Empty<object>() };
        }
    }

    public async Task<object> GetMonthEndExceptionsAsync(string finYear, int? storeId)
    {
        if (!UseDb) return new List<object>();
        try
        {
            var issueQuery = _context.InventoryIssues
                .Where(i => i.FinYear == finYear && i.StatusId == 1 && i.Canceled != true);
            if (storeId.HasValue) issueQuery = issueQuery.Where(i => i.StoreId == storeId);
            var openIssues = await issueQuery.CountAsync();

            var transferQuery = _context.InventoryTransfers
                .Include(t => t.LineItems)
                .Where(t => t.FinYear == finYear);
            if (storeId.HasValue) transferQuery = transferQuery.Where(t => t.FromStoreId == storeId || t.ToStoreId == storeId);
            var pendingTransfers = await transferQuery
                .Where(t => t.LineItems.Any(l => l.TransferStatusId == 2))
                .CountAsync();

            var stocktakeQuery = _context.Stocktakes
                .Where(s => s.FinYear == finYear && s.IsApproved != true && s.IsCancelled != true);
            if (storeId.HasValue) stocktakeQuery = stocktakeQuery.Where(s => s.StoreId == storeId);
            var pendingStocktakes = await stocktakeQuery.CountAsync();

            var exceptions = new List<object>();
            if (openIssues > 0)
                exceptions.Add(new { type = "OpenIssues", count = openIssues, description = $"{openIssues} unresolved issue(s) pending approval" });
            if (pendingTransfers > 0)
                exceptions.Add(new { type = "InTransit", count = pendingTransfers, description = $"{pendingTransfers} transfer(s) still in transit" });
            if (pendingStocktakes > 0)
                exceptions.Add(new { type = "PendingStocktake", count = pendingStocktakes, description = $"{pendingStocktakes} stocktake(s) not yet approved" });

            return new { exceptions, canClose = exceptions.Count == 0, finYear, storeId };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Month-end exceptions check failed");
            _dbChecker.MarkUnavailable();
            return new List<object>();
        }
    }
}
