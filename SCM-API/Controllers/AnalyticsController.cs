using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    [HttpGet("spend")]
    public ActionResult GetSpend()
        => Ok(ApiResponse<object>.Ok(new { totalSpend = 0m, byDepartment = Array.Empty<object>(), byCategory = Array.Empty<object>(), monthlyTrend = Array.Empty<object>() }));

    [HttpGet("requisitions")]
    public ActionResult GetRequisitions()
        => Ok(ApiResponse<object>.Ok(new { total = 0, avgProcessingDays = 0, byStatus = Array.Empty<object>(), trend = Array.Empty<object>() }));

    [HttpGet("quotations")]
    public ActionResult GetQuotations()
        => Ok(ApiResponse<object>.Ok(new { total = 0, avgTurnaroundDays = 0, byMethod = Array.Empty<object>(), trend = Array.Empty<object>() }));

    [HttpGet("tenders")]
    public ActionResult GetTenders()
        => Ok(ApiResponse<object>.Ok(new { total = 0, avgDuration = 0, byType = Array.Empty<object>(), trend = Array.Empty<object>() }));

    [HttpGet("orders")]
    public ActionResult GetOrders()
        => Ok(ApiResponse<object>.Ok(new { total = 0, totalValue = 0m, avgLeadTime = 0, trend = Array.Empty<object>() }));

    [HttpGet("invoices")]
    public ActionResult GetInvoices()
        => Ok(ApiResponse<object>.Ok(new { total = 0, avgPaymentDays = 0, complianceRate = 100.0, trend = Array.Empty<object>() }));

    [HttpGet("grn")]
    public ActionResult GetGrn()
        => Ok(ApiResponse<object>.Ok(new { total = 0, avgReceiptDays = 0, trend = Array.Empty<object>() }));

    [HttpGet("supplier-performance")]
    public ActionResult GetSupplierPerformance()
        => Ok(ApiResponse<object>.Ok(new { avgScore = 0, topSuppliers = Array.Empty<object>(), byCategory = Array.Empty<object>() }));

    [HttpGet("{endpoint}")]
    public ActionResult GetGeneric(string endpoint)
        => Ok(ApiResponse<object>.Ok(new { data = Array.Empty<object>() }));
}
