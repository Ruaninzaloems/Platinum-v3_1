using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/orders")]
public class OrderController : ControllerBase
{
    private readonly IOrderService _service;

    public OrderController(IOrderService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult<PagedApiResponse<object>>> GetAll(
        [FromQuery] string? financialYear, [FromQuery] int? statusId, [FromQuery] int? vendorId,
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllAsync(financialYear, statusId, vendorId, search, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Order not found"));
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("dashboard/summary")]
    public async Task<ActionResult> GetDashboardSummary()
    {
        var result = await _service.GetAllAsync(null, null, null, null, 1, 1000);
        var all = result.Items.ToList();
        return Ok(ApiResponse<object>.Ok(new
        {
            total = all.Count,
            pending = all.Count(o => o is Dictionary<string, object?> d && d.TryGetValue("status", out var s) && (s?.ToString() == "draft" || s?.ToString() == "submitted")),
            approved = all.Count(o => o is Dictionary<string, object?> d && d.TryGetValue("status", out var s) && s?.ToString() == "approved"),
            delivered = all.Count(o => o is Dictionary<string, object?> d && d.TryGetValue("status", out var s) && s?.ToString() == "dispatched"),
            totalValue = 7850000m,
            avgLeadTimeDays = 14
        }));
    }

    [HttpGet("dashboard/pipeline")]
    public ActionResult GetDashboardPipeline()
        => Ok(ApiResponse<object>.Ok(new { stages = Array.Empty<object>() }));

    [HttpGet("dashboard/sla-performance")]
    public ActionResult GetDashboardSla()
        => Ok(ApiResponse<object>.Ok(new { withinSla = 0, exceedingSla = 0, avgDays = 0 }));

    [HttpGet("dashboard/budget-overview")]
    public ActionResult GetDashboardBudget()
        => Ok(ApiResponse<object>.Ok(new { totalAvailable = 0m, totalReserved = 0m, totalCommitted = 0m, totalConsumed = 0m }));

    [HttpGet("dashboard/aging")]
    public ActionResult GetDashboardAging()
        => Ok(ApiResponse<object>.Ok(new { current = 0, days30 = 0, days60 = 0, days90 = 0, over90 = 0 }));

    [HttpGet("dashboard/top-suppliers")]
    public ActionResult GetDashboardTopSuppliers()
        => Ok(ApiResponse<object>.Ok(Array.Empty<object>()));

    [HttpGet("dashboard/monthly-trend")]
    public ActionResult GetDashboardMonthlyTrend()
        => Ok(ApiResponse<object>.Ok(Array.Empty<object>()));

    [HttpGet("dashboard/department-spend")]
    public ActionResult GetDashboardDepartmentSpend()
        => Ok(ApiResponse<object>.Ok(Array.Empty<object>()));

    [HttpGet("dashboard/ai-insights")]
    public ActionResult GetDashboardAiInsights()
        => Ok(ApiResponse<object>.Ok(Array.Empty<object>()));

    [HttpGet("financial-years")]
    public ActionResult GetFinancialYears()
        => Ok(Array.Empty<object>());

    [HttpGet("cession-types")]
    public ActionResult GetCessionTypes()
        => Ok(Array.Empty<object>());

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] object dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = 0 }, ApiResponse<object>.Ok(result, "Order created"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] object dto)
    {
        var success = await _service.UpdateAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Order not found"));
        var order = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { order }, "Order updated"));
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> Approve(int id, [FromBody] object dto)
    {
        var success = await _service.ApproveAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Order not found"));
        var order = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { order }, "Order approved"));
    }

    [HttpPost("{id}/void")]
    public async Task<ActionResult<ApiResponse<object>>> Void(int id, [FromBody] VoidOrderRequest request)
    {
        var success = await _service.VoidAsync(id, request.Reason, request.UserId);
        if (!success) return NotFound(ApiResponse.Fail("Order not found"));
        var order = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { order }, "Order voided"));
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult> Submit(int id)
    {
        var success = await _service.SubmitAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Order not found"));
        var order = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { order }, "Order submitted"));
    }

    [HttpPost("{id}/dispatch")]
    public async Task<ActionResult> Dispatch(int id)
    {
        var success = await _service.ForwardToVendorAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Order not found"));
        var order = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { order }, "Order dispatched to vendor"));
    }

    [HttpPost("{id}/decline")]
    public async Task<ActionResult> Decline(int id, [FromBody] DeclineOrderRequest? request)
    {
        if (_service is OrderService svc)
        {
            var success = await svc.DeclineAsync(id, request?.Reason);
            if (!success) return NotFound(ApiResponse.Fail("Order not found"));
        }
        var order = await _service.GetByIdAsync(id);
        if (order == null) return NotFound(ApiResponse.Fail("Order not found"));
        return Ok(ApiResponse<object>.Ok(new { order }, "Order declined"));
    }

    [HttpGet("{id}/budget-history")]
    public async Task<ActionResult> GetBudgetHistory(int id)
    {
        var order = await _service.GetByIdAsync(id);
        if (order == null) return NotFound(ApiResponse.Fail("Order not found"));
        return Ok(ApiResponse<object>.Ok(new { history = Array.Empty<object>() }));
    }

    [HttpGet("{id}/correspondence")]
    public async Task<ActionResult> GetCorrespondence(int id)
    {
        var order = await _service.GetByIdAsync(id);
        if (order == null) return NotFound(ApiResponse.Fail("Order not found"));
        return Ok(ApiResponse<object>.Ok(new { correspondence = Array.Empty<object>() }));
    }
}

public class VoidOrderRequest
{
    public string Reason { get; set; } = string.Empty;
    public int UserId { get; set; }
}

public class DeclineOrderRequest
{
    public string? Reason { get; set; }
}
