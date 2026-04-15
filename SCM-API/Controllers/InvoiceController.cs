using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Services;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/invoices")]
public class InvoiceController : ControllerBase
{
    private readonly IInvoiceService _service;
    private readonly IGrnGraService _grnService;

    public InvoiceController(IInvoiceService service, IGrnGraService grnService)
    {
        _service = service;
        _grnService = grnService;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] string? status, [FromQuery] string? invoiceType, [FromQuery] string? search,
        [FromQuery] string? department, [FromQuery] string? dateFrom, [FromQuery] string? dateTo,
        [FromQuery] string? captureMethod, [FromQuery] string? mfmaCompliant,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = (await _service.GetAllInvoiceDictsAsync()).AsEnumerable();

        await RecalcAgeDaysAsync();

        if (!string.IsNullOrEmpty(status))
        {
            var statuses = status.Split(',', StringSplitOptions.RemoveEmptyEntries);
            query = query.Where(i => statuses.Any(s =>
                string.Equals(GetStr(i, "status"), s, StringComparison.OrdinalIgnoreCase)));
        }
        if (!string.IsNullOrEmpty(invoiceType))
            query = query.Where(i => string.Equals(GetStr(i, "invoiceType"), invoiceType, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(department))
            query = query.Where(i => string.Equals(GetStr(i, "department"), department, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(captureMethod))
            query = query.Where(i => string.Equals(GetStr(i, "captureMethod"), captureMethod, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(mfmaCompliant))
        {
            bool compliant = mfmaCompliant == "true";
            query = query.Where(i => i.TryGetValue("mfmaCompliant", out var mc) && mc is bool b && b == compliant);
        }
        if (!string.IsNullOrEmpty(search))
            query = query.Where(i =>
                GetStr(i, "referenceNumber")?.Contains(search, StringComparison.OrdinalIgnoreCase) == true ||
                GetStr(i, "supplierName")?.Contains(search, StringComparison.OrdinalIgnoreCase) == true ||
                GetStr(i, "supplierInvoiceNumber")?.Contains(search, StringComparison.OrdinalIgnoreCase) == true ||
                GetStr(i, "orderNumber")?.Contains(search, StringComparison.OrdinalIgnoreCase) == true);

        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
            query = query.Where(i => GetStr(i, "invoiceDate") is string d && DateTime.TryParse(d, out var dt) && dt >= fromDate);
        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
            query = query.Where(i => GetStr(i, "invoiceDate") is string d && DateTime.TryParse(d, out var dt) && dt <= toDate);

        var items = query.OrderByDescending(i => GetStr(i, "createdAt") ?? "").ToList();
        var total = items.Count;
        var paged = items.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return Ok(new
        {
            data = paged,
            total,
            totalPages = (int)Math.Ceiling((double)total / pageSize),
            page,
            pageSize
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetById(int id)
    {
        var inv = await _service.GetInvoiceDictAsync(id);
        if (inv == null)
            return NotFound(new { message = "Invoice not found" });
        RecalcAgeDays(inv);
        return Ok(inv);
    }

    [HttpGet("dashboard/summary")]
    public async Task<ActionResult> GetDashboardSummary()
    {
        await RecalcAgeDaysAsync();
        var all = (await _service.GetAllInvoiceDictsAsync()).ToList();
        var totalValue = all.Sum(i => GetAmount(i, "totalAmount"));
        var paid = all.Where(i => GetStr(i, "status") == "paid").ToList();
        var avgPayDays = paid.Count > 0 ? (int)paid.Average(i => GetInt(i, "ageDays")) : 0;

        return Ok(new
        {
            total = all.Count,
            pending = all.Count(i => new[] { "submitted", "pending_match", "supervisor_review", "hod_review", "cfo_review" }.Contains(GetStr(i, "status"))),
            approved = all.Count(i => GetStr(i, "status") == "approved"),
            paid = paid.Count,
            overdue = all.Count(i => GetStr(i, "status") == "overdue" || (GetStr(i, "dueDate") is string dd && DateTime.TryParse(dd, out var due) && due < DateTime.UtcNow && !new[] { "paid", "voided", "rejected" }.Contains(GetStr(i, "status")))),
            totalValue,
            avgPaymentDays = avgPayDays
        });
    }

    [HttpGet("pending-approval")]
    public async Task<ActionResult> GetPendingApproval()
    {
        var pending = (await _service.GetAllInvoiceDictsAsync()).Where(i =>
            new[] { "submitted", "verified", "supervisor_review", "hod_review", "cfo_review" }.Contains(GetStr(i, "status"))).ToList();
        return Ok(new { count = pending.Count, invoices = pending });
    }

    [HttpGet("mfma-compliance")]
    public async Task<ActionResult> GetMfmaCompliance()
    {
        await RecalcAgeDaysAsync();
        var all = (await _service.GetAllInvoiceDictsAsync()).Where(i => !new[] { "voided", "rejected", "draft" }.Contains(GetStr(i, "status"))).ToList();
        var totalCount = all.Count;
        if (totalCount == 0)
            return Ok(new { complianceRate = 100.0, avgDaysToPayment = 0, breachCount = 0, atRisk = 0, paymentDeadlineDays = 30, breachAmount = new { amount = 0m, currency = "ZAR" }, agingBuckets = Array.Empty<object>() });

        var within30 = all.Count(i => GetInt(i, "ageDays") <= 30);
        var breaches = all.Where(i => GetInt(i, "ageDays") > 30).ToList();
        var atRisk = all.Count(i => { var d = GetInt(i, "ageDays"); return d >= 20 && d <= 30; });
        var complianceRate = Math.Round((double)within30 / totalCount * 100, 1);
        var avgDays = (int)all.Average(i => GetInt(i, "ageDays"));
        var breachAmount = breaches.Sum(i => GetAmount(i, "totalAmount"));

        var buckets = new object[]
        {
            new { label = "Within 30 days", min = 0, count = all.Count(i => GetInt(i, "ageDays") <= 30), totalAmount = new { amount = all.Where(i => GetInt(i, "ageDays") <= 30).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" } },
            new { label = "30-60 days", min = 31, count = all.Count(i => { var d = GetInt(i, "ageDays"); return d >= 31 && d <= 60; }), totalAmount = new { amount = all.Where(i => { var d = GetInt(i, "ageDays"); return d >= 31 && d <= 60; }).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" } },
            new { label = "60-90 days", min = 61, count = all.Count(i => { var d = GetInt(i, "ageDays"); return d >= 61 && d <= 90; }), totalAmount = new { amount = all.Where(i => { var d = GetInt(i, "ageDays"); return d >= 61 && d <= 90; }).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" } },
            new { label = "90+ days", min = 91, count = all.Count(i => GetInt(i, "ageDays") > 90), totalAmount = new { amount = all.Where(i => GetInt(i, "ageDays") > 90).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" } }
        };

        return Ok(new
        {
            complianceRate,
            avgDaysToPayment = avgDays,
            breachCount = breaches.Count,
            atRisk,
            paymentDeadlineDays = 30,
            breachAmount = new { amount = breachAmount, currency = "ZAR" },
            agingBuckets = buckets
        });
    }

    [HttpGet("pipeline")]
    public async Task<ActionResult> GetPipeline()
    {
        var all = (await _service.GetAllInvoiceDictsAsync()).ToList();
        var stages = new object[]
        {
            new { stage = "Draft", count = all.Count(i => GetStr(i, "status") == "draft"), totalAmount = new { amount = all.Where(i => GetStr(i, "status") == "draft").Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" }, statuses = new[] { "draft" } },
            new { stage = "Matching", count = all.Count(i => new[] { "submitted", "pending_match" }.Contains(GetStr(i, "status"))), totalAmount = new { amount = all.Where(i => new[] { "submitted", "pending_match" }.Contains(GetStr(i, "status"))).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" }, statuses = new[] { "submitted", "pending_match" } },
            new { stage = "Verified", count = all.Count(i => GetStr(i, "status") == "verified"), totalAmount = new { amount = all.Where(i => GetStr(i, "status") == "verified").Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" }, statuses = new[] { "verified" } },
            new { stage = "Approval", count = all.Count(i => new[] { "supervisor_review", "hod_review", "cfo_review" }.Contains(GetStr(i, "status"))), totalAmount = new { amount = all.Where(i => new[] { "supervisor_review", "hod_review", "cfo_review" }.Contains(GetStr(i, "status"))).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" }, statuses = new[] { "supervisor_review", "hod_review", "cfo_review" } },
            new { stage = "Approved", count = all.Count(i => GetStr(i, "status") == "approved"), totalAmount = new { amount = all.Where(i => GetStr(i, "status") == "approved").Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" }, statuses = new[] { "approved" } },
            new { stage = "Payment", count = all.Count(i => GetStr(i, "status") == "payment_batched"), totalAmount = new { amount = all.Where(i => GetStr(i, "status") == "payment_batched").Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" }, statuses = new[] { "payment_batched" } },
            new { stage = "Paid", count = all.Count(i => GetStr(i, "status") == "paid"), totalAmount = new { amount = all.Where(i => GetStr(i, "status") == "paid").Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" }, statuses = new[] { "paid" } },
            new { stage = "Rejected/Voided", count = all.Count(i => new[] { "rejected", "voided" }.Contains(GetStr(i, "status"))), totalAmount = new { amount = all.Where(i => new[] { "rejected", "voided" }.Contains(GetStr(i, "status"))).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" }, statuses = new[] { "rejected", "voided" } },
            new { stage = "Overdue", count = all.Count(i => GetStr(i, "status") == "overdue" || (GetStr(i, "dueDate") is string dd && DateTime.TryParse(dd, out var due) && due < DateTime.UtcNow && !new[] { "paid", "voided", "rejected" }.Contains(GetStr(i, "status")))), totalAmount = new { amount = 0m, currency = "ZAR" }, statuses = new[] { "overdue" } }
        };
        return Ok(stages);
    }

    [HttpGet("touchless-rate")]
    public async Task<ActionResult> GetTouchlessRate()
    {
        var all = (await _service.GetAllInvoiceDictsAsync()).ToList();
        var regular = all.Where(i => GetStr(i, "invoiceType") == "regular").ToList();
        var totalRegular = regular.Count;
        var touchless = regular.Count(i => GetStr(i, "captureMethod") != "manual" && GetMatchStatus(i) == "matched");
        var ocrCount = all.Count(i => GetStr(i, "captureMethod") == "ocr");
        var portalCount = all.Count(i => GetStr(i, "captureMethod") == "supplier_portal");
        var rate = totalRegular > 0 ? Math.Round((double)touchless / totalRegular * 100, 1) : 0;

        return Ok(new
        {
            touchlessRate = rate,
            touchlessCount = touchless,
            totalRegular,
            ocrProcessedCount = ocrCount,
            ocrProcessedRate = all.Count > 0 ? Math.Round((double)ocrCount / all.Count * 100, 1) : 0,
            portalUploadCount = portalCount,
            portalUploadRate = all.Count > 0 ? Math.Round((double)portalCount / all.Count * 100, 1) : 0,
            costSavingsEstimate = new
            {
                totalSaved = touchless * 25,
                perInvoice = new { manual = 30, touchless = 5 }
            }
        });
    }

    [HttpGet("overdue")]
    public async Task<ActionResult> GetOverdue()
    {
        await RecalcAgeDaysAsync();
        var overdue = (await _service.GetAllInvoiceDictsAsync()).Where(i =>
        {
            var st = GetStr(i, "status");
            if (new[] { "paid", "voided", "rejected" }.Contains(st)) return false;
            if (GetStr(i, "dueDate") is string dd && DateTime.TryParse(dd, out var due))
                return due < DateTime.UtcNow;
            return false;
        }).ToList();

        return Ok(new
        {
            count = overdue.Count,
            totalAmount = new { amount = overdue.Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" },
            items = overdue
        });
    }

    [HttpGet("age-analysis")]
    public async Task<ActionResult> GetAgeAnalysis()
    {
        await RecalcAgeDaysAsync();
        var active = (await _service.GetAllInvoiceDictsAsync()).Where(i => !new[] { "paid", "voided", "rejected" }.Contains(GetStr(i, "status"))).ToList();

        return Ok(new
        {
            current = new { count = active.Count(i => GetInt(i, "ageDays") <= 0), amount = new { amount = active.Where(i => GetInt(i, "ageDays") <= 0).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" } },
            days30 = new { count = active.Count(i => { var d = GetInt(i, "ageDays"); return d >= 1 && d <= 30; }), amount = new { amount = active.Where(i => { var d = GetInt(i, "ageDays"); return d >= 1 && d <= 30; }).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" } },
            days60 = new { count = active.Count(i => { var d = GetInt(i, "ageDays"); return d >= 31 && d <= 60; }), amount = new { amount = active.Where(i => { var d = GetInt(i, "ageDays"); return d >= 31 && d <= 60; }).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" } },
            days90 = new { count = active.Count(i => { var d = GetInt(i, "ageDays"); return d >= 61 && d <= 90; }), amount = new { amount = active.Where(i => { var d = GetInt(i, "ageDays"); return d >= 61 && d <= 90; }).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" } },
            days120 = new { count = active.Count(i => { var d = GetInt(i, "ageDays"); return d >= 91 && d <= 120; }), amount = new { amount = active.Where(i => { var d = GetInt(i, "ageDays"); return d >= 91 && d <= 120; }).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" } },
            days120Plus = new { count = active.Count(i => GetInt(i, "ageDays") > 120), amount = new { amount = active.Where(i => GetInt(i, "ageDays") > 120).Sum(i => GetAmount(i, "totalAmount")), currency = "ZAR" } }
        });
    }

    [HttpGet("match-exceptions")]
    public async Task<ActionResult> GetMatchExceptions()
    {
        var all = (await _service.GetAllInvoiceDictsAsync()).ToList();
        var exceptions = all.Where(i => GetMatchStatus(i) == "mismatch" || GetStr(i, "status") == "match_exception").ToList();
        var matched = all.Count(i => GetMatchStatus(i) == "matched");
        var partial = all.Count(i => GetMatchStatus(i) == "partial_match");
        var pending = all.Count(i => GetMatchStatus(i) == "pending" && GetStr(i, "invoiceType") == "regular");

        return Ok(new
        {
            items = exceptions,
            invoices = exceptions,
            total = all.Count,
            count = exceptions.Count,
            matched,
            partial,
            exceptions = exceptions.Count,
            pending
        });
    }

    [HttpGet("{id:int}/match-details")]
    public async Task<ActionResult> GetMatchDetails(int id)
    {
        var inv = await _service.GetInvoiceDictAsync(id);
        if (inv == null)
            return NotFound(new { message = "Invoice not found" });

        var match = inv.TryGetValue("threeWayMatch", out var m) ? m : null;
        return Ok(new { threeWayMatch = match });
    }

    [HttpGet("{id:int}/audit-trail")]
    public async Task<ActionResult> GetAuditTrail(int id)
    {
        var inv = await _service.GetInvoiceDictAsync(id);
        if (inv == null)
            return NotFound(new { message = "Invoice not found" });

        var trail = inv.TryGetValue("auditTrail", out var at) ? at : Array.Empty<object>();
        return Ok(new { auditTrail = trail });
    }

    [HttpGet("{id:int}/documents")]
    public async Task<ActionResult> GetDocuments(int id)
    {
        var inv = await _service.GetInvoiceDictAsync(id);
        if (inv == null)
            return NotFound(new { message = "Invoice not found" });

        var docs = new List<object>
        {
            new { type = "invoice", filename = GetStr(inv, "referenceNumber") + " - Supplier Invoice", name = GetStr(inv, "referenceNumber") + " - Supplier Invoice", category = "Tax Invoice", version = 1, uploadedDate = GetStr(inv, "createdAt"), status = "uploaded" }
        };

        if (GetStr(inv, "orderNumber") is string on && !string.IsNullOrEmpty(on))
            docs.Add(new { type = "purchase_order", filename = on + " - Purchase Order", name = on + " - Purchase Order", category = "Purchase Order", version = 1, uploadedDate = GetStr(inv, "createdAt"), status = "linked" });
        if (GetStr(inv, "grnNumber") is string gn && !string.IsNullOrEmpty(gn))
            docs.Add(new { type = "grn", filename = gn + " - Goods Received Note", name = gn + " - Goods Received Note", category = "Delivery Note", version = 1, uploadedDate = GetStr(inv, "createdAt"), status = "linked" });

        var documentChecklist = new object[]
        {
            new { category = "Tax Invoice", label = "Tax Invoice", mandatory = true, completed = true },
            new { category = "Purchase Order", label = "Purchase Order Copy", mandatory = GetStr(inv, "invoiceType") == "regular", completed = GetStr(inv, "orderNumber") != null },
            new { category = "Delivery Note", label = "Delivery Note / GRN", mandatory = GetStr(inv, "invoiceType") == "regular", completed = GetStr(inv, "grnNumber") != null },
            new { category = "BBBEE Certificate", label = "BBBEE Certificate", mandatory = false, completed = false },
            new { category = "Tax Clearance", label = "Tax Clearance Certificate", mandatory = false, completed = false }
        };

        return Ok(new { documents = docs, documentChecklist, checklist = documentChecklist });
    }

    [HttpGet("{id:int}/debit-credit-notes")]
    public async Task<ActionResult> GetDebitCreditNotes(int id)
    {
        if (await _service.GetInvoiceDictAsync(id) == null)
            return NotFound(new { message = "Invoice not found" });
        return Ok(new { notes = Array.Empty<object>() });
    }

    [HttpGet("{id:int}/cessions")]
    public async Task<ActionResult> GetCessions(int id)
    {
        if (await _service.GetInvoiceDictAsync(id) == null)
            return NotFound(new { message = "Invoice not found" });
        return Ok(new { cessions = Array.Empty<object>() });
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] JsonElement dto)
    {
        var data = new Dictionary<string, object?> { ["captureMethod"] = "manual" };
        if (dto.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in dto.EnumerateObject())
            {
                if (prop.Name is "id" or "referenceNumber" or "status") continue;
                data[prop.Name] = ConvertJsonElement(prop.Value);
            }
        }

        var invoiceType = GetStr(data, "invoiceType");
        data["threeWayMatch"] = invoiceType == "regular"
            ? new Dictionary<string, object?> { ["status"] = "pending" }
            : new Dictionary<string, object?> { ["status"] = "not_applicable" };

        var (result, error) = await _service.CreateInvoiceDictAsync(data);
        if (result == null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, [FromBody] JsonElement dto)
    {
        var updates = new Dictionary<string, object?>();
        if (dto.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in dto.EnumerateObject())
            {
                if (prop.Name is "id" or "referenceNumber" or "status") continue;
                updates[prop.Name] = ConvertJsonElement(prop.Value);
            }
        }
        var (result, error) = await _service.UpdateInvoiceDictAsync(id, updates);
        if (result == null) return NotFound(new { message = error });
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var inv = await _service.GetInvoiceDictAsync(id);
        if (inv == null)
            return NotFound(new { message = "Invoice not found" });
        if (GetStr(inv, "status") != "draft")
            return BadRequest(new { error = "Only draft invoices can be deleted." });
        await _service.DeleteInvoiceDictAsync(id);
        return Ok(new { message = "Invoice deleted" });
    }

    [HttpPost("{id:int}/submit")]
    public async Task<ActionResult> Submit(int id)
    {
        var (result, error) = await _service.SubmitInvoiceDictAsync(id);
        if (result == null)
            return result == null && error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });

        if (GetStr(result, "invoiceType") == "regular" && result.ContainsKey("orderId") && result["orderId"] != null)
        {
            var matchResult = await Perform3WayMatchAsync(result);
            result["threeWayMatch"] = matchResult;
            var matchStatus = matchResult.TryGetValue("status", out var ms) ? ms?.ToString() : "unknown";
            if (matchStatus == "mismatch")
            {
                result["status"] = "match_exception";
            }
            await _service.SaveInvoiceDictAsync(id, result);
        }

        return Ok(new { invoice = result });
    }

    [HttpPost("{id:int}/verify")]
    public async Task<ActionResult> Verify(int id, [FromBody] JsonElement? dto)
    {
        var (result, error) = await _service.VerifyInvoiceDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        return Ok(new { invoice = result });
    }

    [HttpPost("{id:int}/approve")]
    public async Task<ActionResult> Approve(int id, [FromBody] JsonElement? dto)
    {
        var (result, error) = await _service.ApproveInvoiceDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        return Ok(new { invoice = result });
    }

    [HttpPost("{id:int}/reject")]
    public async Task<ActionResult> Reject(int id, [FromBody] JsonElement? dto)
    {
        string? reason = null;
        if (dto?.ValueKind == JsonValueKind.Object && dto.Value.TryGetProperty("reason", out var r))
            reason = r.GetString();
        var (result, error) = await _service.RejectInvoiceDictAsync(id, reason);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        return Ok(new { invoice = result });
    }

    [HttpPost("{id:int}/void")]
    public async Task<ActionResult> VoidInvoice(int id, [FromBody] JsonElement? dto)
    {
        string? reason = null;
        if (dto?.ValueKind == JsonValueKind.Object && dto.Value.TryGetProperty("reason", out var r))
            reason = r.GetString();
        var (result, error) = await _service.VoidInvoiceDictAsync(id, reason);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        return Ok(new { invoice = result });
    }

    [HttpPost("{id:int}/mark-paid")]
    public async Task<ActionResult> MarkPaid(int id, [FromBody] JsonElement? dto)
    {
        var (result, error) = await _service.MarkPaidDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });

        var paymentRef = "";
        if (dto?.ValueKind == JsonValueKind.Object && dto.Value.TryGetProperty("paymentReference", out var pr))
            paymentRef = pr.GetString() ?? "";
        result["paymentReference"] = paymentRef;

        var totalAmount = 0m;
        if (result.TryGetValue("totalAmount", out var ta) && ta is Dictionary<string, object?> taDict && taDict.TryGetValue("amount", out var taAmt))
            totalAmount = Convert.ToDecimal(taAmt);

        var payService = HttpContext.RequestServices.GetService<IPaymentService>();
        var batchId = payService!.AllocateNextBatchSeq();
        var batchKey = batchId.ToString();
        var batchRef = $"PAY-{DateTime.UtcNow:yyyy}-{batchId:D4}";
        var now = DateTime.UtcNow;

        var batchItem = new Dictionary<string, object?>
        {
            ["invoiceId"] = id,
            ["invoiceNumber"] = GetStr(result, "referenceNumber"),
            ["supplierName"] = GetStr(result, "supplierName"),
            ["supplierId"] = GetStr(result, "supplierId"),
            ["amount"] = new { amount = totalAmount, currency = "ZAR" },
            ["bankName"] = "Standard Bank",
            ["branchCode"] = "051001",
            ["accountNumber"] = "0412345678",
            ["remittanceSent"] = false
        };

        var batch = new Dictionary<string, object?>
        {
            ["id"] = batchKey,
            ["referenceNumber"] = batchRef,
            ["batchDate"] = now.ToString("yyyy-MM-dd"),
            ["status"] = "processed",
            ["paymentMethod"] = "EFT",
            ["totalAmountValue"] = totalAmount,
            ["totalAmount"] = new { amount = totalAmount, currency = "ZAR" },
            ["itemCount"] = 1,
            ["items"] = new List<Dictionary<string, object?>> { batchItem },
            ["notes"] = $"Quick payment — {GetStr(result, "referenceNumber")} {GetStr(result, "supplierName")}",
            ["createdBy"] = "admin",
            ["createdByName"] = "System Administrator",
            ["createdDate"] = now.ToString("o"),
            ["processedDate"] = now.ToString("o"),
            ["approvedDate"] = now.ToString("o"),
            ["approvalChain"] = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["level"] = 1,
                    ["userId"] = "admin",
                    ["userName"] = "System Administrator",
                    ["role"] = "CFO",
                    ["status"] = "Approved",
                    ["date"] = now.ToString("o"),
                    ["comments"] = "Quick payment approved"
                }
            },
            ["auditTrail"] = new List<Dictionary<string, object?>>
            {
                new() { ["action"] = "Batch Created", ["details"] = $"Payment batch {batchRef} created for {GetStr(result, "referenceNumber")}", ["userId"] = "admin", ["timestamp"] = now.ToString("o") },
                new() { ["action"] = "Batch Processed", ["details"] = $"Quick payment processed. Invoice marked as paid.", ["userId"] = "admin", ["timestamp"] = now.ToString("o") }
            }
        };

        await payService.SaveBatchDictAsync(batchKey, batch);

        if (string.IsNullOrEmpty(paymentRef))
            result["paymentReference"] = batchRef;
        result["paymentBatchId"] = batchKey;
        result["paymentBatchRef"] = batchRef;
        await _service.SaveInvoiceDictAsync(id, result);

        return Ok(new { invoice = result, paymentBatch = batch });
    }

    [HttpPost("{id:int}/hold")]
    public async Task<ActionResult> HoldInvoice(int id, [FromBody] JsonElement? dto)
    {
        var (result, error) = await _service.HoldInvoiceDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        return Ok(new { invoice = result });
    }

    [HttpPost("{id:int}/release-hold")]
    public async Task<ActionResult> ReleaseHold(int id)
    {
        var (result, error) = await _service.ReleaseHoldDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        return Ok(new { invoice = result });
    }

    [HttpPost("{id:int}/dispute")]
    public async Task<ActionResult> DisputeInvoice(int id, [FromBody] JsonElement? dto)
    {
        string? reason = null;
        if (dto?.ValueKind == JsonValueKind.Object && dto.Value.TryGetProperty("reason", out var r))
            reason = r.GetString();
        var (result, error) = await _service.DisputeInvoiceDictAsync(id, reason);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        return Ok(new { invoice = result });
    }

    [HttpPost("{id:int}/match")]
    public async Task<ActionResult> RunMatch(int id)
    {
        var inv = await _service.GetInvoiceDictAsync(id);
        if (inv == null)
            return NotFound(new { error = "Invoice not found" });

        if (GetStr(inv, "invoiceType") != "regular")
            return BadRequest(new { error = "3-way match only applies to regular (PO-based) invoices." });

        var matchResult = await Perform3WayMatchAsync(inv);
        inv["threeWayMatch"] = matchResult;

        var matchStatus = matchResult.TryGetValue("status", out var ms) ? ms?.ToString() : "pending";
        var currentStatus = GetStr(inv, "status");
        if (matchStatus == "mismatch")
            inv["status"] = "match_exception";
        else if (currentStatus == "match_exception")
            inv["status"] = "submitted";

        await _service.SaveInvoiceDictAsync(id, inv);
        return Ok(new { invoice = inv, matchResult });
    }

    [HttpPost("ocr-extract")]
    public async Task<ActionResult> OcrExtract([FromBody] JsonElement? dto)
    {
        return Ok(new
        {
            confidence = 0.85,
            extractedData = new
            {
                supplierName = "Sample Supplier (OCR)",
                invoiceNumber = $"OCR-{DateTime.UtcNow:yyyyMMdd}-001",
                invoiceDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                totalAmount = "25000.00"
            },
            fieldConfidence = new
            {
                supplierName = 0.92,
                invoiceNumber = 0.88,
                invoiceDate = 0.95,
                totalAmount = 0.80
            }
        });
    }

    private async Task<Dictionary<string, object?>> Perform3WayMatchAsync(Dictionary<string, object?> inv)
    {
        var result = new Dictionary<string, object?>
        {
            ["matchDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ["confidence"] = 0.0
        };

        var details = new Dictionary<string, object?>();
        bool anyFailed = false;
        int checkCount = 0;
        int passCount = 0;

        var invSupplier = GetStr(inv, "supplierName") ?? "";
        var orderId = inv.TryGetValue("orderId", out var oid) ? oid : null;
        Dictionary<string, object?>? order = null;
        Dictionary<string, object?>? grn = null;

        if (orderId != null)
        {
            var orderIdInt = Convert.ToInt32(orderId);
            var orderSvc = HttpContext.RequestServices.GetService<IOrderService>();
            if (orderSvc != null)
            {
                var orderResult = orderSvc.GetByIdAsync(orderIdInt).Result;
                if (orderResult is Dictionary<string, object?> od)
                    order = od;
            }
            if (order == null)
            {
                var orderNum = GetStr(inv, "orderNumber");
                if (!string.IsNullOrEmpty(orderNum))
                {
                    var orderSvc2 = HttpContext.RequestServices.GetService<IOrderService>();
                    if (orderSvc2 != null)
                    {
                        var byNum = orderSvc2.GetByOrderNumber(orderNum);
                        if (byNum != null) order = byNum;
                    }
                }
            }
        }

        var grnId = inv.TryGetValue("grnId", out var gid) ? gid : null;
        if (grnId != null)
        {
            var grnIdInt = Convert.ToInt32(grnId);
            grn = await _grnService.GetGrnDictAsync(grnIdInt);
        }
        else if (orderId != null)
        {
            grn = (await _grnService.GetAllGrnDictsAsync()).FirstOrDefault(g =>
                g.TryGetValue("orderId", out var gOid) && Convert.ToInt32(gOid) == Convert.ToInt32(orderId));
            if (grn != null)
            {
                inv["grnId"] = grn.TryGetValue("id", out var gi) ? gi : null;
                inv["grnNumber"] = GetStr(grn, "grnNumber");
            }
        }

        bool supplierMatched = true;
        if (order != null)
        {
            var orderSupplier = "";
            if (order.TryGetValue("supplier", out var sup) && sup != null)
            {
                try
                {
                    var supJson = JsonSerializer.Serialize(sup);
                    using var doc = JsonDocument.Parse(supJson);
                    if (doc.RootElement.TryGetProperty("name", out var n))
                        orderSupplier = n.GetString() ?? "";
                }
                catch { orderSupplier = sup.ToString() ?? ""; }
            }
            supplierMatched = !string.IsNullOrEmpty(orderSupplier) &&
                (invSupplier.Contains(orderSupplier, StringComparison.OrdinalIgnoreCase) ||
                 orderSupplier.Contains(invSupplier, StringComparison.OrdinalIgnoreCase) ||
                 string.IsNullOrEmpty(invSupplier));
        }
        details["supplierMatch"] = new Dictionary<string, object?> { ["matched"] = supplierMatched, ["invoiceSupplier"] = invSupplier, ["poSupplier"] = order != null ? GetSupplierName(order) : "" };
        checkCount++; if (supplierMatched) passCount++; else anyFailed = true;

        bool orderMatched = order != null;
        var poNumber = order != null ? GetStr(order, "orderNumber") ?? "" : "";
        details["orderMatch"] = new Dictionary<string, object?> { ["matched"] = orderMatched, ["poNumber"] = poNumber };
        checkCount++; if (orderMatched) passCount++; else anyFailed = true;

        bool grnMatched = grn != null && GetStr(grn, "status") == "approved";
        var grnNumber = grn != null ? GetStr(grn, "grnNumber") ?? "" : "";
        details["grnMatch"] = new Dictionary<string, object?> { ["matched"] = grnMatched, ["grnNumber"] = grnNumber, ["grnStatus"] = grn != null ? GetStr(grn, "status") : "not_found" };
        checkCount++; if (grnMatched) passCount++; else anyFailed = true;

        var invLines = ParseLineItems(inv.TryGetValue("lineItems", out var ili) ? ili : null);
        var poLines = order != null ? ParseLineItems(order.TryGetValue("lineItems", out var oli) ? oli : null) : new List<LineItemInfo>();
        var grnLines = grn != null ? ParseGrnLineItems(grn.TryGetValue("lineItems", out var gli) ? gli : null) : new List<LineItemInfo>();

        var lineItemVariances = new List<object>();
        bool allLinesQtyMatch = true;
        bool allLinesPriceMatch = true;
        decimal totalInvAmount = 0, totalPoAmount = 0, totalGrnQty = 0, totalInvQty = 0;

        int maxLines = Math.Max(invLines.Count, Math.Max(poLines.Count, grnLines.Count));
        for (int i = 0; i < maxLines; i++)
        {
            var invLine = i < invLines.Count ? invLines[i] : null;
            var poLine = i < poLines.Count ? poLines[i] : null;
            var grnLine = i < grnLines.Count ? grnLines[i] : null;

            decimal invQty = invLine?.Quantity ?? 0;
            decimal invPrice = invLine?.UnitPrice ?? 0;
            decimal invLineTotal = invLine?.TotalPrice ?? 0;
            decimal poQty = poLine?.Quantity ?? 0;
            decimal poPrice = poLine?.UnitPrice ?? 0;
            decimal poLineTotal = poLine?.TotalPrice ?? 0;
            decimal grnReceivedQty = grnLine?.Quantity ?? 0;

            totalInvAmount += invLineTotal;
            totalPoAmount += poLineTotal;
            totalInvQty += invQty;
            totalGrnQty += grnReceivedQty;

            var qtyVariancePct = poQty > 0 ? Math.Round(Math.Abs((double)((invQty - grnReceivedQty) / poQty) * 100), 1) : 0;
            var priceVariancePct = poPrice > 0 ? Math.Round(Math.Abs((double)((invPrice - poPrice) / poPrice) * 100), 1) : 0;
            var totalVariancePct = poLineTotal > 0 ? Math.Round(Math.Abs((double)((invLineTotal - poLineTotal) / poLineTotal) * 100), 1) : 0;

            bool lineQtyOk = qtyVariancePct <= 5.0;
            bool linePriceOk = priceVariancePct <= 2.0;
            if (!lineQtyOk) allLinesQtyMatch = false;
            if (!linePriceOk) allLinesPriceMatch = false;

            lineItemVariances.Add(new Dictionary<string, object?>
            {
                ["lineNumber"] = i + 1,
                ["description"] = invLine?.Description ?? poLine?.Description ?? "Unknown",
                ["poQuantity"] = poQty,
                ["poUnitPrice"] = new Dictionary<string, object?> { ["amount"] = poPrice, ["currency"] = "ZAR" },
                ["poLineTotal"] = new Dictionary<string, object?> { ["amount"] = poLineTotal, ["currency"] = "ZAR" },
                ["grnReceivedQuantity"] = grnReceivedQty,
                ["invoiceQuantity"] = invQty,
                ["invoiceUnitPrice"] = new Dictionary<string, object?> { ["amount"] = invPrice, ["currency"] = "ZAR" },
                ["invoiceLineTotal"] = new Dictionary<string, object?> { ["amount"] = invLineTotal, ["currency"] = "ZAR" },
                ["quantityVariance"] = new Dictionary<string, object?> { ["matched"] = lineQtyOk, ["variancePercent"] = qtyVariancePct, ["tolerance"] = 5.0 },
                ["priceVariance"] = new Dictionary<string, object?> { ["matched"] = linePriceOk, ["variancePercent"] = priceVariancePct, ["tolerance"] = 2.0 },
                ["totalVariance"] = new Dictionary<string, object?> { ["matched"] = totalVariancePct <= 2.0, ["variancePercent"] = totalVariancePct }
            });
        }

        details["lineItemVariances"] = lineItemVariances;

        var aggregateQtyVariance = totalGrnQty > 0 ? Math.Round(Math.Abs((double)((totalInvQty - totalGrnQty) / totalGrnQty) * 100), 1) : 0;
        bool qtyCheckPassed = allLinesQtyMatch && aggregateQtyVariance <= 5.0;
        details["quantityMatch"] = new Dictionary<string, object?> { ["matched"] = qtyCheckPassed, ["variance"] = aggregateQtyVariance, ["tolerance"] = 5.0, ["totalInvoiceQty"] = totalInvQty, ["totalGrnQty"] = totalGrnQty };
        checkCount++; if (qtyCheckPassed) passCount++; else anyFailed = true;

        var invTotal = GetAmount(inv, "totalAmount");
        var orderTotalIncVat = totalPoAmount * 1.15m;
        var aggregatePriceVariance = orderTotalIncVat > 0 ? Math.Round(Math.Abs((double)((invTotal - orderTotalIncVat) / orderTotalIncVat) * 100), 1) : 0;
        bool priceCheckPassed = allLinesPriceMatch && (aggregatePriceVariance <= 2.0 || totalPoAmount == 0);
        details["priceMatch"] = new Dictionary<string, object?> { ["matched"] = priceCheckPassed, ["tolerance"] = 2.0, ["variancePercent"] = aggregatePriceVariance, ["invoiceTotal"] = new Dictionary<string, object?> { ["amount"] = invTotal, ["currency"] = "ZAR" }, ["poTotalIncVat"] = new Dictionary<string, object?> { ["amount"] = orderTotalIncVat, ["currency"] = "ZAR" } };
        checkCount++; if (priceCheckPassed) passCount++; else anyFailed = true;

        var totalVariance = totalPoAmount > 0 ? aggregatePriceVariance : 0.0;
        bool totalCheckPassed = totalVariance <= 2.0;
        details["totalMatch"] = new Dictionary<string, object?> { ["matched"] = totalCheckPassed, ["variance"] = totalVariance, ["invoiceTotal"] = new Dictionary<string, object?> { ["amount"] = invTotal, ["currency"] = "ZAR" }, ["poTotal"] = new Dictionary<string, object?> { ["amount"] = totalPoAmount, ["currency"] = "ZAR" } };
        checkCount++; if (totalCheckPassed) passCount++; else anyFailed = true;

        var expectedVat = GetAmount(inv, "subtotal") * 0.15m;
        var invoiceVat = GetAmount(inv, "vatAmount");
        bool vatMatched = Math.Abs(expectedVat - invoiceVat) < 1m || (expectedVat == 0 && invoiceVat == 0);
        details["vatMatch"] = new Dictionary<string, object?> { ["matched"] = vatMatched, ["expectedVat"] = expectedVat, ["invoiceVat"] = invoiceVat, ["variance"] = Math.Abs(expectedVat - invoiceVat) };
        checkCount++; if (vatMatched) passCount++; else anyFailed = true;

        var invNum = GetStr(inv, "supplierInvoiceNumber") ?? "";
        var duplicates = (await _service.GetAllInvoiceDictsAsync()).Where(other =>
            other.TryGetValue("id", out var otherId) && Convert.ToInt32(otherId) != Convert.ToInt32(inv["id"]) &&
            GetStr(other, "supplierInvoiceNumber") == invNum &&
            GetStr(other, "supplierName") == GetStr(inv, "supplierName") &&
            !new[] { "voided", "rejected" }.Contains(GetStr(other, "status"))).ToList();
        bool noDuplicates = duplicates.Count == 0 || string.IsNullOrEmpty(invNum);
        details["duplicateCheck"] = new Dictionary<string, object?> { ["passed"] = noDuplicates, ["duplicateCount"] = duplicates.Count };
        checkCount++; if (noDuplicates) passCount++; else anyFailed = true;

        var confidence = checkCount > 0 ? Math.Round((double)passCount / checkCount * 100, 1) : 0;
        string matchStatus = !anyFailed ? "matched" : (confidence >= 70 ? "partial_match" : "mismatch");

        result["status"] = matchStatus;
        result["confidence"] = confidence;
        result["details"] = details;
        result["summary"] = new Dictionary<string, object?>
        {
            ["totalChecks"] = checkCount,
            ["passedChecks"] = passCount,
            ["failedChecks"] = checkCount - passCount,
            ["lineItemCount"] = maxLines,
            ["poFound"] = order != null,
            ["grnFound"] = grn != null
        };

        return result;
    }

    private static string GetSupplierName(Dictionary<string, object?> order)
    {
        if (!order.TryGetValue("supplier", out var sup) || sup == null) return "";
        try
        {
            var json = JsonSerializer.Serialize(sup);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("name", out var n)) return n.GetString() ?? "";
        }
        catch { }
        return sup.ToString() ?? "";
    }

    private record LineItemInfo(string Description, decimal Quantity, decimal UnitPrice, decimal TotalPrice);

    private static List<LineItemInfo> ParseLineItems(object? lineItems)
    {
        var result = new List<LineItemInfo>();
        if (lineItems == null) return result;
        try
        {
            var json = JsonSerializer.Serialize(lineItems);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return result;
            foreach (var li in doc.RootElement.EnumerateArray())
            {
                var desc = li.TryGetProperty("description", out var d) ? d.GetString() ?? "" : "";
                decimal qty = li.TryGetProperty("quantity", out var q) && q.ValueKind == JsonValueKind.Number ? q.GetDecimal() : 1;
                decimal unitPrice = 0;
                if (li.TryGetProperty("unitPrice", out var up))
                {
                    if (up.ValueKind == JsonValueKind.Number) unitPrice = up.GetDecimal();
                    else if (up.ValueKind == JsonValueKind.Object && up.TryGetProperty("amount", out var a)) unitPrice = a.GetDecimal();
                }
                decimal totalPrice = qty * unitPrice;
                if (li.TryGetProperty("totalPrice", out var tp))
                {
                    if (tp.ValueKind == JsonValueKind.Number) totalPrice = tp.GetDecimal();
                    else if (tp.ValueKind == JsonValueKind.Object && tp.TryGetProperty("amount", out var a)) totalPrice = a.GetDecimal();
                }
                result.Add(new LineItemInfo(desc, qty, unitPrice, totalPrice));
            }
        }
        catch { }
        return result;
    }

    private static List<LineItemInfo> ParseGrnLineItems(object? lineItems)
    {
        var result = new List<LineItemInfo>();
        if (lineItems == null) return result;
        try
        {
            var json = JsonSerializer.Serialize(lineItems);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return result;
            foreach (var li in doc.RootElement.EnumerateArray())
            {
                var desc = li.TryGetProperty("description", out var d) ? d.GetString() ?? "" : "";
                decimal qty = li.TryGetProperty("receivedQuantity", out var rq) && rq.ValueKind == JsonValueKind.Number ? rq.GetDecimal()
                    : (li.TryGetProperty("quantity", out var q) && q.ValueKind == JsonValueKind.Number ? q.GetDecimal() : 1);
                decimal unitPrice = 0;
                if (li.TryGetProperty("unitPrice", out var up))
                {
                    if (up.ValueKind == JsonValueKind.Number) unitPrice = up.GetDecimal();
                    else if (up.ValueKind == JsonValueKind.Object && up.TryGetProperty("amount", out var a)) unitPrice = a.GetDecimal();
                }
                decimal totalPrice = qty * unitPrice;
                result.Add(new LineItemInfo(desc, qty, unitPrice, totalPrice));
            }
        }
        catch { }
        return result;
    }

    private static void ComputeTotals(Dictionary<string, object?> inv)
    {
        decimal subtotal = 0, vatTotal = 0;

        if (inv.TryGetValue("lineItems", out var liObj) && liObj != null)
        {
            try
            {
                var json = JsonSerializer.Serialize(liObj);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var li in doc.RootElement.EnumerateArray())
                    {
                        decimal qty = 1, unitPrice = 0, vatRate = 15;
                        if (li.TryGetProperty("quantity", out var q) && q.ValueKind == JsonValueKind.Number) qty = q.GetDecimal();
                        if (li.TryGetProperty("unitPrice", out var up))
                        {
                            if (up.ValueKind == JsonValueKind.Number) unitPrice = up.GetDecimal();
                            else if (up.ValueKind == JsonValueKind.Object && up.TryGetProperty("amount", out var a)) unitPrice = a.GetDecimal();
                        }
                        if (li.TryGetProperty("vatRate", out var vr) && vr.ValueKind == JsonValueKind.Number) vatRate = vr.GetDecimal();

                        var lineTotal = qty * unitPrice;
                        var lineVat = lineTotal * (vatRate / 100m);
                        subtotal += lineTotal;
                        vatTotal += lineVat;
                    }
                }
            }
            catch { }
        }

        inv["subtotal"] = new Dictionary<string, object?> { ["amount"] = subtotal, ["currency"] = "ZAR" };
        inv["vatAmount"] = new Dictionary<string, object?> { ["amount"] = vatTotal, ["currency"] = "ZAR" };
        inv["totalAmount"] = new Dictionary<string, object?> { ["amount"] = subtotal + vatTotal, ["currency"] = "ZAR" };
    }

    private static void ComputeAgeDays(Dictionary<string, object?> inv)
    {
        if (GetStr(inv, "receivedDate") is string rd && DateTime.TryParse(rd, out var received))
            inv["ageDays"] = (int)(DateTime.UtcNow - received).TotalDays;
        else
            inv["ageDays"] = 0;
    }

    private static void ComputeMfmaCompliant(Dictionary<string, object?> inv)
    {
        inv["mfmaCompliant"] = GetInt(inv, "ageDays") <= 30;
    }

    private async Task RecalcAgeDaysAsync()
    {
        foreach (var inv in await _service.GetAllInvoiceDictsAsync())
        {
            ComputeAgeDays(inv);
            ComputeMfmaCompliant(inv);
        }
    }

    private static void RecalcAgeDays(Dictionary<string, object?> inv)
    {
        ComputeAgeDays(inv);
        ComputeMfmaCompliant(inv);
    }

    private static void AddAudit(Dictionary<string, object?> inv, string action, string message, string type = "action")
    {
        var existing = inv.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        existing.Add(new Dictionary<string, object?>
        {
            ["action"] = action,
            ["by"] = type == "system" ? "System" : "Admin",
            ["date"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ["type"] = type,
            ["message"] = message
        });
        inv["auditTrail"] = existing.ToArray();
    }

    private static string? GetStr(Dictionary<string, object?> d, string key)
        => d.TryGetValue(key, out var v) ? v?.ToString() : null;

    private static int GetInt(Dictionary<string, object?> d, string key)
    {
        if (!d.TryGetValue(key, out var v) || v == null) return 0;
        return v is int i ? i : Convert.ToInt32(v);
    }

    private static decimal GetAmount(Dictionary<string, object?> d, string key)
    {
        if (!d.TryGetValue(key, out var v) || v == null) return 0m;
        if (v is decimal dec) return dec;
        if (v is Dictionary<string, object?> dict && dict.TryGetValue("amount", out var a) && a != null)
            return Convert.ToDecimal(a);
        try
        {
            var json = JsonSerializer.Serialize(v);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("amount", out var am))
                return am.GetDecimal();
        }
        catch { }
        return 0m;
    }

    private static string GetMatchStatus(Dictionary<string, object?> inv)
    {
        if (!inv.TryGetValue("threeWayMatch", out var m) || m == null) return "pending";
        if (m is Dictionary<string, object?> dict)
            return dict.TryGetValue("status", out var s) ? s?.ToString() ?? "pending" : "pending";
        try
        {
            var json = JsonSerializer.Serialize(m);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("status", out var s))
                return s.GetString() ?? "pending";
        }
        catch { }
        return "pending";
    }

    private static object? ConvertJsonElement(JsonElement el)
    {
        return el.ValueKind switch
        {
            JsonValueKind.String => el.GetString(),
            JsonValueKind.Number => el.TryGetInt64(out var l) ? (l >= int.MinValue && l <= int.MaxValue ? (object)(int)l : l) : (object)el.GetDecimal(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            JsonValueKind.Array => el.EnumerateArray().Select(ConvertJsonElement).ToArray(),
            JsonValueKind.Object => el.EnumerateObject().ToDictionary(p => p.Name, p => ConvertJsonElement(p.Value)),
            _ => el.ToString()
        };
    }
}
