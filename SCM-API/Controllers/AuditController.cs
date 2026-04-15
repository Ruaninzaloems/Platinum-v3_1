using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/audit-trail")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _service;

    public AuditController(IAuditService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult<PagedApiResponse<object>>> GetAll(
        [FromQuery] string? entityType, [FromQuery] int? entityId, [FromQuery] string? action,
        [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAuditLogsAsync(entityType, entityId, action, fromDate, toDate, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("summary")]
    public async Task<ActionResult> GetSummary()
    {
        var result = await _service.GetAuditSummaryAsync();
        return Ok(result);
    }

    [HttpGet("modules")]
    public ActionResult GetModules()
        => Ok(new object[] { new { code = "Requisitions", name = "Requisitions" }, new { code = "Orders", name = "Orders" }, new { code = "Invoices", name = "Invoices" }, new { code = "Payments", name = "Payments" }, new { code = "Tenders", name = "Tenders" }, new { code = "Contracts", name = "Contracts" }, new { code = "Inventory", name = "Inventory" }, new { code = "Vendors", name = "Vendors" } });

    [HttpGet("actions")]
    public ActionResult GetActions()
        => Ok(new object[] { new { code = "Create", name = "Create" }, new { code = "Update", name = "Update" }, new { code = "Delete", name = "Delete" }, new { code = "Approve", name = "Approve" }, new { code = "Reject", name = "Reject" }, new { code = "Submit", name = "Submit" } });

    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<object>>> GetEntityHistory(string entityType, int entityId)
    {
        var result = await _service.GetEntityHistoryAsync(entityType, entityId);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult> GetUserHistory(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
    {
        var result = await _service.GetUserAuditHistoryAsync(userId, page, pageSize);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("export")]
    public async Task<ActionResult> Export([FromQuery] string? entityType, [FromQuery] string? action, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var result = await _service.ExportAuditLogsAsync(entityType, action, fromDate, toDate);
        return Ok(ApiResponse<object>.Ok(result));
    }
}
