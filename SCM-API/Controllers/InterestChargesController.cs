using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/interest-charges")]
public class InterestChargesController : ControllerBase
{
    [HttpGet("config")]
    public ActionResult GetConfig()
        => Ok(ApiResponse<object>.Ok(new { interestRate = 2.0, gracePeriodDays = 30, compoundingFrequency = "Monthly", legislativeReference = "MFMA Section 65(2)(e)" }));

    [HttpGet]
    public ActionResult GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new { data = new { items = Array.Empty<object>(), total = 0, page, pageSize }, isSuccess = true, errors = Array.Empty<string>(), timestamp = DateTime.UtcNow });

    [HttpGet("summary")]
    public ActionResult GetSummary()
        => Ok(ApiResponse<object>.Ok(new { totalCharges = 0m, totalInvoicesOverdue = 0, avgDaysOverdue = 0, potentialLiability = 0m }));

    [HttpGet("{id}")]
    public ActionResult GetById(int id)
        => Ok(ApiResponse<object>.Ok(new { id, invoiceNumber = "", vendor = "", amount = 0m, interestAccrued = 0m, daysOverdue = 0, status = "Pending" }));

    [HttpGet("reports/creditor-reconciliation")]
    public ActionResult GetCreditorReconciliation([FromQuery] string? vendorId)
        => Ok(ApiResponse<object>.Ok(new { items = Array.Empty<object>(), total = 0 }));

    [HttpGet("reports/invoice-age-analysis")]
    public ActionResult GetInvoiceAgeAnalysis([FromQuery] string? vendorId)
        => Ok(ApiResponse<object>.Ok(new { current = 0m, days30 = 0m, days60 = 0m, days90 = 0m, over90 = 0m, items = Array.Empty<object>() }));

    [HttpGet("reports/outstanding-payments")]
    public ActionResult GetOutstandingPayments([FromQuery] string? vendorId)
        => Ok(ApiResponse<object>.Ok(new { items = Array.Empty<object>(), total = 0, totalAmount = 0m }));
}
