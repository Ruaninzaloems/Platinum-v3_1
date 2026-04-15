using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _service;
    private readonly IInventoryBusinessLogicService _bizLogic;

    public InventoryController(IInventoryService service, IInventoryBusinessLogicService bizLogic) { _service = service; _bizLogic = bizLogic; }

    private int GetAuthenticatedUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && int.TryParse(claim.Value, out var id) ? id : 0;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult> GetDashboard()
    {
        var result = await _service.GetDashboardAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("stores")]
    public async Task<ActionResult> GetStores()
    {
        var result = await _service.GetStoresAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("items/low-stock")]
    public async Task<ActionResult> GetLowStockItems()
    {
        var result = await _service.GetLowStockItemsAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("items")]
    public async Task<ActionResult> GetItems([FromQuery] string? search, [FromQuery] int? storeId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetItemsAsync(search, storeId, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("items/{id}")]
    public async Task<ActionResult> GetItemById(int id)
    {
        var result = await _service.GetItemByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("items")]
    public async Task<ActionResult> CreateItem([FromBody] object dto)
    {
        var result = await _service.CreateItemAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("items/{id}")]
    public async Task<ActionResult> UpdateItem(int id, [FromBody] object dto)
    {
        var result = await _service.UpdateItemAsync(id, dto);
        return Ok(ApiResponse.Ok(result ? "Updated" : "Not found"));
    }

    [HttpGet("movements")]
    public async Task<ActionResult> GetMovements([FromQuery] int? commodityId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (commodityId.HasValue)
        {
            var result = await _service.GetStockMovementsAsync(commodityId.Value);
            return Ok(ApiResponse<object>.Ok(result));
        }
        return Ok(ApiResponse<object>.Ok(new { items = Array.Empty<object>(), total = 0, page, pageSize }));
    }

    [HttpGet("commodities")]
    public async Task<ActionResult<PagedApiResponse<object>>> GetCommodities(
        [FromQuery] string? search, [FromQuery] int? storeId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetCommoditiesAsync(search, storeId, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("commodity-approvals")]
    public async Task<ActionResult> GetCommodityApprovals([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetCommodityApprovalsAsync(page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("commodity-approvals")]
    public async Task<ActionResult> CreateCommodity([FromBody] object dto)
    {
        var result = await _service.CreateCommodityAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("commodity-approvals/{id}")]
    public async Task<ActionResult> UpdateCommodityApproval(int id, [FromBody] object dto)
    {
        var result = await _service.UpdateCommodityAsync(id, dto);
        return Ok(ApiResponse.Ok(result ? "Updated" : "Not found"));
    }

    [HttpPut("commodity-approvals/{id}/approve")]
    public async Task<ActionResult> ApproveCommodity(int id)
    {
        var result = await _service.ApproveCommodityAsync(id);
        return Ok(ApiResponse.Ok(result ? "Approved" : "Not found"));
    }

    [HttpPut("commodity-approvals/{id}/reject")]
    public async Task<ActionResult> RejectCommodity(int id, [FromBody] RejectDto dto)
    {
        var result = await _service.RejectCommodityAsync(id, dto.Reason ?? "");
        return Ok(ApiResponse.Ok(result ? "Rejected" : "Not found"));
    }

    [HttpPut("commodities/{id}/cancel")]
    public async Task<ActionResult> CancelCommodity(int id)
    {
        var result = await _service.CancelCommodityAsync(id);
        return Ok(ApiResponse.Ok(result ? "Cancelled" : "Not found"));
    }

    [HttpPost("commodities/take-on")]
    public async Task<ActionResult> BulkUploadCommodities([FromBody] List<object> items)
    {
        var result = await _service.BulkUploadCommoditiesAsync(items);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("issues")]
    public async Task<ActionResult<PagedApiResponse<object>>> GetIssues(
        [FromQuery] string? finYear, [FromQuery] int? statusId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetIssuesAsync(finYear, statusId, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("issues")]
    public async Task<ActionResult> CreateIssue([FromBody] object dto)
    {
        var result = await _service.CreateIssueAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("stocktakes")]
    public async Task<ActionResult<PagedApiResponse<object>>> GetStocktakes(
        [FromQuery] string? finYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetStocktakesAsync(finYear, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("stocktakes")]
    public async Task<ActionResult> CreateStocktake([FromBody] object dto)
    {
        var result = await _service.CreateStocktakeAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("stocktakes/{id}/verify")]
    public async Task<ActionResult> VerifyStocktake(int id, [FromBody] object dto)
    {
        var result = await _service.VerifyStocktakeAsync(id, dto);
        return Ok(ApiResponse.Ok(result ? "Verified" : "Not found"));
    }

    [HttpPut("stocktakes/{id}/approve")]
    public async Task<ActionResult> ApproveStocktake(int id, [FromBody] object dto)
    {
        var result = await _service.ApproveStocktakeAsync(id, dto);
        return Ok(ApiResponse.Ok(result ? "Approved" : "Not found"));
    }

    [HttpPut("stocktakes/{id}/reject-line")]
    public async Task<ActionResult> RejectStocktakeLine(int id, [FromBody] object dto)
    {
        var result = await _service.RejectStocktakeLineAsync(id, dto);
        return Ok(ApiResponse.Ok(result ? "Rejected" : "Not found"));
    }

    [HttpDelete("stocktakes/{id}")]
    public async Task<ActionResult> DeleteStocktake(int id)
    {
        var result = await _service.DeleteStocktakeAsync(id);
        return Ok(ApiResponse.Ok(result ? "Deleted" : "Not found"));
    }

    [HttpGet("donations")]
    public async Task<ActionResult> GetDonations([FromQuery] string? finYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetDonationsAsync(finYear, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("donations")]
    public async Task<ActionResult> CreateDonation([FromBody] object dto)
    {
        var result = await _service.CreateDonationAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("disposals")]
    public async Task<ActionResult> GetDisposals([FromQuery] string? finYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetDisposalsAsync(finYear, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("disposals")]
    public async Task<ActionResult> CreateDisposal([FromBody] object dto)
    {
        var result = await _service.CreateDisposalAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("disposals/{id}/approve")]
    public async Task<ActionResult> ApproveDisposal(int id)
    {
        var result = await _service.ApproveDisposalAsync(id);
        return Ok(ApiResponse.Ok(result ? "Approved" : "Not found"));
    }

    [HttpPut("disposals/{id}/decline")]
    public async Task<ActionResult> DeclineDisposal(int id, [FromBody] RejectDto dto)
    {
        var result = await _service.DeclineDisposalAsync(id, dto.Reason ?? "");
        return Ok(ApiResponse.Ok(result ? "Declined" : "Not found"));
    }

    [HttpPut("disposals/{id}/journal")]
    public async Task<ActionResult> JournalDisposal(int id, [FromBody] object dto)
    {
        var result = await _service.JournalDisposalAsync(id, dto);
        return Ok(ApiResponse.Ok(result ? "Journalled" : "Not found"));
    }

    [HttpGet("supplier-returns")]
    public async Task<ActionResult> GetSupplierReturns([FromQuery] string? finYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetSupplierReturnsAsync(finYear, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("supplier-returns")]
    public async Task<ActionResult> CreateSupplierReturn([FromBody] object dto)
    {
        var result = await _service.CreateSupplierReturnAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("adjustments")]
    public async Task<ActionResult> GetAdjustments([FromQuery] string? finYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAdjustmentsAsync(finYear, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("adjustments")]
    public async Task<ActionResult> CreateAdjustment([FromBody] object dto)
    {
        var result = await _service.CreateAdjustmentAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("valuations")]
    public async Task<ActionResult> GetValuations([FromQuery] string? finYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetValuationsAsync(finYear, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("valuations")]
    public async Task<ActionResult> CreateValuation([FromBody] object dto)
    {
        var result = await _service.CreateValuationAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("valuations/{id}")]
    public async Task<ActionResult> UpdateValuation(int id, [FromBody] object dto)
    {
        var result = await _service.UpdateValuationAsync(id, dto);
        return Ok(ApiResponse.Ok(result ? "Updated" : "Not found"));
    }

    [HttpPut("valuations/{id}/reject")]
    public async Task<ActionResult> RejectValuation(int id, [FromBody] RejectDto dto)
    {
        var result = await _service.RejectValuationAsync(id, dto.Reason ?? "");
        return Ok(ApiResponse.Ok(result ? "Rejected" : "Not found"));
    }

    [HttpGet("transfers")]
    public async Task<ActionResult> GetTransfers([FromQuery] string? finYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetTransfersAsync(finYear, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("transfers")]
    public async Task<ActionResult> CreateTransfer([FromBody] object dto)
    {
        var result = await _service.CreateTransferAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("transfers/{id}/dispatch")]
    public async Task<ActionResult> DispatchTransfer(int id, [FromBody] object dto)
    {
        var result = await _service.DispatchTransferAsync(id, dto);
        return Ok(ApiResponse.Ok(result ? "Dispatched" : "Not found"));
    }

    [HttpPut("transfers/{id}/receive")]
    public async Task<ActionResult> ReceiveTransfer(int id, [FromBody] object dto)
    {
        var result = await _service.ReceiveTransferAsync(id, dto);
        return Ok(ApiResponse.Ok(result ? "Received" : "Not found"));
    }

    [HttpPut("transfers/{id}/reject")]
    public async Task<ActionResult> RejectTransfer(int id, [FromBody] RejectDto dto)
    {
        var result = await _service.RejectTransferAsync(id, dto.Reason ?? "");
        return Ok(ApiResponse.Ok(result ? "Rejected" : "Not found"));
    }

    [HttpPut("{type}/{id}/approve")]
    public async Task<ActionResult> ApproveRecord(string type, int id)
    {
        var result = await _service.ApproveRecordAsync(type, id);
        return Ok(ApiResponse.Ok(result ? "Approved" : "Not found"));
    }

    [HttpGet("store-commodity-links")]
    public async Task<ActionResult> GetStoreCommodityLinks([FromQuery] int? storeId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetStoreCommodityLinksAsync(storeId, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("store-commodity-links")]
    public async Task<ActionResult> CreateStoreCommodityLink([FromBody] object dto)
    {
        var result = await _service.CreateStoreCommodityLinkAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("store-commodity-links/{id}")]
    public async Task<ActionResult> UpdateStoreCommodityLink(int id, [FromBody] object dto)
    {
        var result = await _service.UpdateStoreCommodityLinkAsync(id, dto);
        return Ok(ApiResponse.Ok(result ? "Updated" : "Not found"));
    }

    [HttpGet("return-to-store")]
    public async Task<ActionResult> GetReturnToStore([FromQuery] string? finYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetReturnToStoreAsync(finYear, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("return-to-store")]
    public async Task<ActionResult> CreateReturnToStore([FromBody] object dto)
    {
        var result = await _service.CreateReturnToStoreAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("return-to-store/{id}/approve")]
    public async Task<ActionResult> ApproveReturnToStore(int id)
    {
        var result = await _service.ApproveReturnToStoreAsync(id);
        return Ok(ApiResponse.Ok(result ? "Approved" : "Not found"));
    }

    [HttpPut("return-to-store/{id}/submit")]
    public async Task<ActionResult> SubmitReturnForApproval(int id)
    {
        var result = await _service.SubmitReturnForApprovalAsync(id);
        return Ok(ApiResponse.Ok(result ? "Submitted" : "Not found"));
    }

    [HttpGet("closure/periods")]
    public async Task<ActionResult> GetClosurePeriods([FromQuery] string? finYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetClosurePeriodsAsync(finYear, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("closure/periods")]
    public async Task<ActionResult> CreateClosurePeriod([FromBody] object dto)
    {
        var result = await _service.CreateClosurePeriodAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("closure/periods/{id}")]
    public async Task<ActionResult> UpdateClosurePeriod(int id, [FromBody] object dto)
    {
        var result = await _service.UpdateClosurePeriodAsync(id, dto);
        return Ok(ApiResponse.Ok(result ? "Updated" : "Not found"));
    }

    [HttpGet("closure/config")]
    public async Task<ActionResult> GetClosureConfig()
    {
        var result = await _service.GetClosureConfigAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("closure/config")]
    public async Task<ActionResult> SaveClosureConfig([FromBody] object dto)
    {
        var result = await _service.SaveClosureConfigAsync(dto);
        return Ok(ApiResponse.Ok(result ? "Saved" : "Failed"));
    }

    [HttpGet("closure/exceptions")]
    public async Task<ActionResult> GetClosureExceptions([FromQuery] string? finYear)
    {
        var result = await _service.GetClosureExceptionsAsync(finYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("procurement-pipeline")]
    public async Task<ActionResult> GetProcurementPipeline([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetProcurementPipelineAsync(page, pageSize);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("procurement-pipeline/{id}/advance")]
    public async Task<ActionResult> AdvancePipelineItem(int id)
    {
        var result = await _service.AdvancePipelineItemAsync(id);
        return Ok(ApiResponse.Ok(result ? "Advanced" : "Not found"));
    }

    [HttpPost("procurement-pipeline/{id}/inspect")]
    public async Task<ActionResult> InspectPipelineItem(int id)
    {
        var result = await _service.InspectPipelineItemAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("pipeline")]
    public async Task<ActionResult> GetPipeline()
    {
        var result = await _service.GetProcurementPipelineAsync(1, 100);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("replenishment-rules")]
    public async Task<ActionResult> GetReplenishmentRules()
    {
        var result = await _service.GetReplenishmentRulesAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("trigger-replenishment")]
    public async Task<ActionResult> TriggerReplenishment()
    {
        var result = await _service.TriggerReplenishmentAsync();
        return Ok(ApiResponse.Ok("Replenishment triggered"));
    }

    [HttpGet("ai-insights")]
    public async Task<ActionResult> GetAiInsights()
    {
        var result = await _service.GetAiInsightsAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("bin-locations/{storeId}")]
    public async Task<ActionResult> GetBinLocations(int storeId)
    {
        var result = await _service.GetBinLocationsAsync(storeId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("commodity-vendors")]
    public async Task<ActionResult> GetAllCommodityVendors([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllCommodityVendorsAsync(page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("commodity-vendors/{commodityId}")]
    public async Task<ActionResult> GetCommodityVendors(int commodityId)
    {
        var result = await _service.GetCommodityVendorsAsync(commodityId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("commodity-vendors")]
    public async Task<ActionResult> CreateCommodityVendor([FromBody] object dto)
    {
        var result = await _service.CreateCommodityVendorAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("barcodes/lookup")]
    public async Task<ActionResult> LookupBarcode([FromQuery] string barcode)
    {
        var result = await _service.LookupBarcodeAsync(barcode);
        if (result == null) return NotFound(ApiResponse.Fail("Barcode not found"));
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("barcodes/{commodityId}")]
    public async Task<ActionResult> GetBarcodes(int commodityId)
    {
        var result = await _service.GetBarcodesForCommodityAsync(commodityId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("notifications")]
    public async Task<ActionResult> GetNotifications([FromQuery] int? userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetNotificationsAsync(userId, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("notifications")]
    public async Task<ActionResult> CreateNotification([FromBody] object dto)
    {
        var result = await _service.CreateNotificationAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("notifications/{id}/read")]
    public async Task<ActionResult> MarkNotificationRead(int id)
    {
        var result = await _service.MarkNotificationReadAsync(id);
        return Ok(ApiResponse.Ok(result ? "Marked as read" : "Not found"));
    }

    [HttpGet("transfer-location/{transferId}")]
    public async Task<ActionResult> GetTransferLocationDetails(int transferId)
    {
        var result = await _service.GetTransferLocationDetailsAsync(transferId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("transfer-location/{transferId}")]
    public async Task<ActionResult> CreateTransferLocationDetail(int transferId, [FromBody] object dto)
    {
        var result = await _service.CreateTransferLocationDetailAsync(dto);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("reconciliation-exceptions")]
    public async Task<ActionResult> GetReconciliationExceptions([FromQuery] string? finYear, [FromQuery] int? storeId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetReconciliationExceptionsAsync(finYear, storeId, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("reports/stocklist")]
    public async Task<ActionResult> GetReportStocklist([FromQuery] string? finYear, [FromQuery] int? storeId)
    {
        var result = await _service.GetReportStocklistAsync(finYear, storeId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("reports/stock-movement")]
    public async Task<ActionResult> GetReportStockMovement([FromQuery] string? finYear, [FromQuery] int? storeId)
    {
        var result = await _service.GetReportStockMovementAsync(finYear, storeId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("store-permissions/{userId}")]
    public async Task<ActionResult> GetUserStoreIds(int userId)
    {
        var result = await _bizLogic.GetUserStoreIdsAsync(userId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("store-permissions/{userId}/{storeId}")]
    public async Task<ActionResult> CheckStorePermission(int userId, int storeId, [FromQuery] string permissionType = "view")
    {
        var allowed = await _bizLogic.CheckStorePermissionAsync(userId, storeId, permissionType);
        return Ok(ApiResponse<object>.Ok(new { userId, storeId, permissionType, allowed }));
    }

    [HttpPost("stocktakes/{id}/count")]
    public async Task<ActionResult> CountStocktake(int id)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessStocktakeCountAsync(id, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("stocktakes/{id}/check")]
    public async Task<ActionResult> CheckStocktake(int id)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessStocktakeCheckAsync(id, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("stocktakes/{id}/verify")]
    public async Task<ActionResult> VerifyStocktake(int id)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessStocktakeVerifyAsync(id, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("stocktakes/{id}/approve-workflow")]
    public async Task<ActionResult> ApproveStocktakeWorkflow(int id)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessStocktakeApproveAsync(id, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("stocktakes/{id}/reject-line/{lineItemId}")]
    public async Task<ActionResult> RejectStocktakeLine(int id, int lineItemId, [FromBody] RejectDto dto)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessStocktakeRejectLineAsync(id, lineItemId, dto.Reason ?? "", userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("issues/validated")]
    public async Task<ActionResult> CreateIssueValidated([FromBody] CreateIssueDto dto)
    {
        var userId = GetAuthenticatedUserId();
        var issue = new InventoryIssue
        {
            StoreId = dto.StoreId,
            FinYear = dto.FinYear,
            InvRequisitionId = dto.InvRequisitionId,
            UniqueInventoryReference = dto.UniqueInventoryReference,
            LineItems = dto.LineItems?.Select(l => new InventoryIssueLineItem
            {
                InventoryId = l.InventoryId,
                Quantity = l.Quantity,
                EmployeeId = l.EmployeeId,
                BinLocationId = l.BinLocationId,
                UomCode = l.UomCode,
                IssuedToName = l.IssuedToName,
                FinYear = dto.FinYear
            }).ToList() ?? new List<InventoryIssueLineItem>()
        };

        var (success, message, result) = await _bizLogic.ProcessIssueWithValidationAsync(issue, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse<object>.Ok(result!));
    }

    [HttpPost("returns/validated")]
    public async Task<ActionResult> CreateReturnValidated([FromBody] CreateReturnDto dto)
    {
        var userId = GetAuthenticatedUserId();
        var ret = new InventoryReturn
        {
            StoreId = dto.StoreId,
            FinYear = dto.FinYear,
            ReturnType = dto.ReturnType,
            UniqueInventoryReference = dto.UniqueInventoryReference,
            LineItems = dto.LineItems?.Select(l => new InventoryReturnLineItem
            {
                InventoryId = l.InventoryId,
                Quantity = l.Quantity,
                EmployeeId = l.EmployeeId,
                BinLocationId = l.BinLocationId,
                Reason = l.Reason
            }).ToList() ?? new List<InventoryReturnLineItem>()
        };

        var (success, message) = await _bizLogic.ProcessReturnWithValidationAsync(ret, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("transfers/{id}/dispatch")]
    public async Task<ActionResult> DispatchTransferWorkflow(int id)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessTransferDispatchAsync(id, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("transfers/{id}/receive")]
    public async Task<ActionResult> ReceiveTransferWorkflow(int id)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessTransferReceiveAsync(id, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("transfers/{id}/reject-workflow")]
    public async Task<ActionResult> RejectTransferWorkflow(int id, [FromBody] RejectDto dto)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessTransferRejectAsync(id, dto.Reason ?? "", userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("disposals/{id}/approve-workflow")]
    public async Task<ActionResult> ApproveDisposalWorkflow(int id)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessDisposalApproveAsync(id, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("disposals/{id}/journal")]
    public async Task<ActionResult> JournalDisposalWorkflow(int id)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessDisposalJournalAsync(id, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("corrections/validated")]
    public async Task<ActionResult> CreateCorrectionValidated([FromBody] CreateCorrectionDto dto)
    {
        var userId = GetAuthenticatedUserId();
        var correction = new InventoryCorrection
        {
            CommodityId = dto.CommodityId,
            CommodityDesc = dto.CommodityDesc,
            StoreId = dto.StoreId,
            Quantity = dto.Quantity,
            CorrectionType = dto.CorrectionType,
            JournoDesc = dto.JournoDesc,
            BinLocation = dto.BinLocation,
            CorrectRefNumber = dto.CorrectRefNumber,
            UomId = dto.UomId,
            ProjectId = dto.ProjectId
        };

        var (success, message, result) = await _bizLogic.ProcessCorrectionAsync(correction, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse<object>.Ok(result!));
    }

    [HttpPost("valuations/{id}/approve-workflow")]
    public async Task<ActionResult> ApproveValuationWorkflow(int id)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessValuationApproveAsync(id, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("valuations/{id}/reject-workflow")]
    public async Task<ActionResult> RejectValuationWorkflow(int id, [FromBody] RejectDto dto)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ProcessValuationRejectAsync(id, dto.Reason ?? "", userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpGet("replenishment/suggestions")]
    public async Task<ActionResult> GetReplenishmentSuggestions()
    {
        var result = await _bizLogic.GetReplenishmentSuggestionsAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("month-end/status")]
    public async Task<ActionResult> GetMonthEndStatus([FromQuery] string finYear)
    {
        var result = await _bizLogic.GetMonthEndStatusAsync(finYear);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("month-end/exceptions")]
    public async Task<ActionResult> GetMonthEndExceptions([FromQuery] string finYear, [FromQuery] int? storeId)
    {
        var result = await _bizLogic.GetMonthEndExceptionsAsync(finYear, storeId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("month-end/close")]
    public async Task<ActionResult> CloseMonthEnd([FromBody] MonthEndActionDto dto)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.CloseMonthEndAsync(dto.FinYear ?? "", dto.Month, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpPost("month-end/reopen")]
    public async Task<ActionResult> ReopenMonthEnd([FromBody] MonthEndActionDto dto)
    {
        var userId = GetAuthenticatedUserId();
        var (success, message) = await _bizLogic.ReopenMonthEndAsync(dto.FinYear ?? "", dto.Month, userId);
        if (!success) return BadRequest(ApiResponse.Fail(message));
        return Ok(ApiResponse.Ok(message));
    }

    [HttpGet("month-end/check-closed")]
    public async Task<ActionResult> CheckMonthClosed([FromQuery] string finYear, [FromQuery] int month)
    {
        var isClosed = await _bizLogic.IsMonthClosedAsync(finYear, month);
        return Ok(ApiResponse<object>.Ok(new { finYear, month, isClosed }));
    }
}

public class RejectDto
{
    public string? Reason { get; set; }
}

public class MonthEndActionDto
{
    public string? FinYear { get; set; }
    public int Month { get; set; }
}

public class CreateIssueDto
{
    public int? StoreId { get; set; }
    public string? FinYear { get; set; }
    public int? InvRequisitionId { get; set; }
    public string? UniqueInventoryReference { get; set; }
    public List<IssueLineItemDto>? LineItems { get; set; }
}

public class IssueLineItemDto
{
    public int? InventoryId { get; set; }
    public decimal? Quantity { get; set; }
    public int? EmployeeId { get; set; }
    public int? BinLocationId { get; set; }
    public string? UomCode { get; set; }
    public string? IssuedToName { get; set; }
}

public class CreateReturnDto
{
    public int? StoreId { get; set; }
    public string? FinYear { get; set; }
    public byte? ReturnType { get; set; }
    public string? UniqueInventoryReference { get; set; }
    public List<ReturnLineItemDto>? LineItems { get; set; }
}

public class ReturnLineItemDto
{
    public int? InventoryId { get; set; }
    public decimal? Quantity { get; set; }
    public int? EmployeeId { get; set; }
    public int? BinLocationId { get; set; }
    public string? Reason { get; set; }
}

public class CreateCorrectionDto
{
    public int? CommodityId { get; set; }
    public string? CommodityDesc { get; set; }
    public int? StoreId { get; set; }
    public decimal? Quantity { get; set; }
    public string? CorrectionType { get; set; }
    public string? JournoDesc { get; set; }
    public string? BinLocation { get; set; }
    public string? CorrectRefNumber { get; set; }
    public int? UomId { get; set; }
    public int? ProjectId { get; set; }
}
