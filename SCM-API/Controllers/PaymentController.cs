using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _service;
    private readonly IInvoiceService _invoiceService;

    public PaymentController(IPaymentService service, IInvoiceService invoiceService)
    {
        _service = service;
        _invoiceService = invoiceService;
    }

    private static string GetStr(Dictionary<string, object?> d, string k) =>
        d.TryGetValue(k, out var v) && v != null ? v.ToString()! : "";

    private static decimal GetDec(Dictionary<string, object?> d, string k)
    {
        if (!d.TryGetValue(k, out var v) || v == null) return 0;
        if (v is decimal dec) return dec;
        if (decimal.TryParse(v.ToString(), out var parsed)) return parsed;
        return 0;
    }

    private static object MakeMoney(decimal amount) => new { amount, currency = "ZAR" };

    private static int DaysSince(string? dateStr)
    {
        if (string.IsNullOrEmpty(dateStr)) return 0;
        if (DateTime.TryParse(dateStr, out var dt))
            return Math.Max(0, (int)(DateTime.Now - dt).TotalDays);
        return 0;
    }

    private async Task<List<Dictionary<string, object?>>> GetApprovedInvoicesAsync()
    {
        return (await _invoiceService.GetAllInvoiceDictsAsync())
            .Where(i => GetStr(i, "status") == "approved")
            .Select(i => new Dictionary<string, object?>(i))
            .ToList();
    }

    [HttpGet("dashboard/summary")]
    public async Task<ActionResult> GetDashboardSummary()
    {
        var allBatches = (await _service.GetAllBatchDictsAsync()).ToList();
        var approvedInvoices = await GetApprovedInvoicesAsync();

        var processedBatches = allBatches.Where(b => GetStr(b, "status") == "processed").ToList();
        var pendingBatches = allBatches.Where(b => new[] { "pending_approval", "submitted" }.Contains(GetStr(b, "status"))).ToList();
        var overdueInvoices = (await _invoiceService.GetAllInvoiceDictsAsync())
            .Where(i => !new[] { "paid", "voided", "rejected", "draft" }.Contains(GetStr(i, "status"))
                         && DaysSince(GetStr(i, "dueDate")) > 0)
            .ToList();

        var eftCount = allBatches.Count(b => !string.IsNullOrEmpty(GetStr(b, "eftFileReference")));
        var totalItems = allBatches.Sum(b =>
        {
            if (b.TryGetValue("items", out var items) && items is List<Dictionary<string, object?>> list)
                return list.Count;
            return 0;
        });
        var avgBatchSize = allBatches.Count > 0 ? (double)totalItems / allBatches.Count : 0;
        var remittancesSent = (await _service.GetAllRemittanceDictsAsync()).Count(r => GetStr(r, "status") == "sent");

        return Ok(new
        {
            totalBatches = allBatches.Count,
            processedBatches = new
            {
                count = processedBatches.Count,
                amount = MakeMoney(processedBatches.Sum(b => GetDec(b, "totalAmountValue")))
            },
            pendingBatches = new
            {
                count = pendingBatches.Count,
                amount = MakeMoney(pendingBatches.Sum(b => GetDec(b, "totalAmountValue")))
            },
            readyForPayment = new
            {
                count = approvedInvoices.Count,
                amount = MakeMoney(approvedInvoices.Sum(i =>
                {
                    if (i.TryGetValue("netPayable", out var np) && np is Dictionary<string, object?> npd)
                        return GetDec(npd, "amount");
                    if (i.TryGetValue("totalAmount", out var ta) && ta is Dictionary<string, object?> tad)
                        return GetDec(tad, "amount");
                    return GetDec(i, "totalAmountValue");
                }))
            },
            overduePayments = new
            {
                count = overdueInvoices.Count,
                amount = MakeMoney(overdueInvoices.Sum(i =>
                {
                    if (i.TryGetValue("totalAmount", out var ta) && ta is Dictionary<string, object?> tad)
                        return GetDec(tad, "amount");
                    return GetDec(i, "totalAmountValue");
                }))
            },
            eftFilesGenerated = eftCount,
            failedPayments = new
            {
                count = allBatches.Count(b => new[] { "voided", "reversed", "cancelled" }.Contains(GetStr(b, "status"))),
                amount = MakeMoney(allBatches.Where(b => new[] { "voided", "reversed", "cancelled" }.Contains(GetStr(b, "status"))).Sum(b => GetDec(b, "totalAmountValue")))
            },
            avgProcessingDays = processedBatches.Count > 0 ? Math.Round(processedBatches.Average(b =>
            {
                var created = GetStr(b, "createdDate");
                var processed = GetStr(b, "processedDate");
                if (DateTime.TryParse(created, out var c) && DateTime.TryParse(processed, out var p))
                    return (p - c).TotalDays;
                return 0;
            }), 1) : 0,
            totalPaymentValue = MakeMoney(allBatches.Sum(b => GetDec(b, "totalAmountValue"))),
            avgBatchSize = Math.Round(avgBatchSize, 1),
            remittancesSent
        });
    }

    [HttpGet("payment-forecast")]
    public async Task<ActionResult> GetPaymentForecast()
    {
        var active = (await _invoiceService.GetAllInvoiceDictsAsync())
            .Where(i => new[] { "approved", "verified", "submitted" }.Contains(GetStr(i, "status")))
            .ToList();

        var now = DateTime.Now;
        var weeks = new List<object>();
        for (int w = 0; w < 4; w++)
        {
            var weekStart = now.AddDays(w * 7);
            var weekEnd = weekStart.AddDays(7);
            var label = w == 0 ? "This Week" : w == 1 ? "Next Week" : $"Week {w + 1}";

            var weekInvoices = active.Where(i =>
            {
                var dueStr = GetStr(i, "dueDate");
                if (DateTime.TryParse(dueStr, out var due))
                    return due >= weekStart && due < weekEnd;
                return w == 0;
            }).ToList();

            var total = weekInvoices.Sum(i =>
            {
                if (i.TryGetValue("totalAmount", out var ta) && ta is Dictionary<string, object?> tad)
                    return GetDec(tad, "amount");
                return GetDec(i, "totalAmountValue");
            });

            weeks.Add(new
            {
                label,
                count = weekInvoices.Count,
                amount = MakeMoney(total)
            });
        }

        return Ok(weeks);
    }

    [HttpGet("creditor-age-analysis")]
    public async Task<ActionResult> GetCreditorAgeAnalysis()
    {
        var active = (await _invoiceService.GetAllInvoiceDictsAsync())
            .Where(i => !new[] { "paid", "voided", "rejected", "draft" }.Contains(GetStr(i, "status")))
            .ToList();

        var supplierGroups = active.GroupBy(i => GetStr(i, "supplierName")).ToList();
        var suppliers = new List<object>();
        decimal totalCurrent = 0, total30 = 0, total60 = 0, total90 = 0, total120 = 0;

        foreach (var grp in supplierGroups)
        {
            decimal sCurrent = 0, s30 = 0, s60 = 0, s90 = 0, s120 = 0;
            foreach (var inv in grp)
            {
                var age = DaysSince(GetStr(inv, "invoiceDate"));
                decimal amt = 0;
                if (inv.TryGetValue("totalAmount", out var ta) && ta is Dictionary<string, object?> tad)
                    amt = GetDec(tad, "amount");
                else
                    amt = GetDec(inv, "totalAmountValue");

                if (age <= 30) sCurrent += amt;
                else if (age <= 60) s30 += amt;
                else if (age <= 90) s60 += amt;
                else if (age <= 120) s90 += amt;
                else s120 += amt;
            }

            totalCurrent += sCurrent; total30 += s30; total60 += s60; total90 += s90; total120 += s120;

            suppliers.Add(new
            {
                supplierName = grp.Key,
                invoiceCount = grp.Count(),
                current = MakeMoney(sCurrent),
                days30 = MakeMoney(s30),
                days60 = MakeMoney(s60),
                days90 = MakeMoney(s90),
                days120Plus = MakeMoney(s120),
                total = MakeMoney(sCurrent + s30 + s60 + s90 + s120)
            });
        }

        return Ok(new
        {
            suppliers,
            totals = new
            {
                current = MakeMoney(totalCurrent),
                days30 = MakeMoney(total30),
                days60 = MakeMoney(total60),
                days90 = MakeMoney(total90),
                days120Plus = MakeMoney(total120),
                grandTotal = MakeMoney(totalCurrent + total30 + total60 + total90 + total120),
                totalInvoices = active.Count,
                totalSuppliers = supplierGroups.Count
            }
        });
    }

    [HttpGet("batches")]
    public async Task<ActionResult> GetBatches(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null, [FromQuery] string? paymentMethod = null,
        [FromQuery] string? dateFrom = null, [FromQuery] string? dateTo = null,
        [FromQuery] string? search = null)
    {
        var query = (await _service.GetAllBatchDictsAsync()).AsEnumerable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(b => GetStr(b, "status") == status);
        if (!string.IsNullOrEmpty(paymentMethod))
            query = query.Where(b => GetStr(b, "paymentMethod") == paymentMethod);
        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var df))
            query = query.Where(b => DateTime.TryParse(GetStr(b, "batchDate"), out var bd) && bd >= df);
        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var dt2))
            query = query.Where(b => DateTime.TryParse(GetStr(b, "batchDate"), out var bd) && bd <= dt2);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(b =>
                GetStr(b, "referenceNumber").Contains(search, StringComparison.OrdinalIgnoreCase) ||
                GetStr(b, "notes").Contains(search, StringComparison.OrdinalIgnoreCase));

        var all = query.OrderByDescending(b => GetStr(b, "batchDate")).ToList();
        var total = all.Count;
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        var items = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var result = items.Select(b => BuildBatchResponse(b)).ToList();

        return Ok(new { data = result, total, totalPages });
    }

    [HttpGet("batches/{id}")]
    public async Task<ActionResult> GetBatchById(string id)
    {
        var batch = await _service.GetBatchDictAsync(id);
        if (batch == null)
            return NotFound(new { error = "Payment batch not found" });

        return Ok(BuildBatchResponse(batch));
    }

    [HttpPost("batches")]
    public async Task<ActionResult> CreateBatch([FromBody] CreateBatchRequest request)
    {
        if (request.InvoiceIds == null || request.InvoiceIds.Count == 0)
            return BadRequest(new { error = "At least one invoice is required" });

        var items = new List<Dictionary<string, object?>>();
        var invoiceDetails = new List<Dictionary<string, object?>>();
        decimal totalAmount = 0;

        foreach (var invId in request.InvoiceIds)
        {
            if ((await _invoiceService.GetInvoiceDictAsync(invId)) is not {} inv) continue;
            if (GetStr(inv, "status") != "approved") continue;

            decimal amt = 0;
            if (inv.TryGetValue("netPayable", out var np) && np is Dictionary<string, object?> npd)
                amt = GetDec(npd, "amount");
            else if (inv.TryGetValue("totalAmount", out var ta) && ta is Dictionary<string, object?> tad)
                amt = GetDec(tad, "amount");
            else
                amt = GetDec(inv, "totalAmountValue");

            items.Add(new Dictionary<string, object?>
            {
                ["invoiceId"] = invId,
                ["invoiceNumber"] = GetStr(inv, "referenceNumber"),
                ["supplierName"] = GetStr(inv, "supplierName"),
                ["supplierId"] = GetStr(inv, "supplierId"),
                ["amount"] = MakeMoney(amt),
                ["bankName"] = "Standard Bank",
                ["branchCode"] = "051001",
                ["accountNumber"] = "0412345678",
                ["remittanceSent"] = false
            });

            invoiceDetails.Add(new Dictionary<string, object?>
            {
                ["invoiceId"] = invId,
                ["amount"] = amt
            });

            totalAmount += amt;

            inv["status"] = "payment_batched";
            await _invoiceService.SaveInvoiceDictAsync(invId, inv);
        }

        if (items.Count == 0)
            return BadRequest(new { error = "No valid approved invoices found" });

        var batchData = new Dictionary<string, object?>
        {
            ["status"] = "draft",
            ["paymentMethod"] = request.PaymentMethod ?? "EFT",
            ["totalAmountValue"] = totalAmount,
            ["notes"] = request.Notes ?? "",
            ["invoices"] = invoiceDetails.ToArray()
        };

        var created = await _service.CreateAsync(batchData);
        var batch = created as Dictionary<string, object?> ?? new Dictionary<string, object?>();

        batch["items"] = items;
        batch["itemCount"] = items.Count;
        batch["totalAmount"] = MakeMoney(totalAmount);
        batch["batchDate"] = DateTime.Now.ToString("yyyy-MM-dd");
        batch["createdBy"] = "admin";
        batch["createdByName"] = "System Administrator";
        batch["createdDate"] = DateTime.Now.ToString("o");
        batch["approvalChain"] = new List<Dictionary<string, object?>>();
        batch["auditTrail"] = new List<Dictionary<string, object?>>
        {
            new()
            {
                ["action"] = "Batch Created",
                ["details"] = $"Payment batch {batch.GetValueOrDefault("referenceNumber")} created with {items.Count} invoices totalling R{totalAmount:N2}",
                ["userId"] = "admin",
                ["timestamp"] = DateTime.Now.ToString("o")
            }
        };

        var batchId = batch.GetValueOrDefault("id")?.ToString() ?? "0";
        await _service.SaveBatchDictAsync(batchId, batch);

        return Ok(BuildBatchResponse(batch));
    }

    [HttpPut("batches/{id}")]
    public async Task<ActionResult> UpdateBatch(string id, [FromBody] UpdateBatchRequest request)
    {
        var batch = await _service.GetBatchDictAsync(id);
        if (batch == null)
            return NotFound(new { error = "Batch not found" });

        var status = GetStr(batch, "status");
        if (status != "draft")
            return BadRequest(new { error = $"Cannot update batch in '{status}' status. Must be 'draft'." });

        if (!string.IsNullOrEmpty(request.PaymentMethod))
            batch["paymentMethod"] = request.PaymentMethod;
        if (request.Notes != null)
            batch["notes"] = request.Notes;

        AddAuditEntry(batch, "Batch Updated", "Payment batch details updated");
        await _service.SaveBatchDictAsync(id, batch);

        return Ok(BuildBatchResponse(batch));
    }

    [HttpDelete("batches/{id}")]
    public async Task<ActionResult> DeleteBatch(string id)
    {
        var batch = await _service.GetBatchDictAsync(id);
        if (batch == null)
            return NotFound(new { error = "Batch not found" });

        var status = GetStr(batch, "status");
        if (status != "draft")
            return BadRequest(new { error = $"Cannot delete batch in '{status}' status. Must be 'draft'." });

        await ReleaseInvoicesAsync(batch);
        await _service.DeleteBatchDictAsync(id);
        await _service.SaveBatchDocumentsDictAsync(id, new List<Dictionary<string, object?>>());

        return Ok(new { message = "Payment batch deleted" });
    }

    [HttpPost("batches/{id}/add-invoice")]
    public async Task<ActionResult> AddInvoiceToBatch(string id, [FromBody] AddInvoiceRequest request)
    {
        var batch = await _service.GetBatchDictAsync(id);
        if (batch == null)
            return NotFound(new { error = "Batch not found" });

        var status = GetStr(batch, "status");
        if (status != "draft")
            return BadRequest(new { error = $"Cannot add invoices to batch in '{status}' status. Must be 'draft'." });

        if (request.InvoiceIds == null || request.InvoiceIds.Count == 0)
            return BadRequest(new { error = "At least one invoice ID is required" });

        var items = batch["items"] as List<Dictionary<string, object?>> ?? new();
        decimal totalAmount = GetDec(batch, "totalAmountValue");
        int added = 0;

        foreach (var invId in request.InvoiceIds)
        {
            if ((await _invoiceService.GetInvoiceDictAsync(invId)) is not {} inv) continue;
            if (GetStr(inv, "status") != "approved") continue;
            if (items.Any(i => i.TryGetValue("invoiceId", out var eid) && Convert.ToInt32(eid) == invId)) continue;

            decimal amt = 0;
            if (inv.TryGetValue("netPayable", out var np) && np is Dictionary<string, object?> npd)
                amt = GetDec(npd, "amount");
            else if (inv.TryGetValue("totalAmount", out var ta) && ta is Dictionary<string, object?> tad)
                amt = GetDec(tad, "amount");
            else
                amt = GetDec(inv, "totalAmountValue");

            items.Add(new Dictionary<string, object?>
            {
                ["invoiceId"] = invId,
                ["invoiceNumber"] = GetStr(inv, "referenceNumber"),
                ["supplierName"] = GetStr(inv, "supplierName"),
                ["supplierId"] = GetStr(inv, "supplierId"),
                ["amount"] = MakeMoney(amt),
                ["bankName"] = "Standard Bank",
                ["branchCode"] = "051001",
                ["accountNumber"] = "0412345678",
                ["remittanceSent"] = false
            });

            totalAmount += amt;
            inv["status"] = "payment_batched";
            await _invoiceService.SaveInvoiceDictAsync(invId, inv);
            await _service.AddInvoiceDetailAsync(id, invId, amt);
            added++;
        }

        batch["items"] = items;
        batch["itemCount"] = items.Count;
        batch["totalAmountValue"] = totalAmount;
        batch["totalAmount"] = MakeMoney(totalAmount);

        AddAuditEntry(batch, "Invoices Added", $"{added} invoice(s) added to batch");
        await _service.SaveBatchDictAsync(id, batch);

        return Ok(new { batch = BuildBatchResponse(batch), added });
    }

    [HttpPost("batches/{id}/remove-invoice")]
    public async Task<ActionResult> RemoveInvoiceFromBatch(string id, [FromBody] RemoveInvoiceRequest request)
    {
        var batch = await _service.GetBatchDictAsync(id);
        if (batch == null)
            return NotFound(new { error = "Batch not found" });

        var status = GetStr(batch, "status");
        if (status != "draft")
            return BadRequest(new { error = $"Cannot remove invoices from batch in '{status}' status. Must be 'draft'." });

        if (request.InvoiceId == 0)
            return BadRequest(new { error = "Invoice ID is required" });

        var items = batch["items"] as List<Dictionary<string, object?>> ?? new();
        var invId = request.InvoiceId;

        var item = items.FirstOrDefault(i => i.TryGetValue("invoiceId", out var eid) && Convert.ToInt32(eid) == invId);
        if (item == null)
            return NotFound(new { error = "Invoice not found in batch" });

        items.Remove(item);

        if ((await _invoiceService.GetInvoiceDictAsync(invId)) is {} inv && GetStr(inv, "status") == "payment_batched")
        {
            inv["status"] = "approved";
            await _invoiceService.SaveInvoiceDictAsync(invId, inv);
        }

        decimal removedAmt = 0;
        if (item.TryGetValue("amount", out var a) && a is Dictionary<string, object?> ad)
            removedAmt = GetDec(ad, "amount");

        await _service.RemoveInvoiceDetailAsync(id, invId);

        var totalAmount = GetDec(batch, "totalAmountValue") - removedAmt;
        batch["items"] = items;
        batch["itemCount"] = items.Count;
        batch["totalAmountValue"] = totalAmount;
        batch["totalAmount"] = MakeMoney(totalAmount);

        AddAuditEntry(batch, "Invoice Removed", $"Invoice {request.InvoiceId} removed from batch");
        await _service.SaveBatchDictAsync(id, batch);

        return Ok(new { batch = BuildBatchResponse(batch) });
    }

    [HttpPost("batches/{id}/submit")]
    public async Task<ActionResult> SubmitBatch(string id)
    {
        var (result, error) = await _service.SubmitBatchDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        return Ok(new { batch = BuildBatchResponse(result) });
    }

    [HttpPost("batches/{id}/approve")]
    public async Task<ActionResult> ApproveBatch(string id, [FromBody] ApproveRequest? request = null)
    {
        var (result, error) = await _service.ApproveBatchDictAsync(id, request?.Comments);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        return Ok(new { batch = BuildBatchResponse(result) });
    }

    [HttpPost("batches/{id}/generate-eft")]
    public async Task<ActionResult> GenerateEft(string id)
    {
        var (result, error) = await _service.GenerateEftDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        return Ok(new
        {
            batch = BuildBatchResponse(result),
            eftFileName = GetStr(result, "eftFileName"),
            eftFileReference = GetStr(result, "eftFileReference")
        });
    }

    [HttpGet("batches/{id}/download-eft")]
    public async Task<ActionResult> DownloadEft(string id)
    {
        var batch = await _service.GetBatchDictAsync(id);
        if (batch == null)
            return NotFound(new { error = "Batch not found" });

        var eftRef = GetStr(batch, "eftFileReference");
        if (string.IsNullOrEmpty(eftRef))
            return BadRequest(new { error = "No EFT file has been generated for this batch" });

        var items = batch["items"] as List<Dictionary<string, object?>> ?? new();
        var refNum = GetStr(batch, "referenceNumber");
        var batchDate = GetStr(batch, "batchDate");
        var branchCode = (await _service.GetBankConfigAsync())["branchCode"]?.ToString() ?? "051001";
        var accountNumber = (await _service.GetBankConfigAsync())["accountNumber"]?.ToString() ?? "0412345678";
        var accountName = (await _service.GetBankConfigAsync())["accountName"]?.ToString() ?? "George Municipality SCM";

        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"H,{DateTime.Now:yyyyMMdd},{branchCode},{accountNumber},{accountName},STANDARD BANK,ACB");
        sb.AppendLine($"B,{refNum},{batchDate},{items.Count},{GetDec(batch, "totalAmountValue"):F2}");

        int seq = 1;
        foreach (var item in items)
        {
            var supplierName = GetStr(item, "supplierName");
            var itemBranch = GetStr(item, "branchCode");
            var itemAccount = GetStr(item, "accountNumber");
            decimal amt = 0;
            if (item.TryGetValue("amount", out var a))
            {
                if (a is Dictionary<string, object?> ad) amt = GetDec(ad, "amount");
                else if (a != null)
                {
                    var prop = a.GetType().GetProperty("amount");
                    if (prop != null) amt = Convert.ToDecimal(prop.GetValue(a) ?? 0);
                }
            }
            sb.AppendLine($"D,{seq:D4},{supplierName},{itemBranch},{itemAccount},{amt:F2},{GetStr(item, "invoiceNumber")}");
            seq++;
        }

        sb.AppendLine($"T,{items.Count},{GetDec(batch, "totalAmountValue"):F2}");

        var fileName = GetStr(batch, "eftFileName");
        if (string.IsNullOrEmpty(fileName)) fileName = $"EFT_{refNum}.txt";

        var content = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
        return File(content, "text/plain", fileName);
    }

    [HttpPost("batches/{id}/process")]
    public async Task<ActionResult> ProcessBatch(string id)
    {
        var (result, error) = await _service.ProcessBatchDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });

        var items = result["items"] as List<Dictionary<string, object?>> ?? new();
        int invoicesPaid = 0;
        foreach (var item in items)
        {
            if (item.TryGetValue("invoiceId", out var invIdObj) && invIdObj != null)
            {
                var invId = Convert.ToInt32(invIdObj);
                if ((await _invoiceService.GetInvoiceDictAsync(invId)) is {} inv)
                {
                    inv["status"] = "paid";
                    inv["paidDate"] = DateTime.Now.ToString("o");
                    await _invoiceService.SaveInvoiceDictAsync(invId, inv);
                    invoicesPaid++;
                }
            }
            item["remittanceSent"] = false;
        }
        await _service.SaveBatchDictAsync(id, result);

        return Ok(new { batch = BuildBatchResponse(result), invoicesPaid });
    }

    [HttpPost("batches/{id}/void")]
    public async Task<ActionResult> VoidBatch(string id)
    {
        var (result, error) = await _service.VoidBatchDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        await ReleaseInvoicesAsync(result);
        return Ok(new { batch = BuildBatchResponse(result) });
    }

    [HttpPost("{id}/reverse")]
    public async Task<ActionResult> ReverseBatch(string id, [FromBody] ReverseRequest? request = null)
    {
        var (result, error) = await _service.ReverseBatchDictAsync(id, request?.Reason, request?.ReversalDate);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });

        var items = result["items"] as List<Dictionary<string, object?>> ?? new();
        foreach (var item in items)
        {
            if (item.TryGetValue("invoiceId", out var invIdObj) && invIdObj != null)
            {
                var invId = Convert.ToInt32(invIdObj);
                if ((await _invoiceService.GetInvoiceDictAsync(invId)) is {} inv)
                {
                    inv["status"] = "approved";
                    inv.Remove("paidDate");
                    await _invoiceService.SaveInvoiceDictAsync(invId, inv);
                }
            }
        }

        return Ok(new { batch = BuildBatchResponse(result) });
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult> CancelBatch(string id, [FromBody] CancelRequest? request = null)
    {
        var (result, error) = await _service.CancelBatchDictAsync(id, request?.Reason);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { error }) : BadRequest(new { error });
        await ReleaseInvoicesAsync(result);
        return Ok(new { batch = BuildBatchResponse(result) });
    }

    [HttpPost("{id}/remittance")]
    public async Task<ActionResult> GenerateRemittance(string id)
    {
        var batch = await _service.GetBatchDictAsync(id);
        if (batch == null)
            return NotFound(new { error = "Batch not found" });

        var batchStatus = GetStr(batch, "status");
        if (batchStatus != "processed")
            return BadRequest(new { error = "Remittance can only be generated for processed batches" });

        var items = batch["items"] as List<Dictionary<string, object?>> ?? new();
        var generatedRemittances = new List<object>();

        var supplierGroups = items.GroupBy(i => GetStr(i, "supplierName")).ToList();
        foreach (var grp in supplierGroups)
        {
            var remId = $"REM-{_service.AllocateNextRemittanceId():D4}";
            var totalAmt = grp.Sum(i =>
            {
                if (i.TryGetValue("amount", out var a) && a is Dictionary<string, object?> ad)
                    return GetDec(ad, "amount");
                return 0m;
            });

            var rem = new Dictionary<string, object?>
            {
                ["id"] = remId,
                ["paymentBatchId"] = id,
                ["batchReference"] = GetStr(batch, "referenceNumber"),
                ["supplierName"] = grp.Key,
                ["supplierId"] = GetStr(grp.First(), "supplierId"),
                ["amount"] = MakeMoney(totalAmt),
                ["status"] = "pending",
                ["generatedDate"] = DateTime.Now.ToString("o"),
                ["sentDate"] = (object?)null,
                ["invoices"] = grp.Select(i => GetStr(i, "invoiceNumber")).ToList()
            };

            await _service.SaveRemittanceDictAsync(remId, rem);
            generatedRemittances.Add(rem);
        }

        AddAuditEntry(batch, "Remittance Generated", $"{generatedRemittances.Count} remittance advices generated");
        await _service.SaveBatchDictAsync(id, batch);

        return Ok(new { remittances = generatedRemittances });
    }

    [HttpPost("{id}/remittance/send")]
    public async Task<ActionResult> SendRemittance(string id, [FromBody] SendRemittanceRequest? request = null)
    {
        var batch = await _service.GetBatchDictAsync(id);
        if (batch == null)
            return NotFound(new { error = "Batch not found" });

        if (GetStr(batch, "status") != "processed")
            return BadRequest(new { error = "Remittance can only be sent for processed batches" });

        var batchRemittances = (await _service.GetAllRemittanceDictsAsync())
            .Where(r => GetStr(r, "paymentBatchId") == id)
            .ToList();

        foreach (var rem in batchRemittances)
        {
            rem["status"] = "sent";
            rem["sentDate"] = DateTime.Now.ToString("o");
            rem["sentMethod"] = request?.Method ?? "email";
            var remId = rem.TryGetValue("id", out var rid) ? rid?.ToString() ?? "" : "";
            if (!string.IsNullOrEmpty(remId))
                await _service.SaveRemittanceDictAsync(remId, rem);
        }

        var items = batch["items"] as List<Dictionary<string, object?>> ?? new();
        foreach (var item in items)
            item["remittanceSent"] = true;

        AddAuditEntry(batch, "Remittance Sent", $"Remittance advices sent via {request?.Method ?? "email"} to {batchRemittances.Count} suppliers");
        await _service.SaveBatchDictAsync(id, batch);

        return Ok(new { message = $"Remittance advices sent to {batchRemittances.Count} suppliers via {request?.Method ?? "email"}" });
    }

    [HttpGet("remittance-advices")]
    public async Task<ActionResult> GetRemittances()
    {
        var result = (await _service.GetAllRemittanceDictsAsync())
            .OrderByDescending(r => GetStr(r, "generatedDate"))
            .ToList();

        return Ok(new { data = result });
    }

    [HttpPost("remittance-advices/{id}/resend")]
    public async Task<ActionResult> ResendRemittance(string id)
    {
        if ((await _service.GetRemittanceDictAsync(id)) is not {} rem)
            return NotFound(new { error = "Remittance advice not found" });

        rem["status"] = "sent";
        rem["sentDate"] = DateTime.Now.ToString("o");
        await _service.SaveRemittanceDictAsync(id, rem);

        return Ok(new { message = "Remittance advice resent" });
    }

    [HttpGet("cr01-report")]
    public async Task<ActionResult> GetCr01Report([FromQuery] string? month = null)
    {
        var active = (await _invoiceService.GetAllInvoiceDictsAsync())
            .Where(i => !new[] { "paid", "voided", "rejected", "draft" }.Contains(GetStr(i, "status")))
            .ToList();

        if (!string.IsNullOrEmpty(month) && month.Contains('-'))
        {
            var parts = month.Split('-');
            if (parts.Length == 2 && int.TryParse(parts[0], out var yr) && int.TryParse(parts[1], out var mo))
            {
                active = active.Where(i =>
                {
                    var dateStr = GetStr(i, "invoiceDate");
                    if (DateTime.TryParse(dateStr, out var d))
                        return d.Year <= yr && d.Month <= mo;
                    return true;
                }).ToList();
            }
        }

        var reportPeriod = !string.IsNullOrEmpty(month) ? month : DateTime.Now.ToString("yyyy-MM");
        int overdue = 0, compliant = 0;
        var data = new List<object>();

        foreach (var inv in active)
        {
            var age = DaysSince(GetStr(inv, "invoiceDate"));
            decimal amt = 0;
            if (inv.TryGetValue("totalAmount", out var ta) && ta is Dictionary<string, object?> tad)
                amt = GetDec(tad, "amount");
            else
                amt = GetDec(inv, "totalAmountValue");

            decimal current = 0, d30 = 0, d60 = 0, d90 = 0, d120 = 0;
            if (age <= 30) current = amt;
            else if (age <= 60) d30 = amt;
            else if (age <= 90) d60 = amt;
            else if (age <= 120) d90 = amt;
            else d120 = amt;

            if (age > 30) overdue++;
            else compliant++;

            string reason = age > 120 ? "MFMA S65 Breach — urgent" : age > 90 ? "Approaching MFMA deadline" : age > 60 ? "Overdue — escalate" : age > 30 ? "Past due date" : "";

            data.Add(new
            {
                supplierName = GetStr(inv, "supplierName"),
                invoiceNumber = GetStr(inv, "referenceNumber"),
                invoiceDate = GetStr(inv, "invoiceDate"),
                current,
                days30 = d30,
                days60 = d60,
                days90 = d90,
                days120Plus = d120,
                total = amt,
                reason
            });
        }

        return Ok(new
        {
            reportName = "CR01 — Creditor Age Analysis",
            reportPeriod,
            municipalityName = "George Local Municipality",
            summary = new
            {
                totalCreditors = active.Select(i => GetStr(i, "supplierName")).Distinct().Count(),
                totalOutstanding = MakeMoney(active.Sum(i =>
                {
                    if (i.TryGetValue("totalAmount", out var ta2) && ta2 is Dictionary<string, object?> tad2)
                        return GetDec(tad2, "amount");
                    return GetDec(i, "totalAmountValue");
                })),
                overdue,
                mfmaCompliant = compliant
            },
            data
        });
    }

    [HttpGet("reconciliation")]
    public async Task<ActionResult> GetReconciliation([FromQuery] string? status = null, [FromQuery] string? dateFrom = null, [FromQuery] string? dateTo = null)
    {
        var processedBatches = (await _service.GetAllBatchDictsAsync())
            .Where(b => new[] { "processed", "eft_generated" }.Contains(GetStr(b, "status")))
            .ToList();

        var items = new List<dynamic>();
        foreach (var b in processedBatches)
        {
            var batchId = GetStr(b, "id");
            var totalAmtValue = GetDec(b, "totalAmountValue");

            string reconStatus;
            string? bankRef = null;
            object? variance = null;

            if ((await _service.GetReconMatchDictAsync(batchId)) is {} matchRecord)
            {
                reconStatus = GetStr(matchRecord, "reconciliationStatus");
                bankRef = GetStr(matchRecord, "bankStatementRef");
                var matchedAmt = GetDec(matchRecord, "matchedAmount");
                var diff = totalAmtValue - matchedAmt;
                variance = MakeMoney(Math.Abs(diff));
                if (reconStatus == "partial" && diff == 0) reconStatus = "matched";
            }
            else
            {
                reconStatus = "unmatched";
            }

            items.Add(new
            {
                paymentId = batchId,
                referenceNumber = GetStr(b, "referenceNumber"),
                eftFileReference = GetStr(b, "eftFileReference"),
                paymentDate = GetStr(b, "processedDate") != "" ? GetStr(b, "processedDate") : GetStr(b, "batchDate"),
                supplierNames = string.Join(", ", (b["items"] as List<Dictionary<string, object?>> ?? new()).Select(i => GetStr(i, "supplierName")).Distinct()),
                totalAmount = MakeMoney(totalAmtValue),
                reconciliationStatus = reconStatus,
                bankStatementRef = bankRef,
                variance
            });
        }

        if (!string.IsNullOrEmpty(status))
            items = items.Where(i => i.reconciliationStatus == status).ToList();

        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var dfrom))
            items = items.Where(i => { DateTime pd; return DateTime.TryParse((string)i.paymentDate, out pd) && pd >= dfrom; }).ToList();

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var dto))
            items = items.Where(i => { DateTime pd; return DateTime.TryParse((string)i.paymentDate, out pd) && pd <= dto; }).ToList();

        var matchedCount = items.Count(i => i.reconciliationStatus == "matched");
        var unmatchedCount = items.Count(i => i.reconciliationStatus == "unmatched");
        var partialCount = items.Count(i => i.reconciliationStatus == "partial");
        var matchRate = items.Count > 0 ? Math.Round((double)matchedCount / items.Count * 100, 1) : 0;
        var totalValue = items.Sum(i =>
        {
            var prop = i.totalAmount.GetType().GetProperty("amount");
            return prop != null ? (decimal)(prop.GetValue(i.totalAmount) ?? 0m) : 0m;
        });

        var summary = new
        {
            total = items.Count,
            matched = matchedCount,
            unmatched = unmatchedCount,
            partial = partialCount,
            matchRate,
            totalValue = MakeMoney(totalValue)
        };

        return Ok(new { items, summary });
    }

    [HttpPost("reconciliation/match")]
    public async Task<ActionResult> MatchPayment([FromBody] MatchPaymentRequest request)
    {
        if (string.IsNullOrEmpty(request.PaymentId))
            return BadRequest(new { error = "Payment ID is required" });

        if ((await _service.GetBatchDictAsync(request.PaymentId)) is not {} batch)
            return NotFound(new { error = "Payment batch not found" });

        var totalAmtValue = GetDec(batch, "totalAmountValue");
        var matchedAmount = request.MatchedAmount ?? totalAmtValue;
        var reconStatus = matchedAmount >= totalAmtValue ? "matched" : "partial";

        await _service.SaveReconMatchDictAsync(request.PaymentId, new Dictionary<string, object?>
        {
            ["paymentId"] = request.PaymentId,
            ["reconciliationStatus"] = reconStatus,
            ["bankStatementRef"] = request.BankStatementRef,
            ["matchedDate"] = DateTime.Now.ToString("o"),
            ["matchedAmount"] = matchedAmount
        });

        return Ok(new
        {
            entry = new
            {
                paymentId = request.PaymentId,
                status = reconStatus,
                bankStatementRef = request.BankStatementRef,
                matchedDate = DateTime.Now.ToString("o"),
                matchedAmount
            }
        });
    }

    [HttpGet("schedule")]
    public async Task<ActionResult> GetSchedule([FromQuery] string? month = null, [FromQuery] string? year = null)
    {
        var mo = int.TryParse(month, out var m) ? m : DateTime.Now.Month;
        var yr = int.TryParse(year, out var y) ? y : DateTime.Now.Year;

        var active = (await _invoiceService.GetAllInvoiceDictsAsync())
            .Where(i => new[] { "approved", "verified", "submitted", "payment_batched" }.Contains(GetStr(i, "status")))
            .Where(i =>
            {
                var dueStr = GetStr(i, "dueDate");
                if (string.IsNullOrEmpty(dueStr) || !DateTime.TryParse(dueStr, out var dd)) return true;
                return dd.Month == mo && dd.Year == yr;
            })
            .ToList();

        var upcoming = active.Select(inv =>
        {
            var age = DaysSince(GetStr(inv, "invoiceDate"));
            decimal amt = 0;
            if (inv.TryGetValue("totalAmount", out var ta) && ta is Dictionary<string, object?> tad)
                amt = GetDec(tad, "amount");
            else
                amt = GetDec(inv, "totalAmountValue");

            var dueDate = GetStr(inv, "dueDate");
            var isOverdue = !string.IsNullOrEmpty(dueDate) && DateTime.TryParse(dueDate, out var dd) && dd < DateTime.Now;
            var mfmaRisk = age >= 25 && age <= 30;

            return new
            {
                invoiceId = GetStr(inv, "id"),
                invoiceNumber = GetStr(inv, "referenceNumber"),
                supplierName = GetStr(inv, "supplierName"),
                department = GetStr(inv, "department"),
                amount = MakeMoney(amt),
                dueDate,
                scheduledDate = dueDate,
                ageDays = age,
                isOverdue,
                mfmaRisk,
                status = GetStr(inv, "status")
            };
        }).OrderBy(x => x.dueDate).ToList();

        var calendarDays = upcoming
            .GroupBy(u => u.dueDate)
            .Select(g => new
            {
                date = g.Key,
                count = g.Count(),
                totalAmount = g.Sum(x =>
                {
                    var amtObj = x.amount;
                    if (amtObj is { } anon)
                    {
                        var prop = anon.GetType().GetProperty("amount");
                        if (prop != null) return (decimal)(prop.GetValue(anon) ?? 0m);
                    }
                    return 0m;
                }),
                payments = g.ToList()
            }).ToList();

        var overdueCount = upcoming.Count(u => u.isOverdue);
        var mfmaRiskCount = upcoming.Count(u => u.mfmaRisk);
        var totalAmt = upcoming.Sum(u =>
        {
            var prop = u.amount.GetType().GetProperty("amount");
            if (prop != null) return (decimal)(prop.GetValue(u.amount) ?? 0m);
            return 0m;
        });

        return Ok(new
        {
            summary = new
            {
                totalPayments = upcoming.Count,
                totalAmount = MakeMoney(totalAmt),
                overdueCount,
                mfmaRiskCount
            },
            calendarDays,
            upcoming
        });
    }

    [HttpPut("{invoiceId}/schedule")]
    public async Task<ActionResult> ReschedulePayment(string invoiceId, [FromBody] RescheduleRequest request)
    {
        if (int.TryParse(invoiceId, out var invId) && (await _invoiceService.GetInvoiceDictAsync(invId)) is {} inv)
        {
            inv["dueDate"] = request.ScheduledDate;
            return Ok(new { message = "Payment rescheduled", invoiceId, scheduledDate = request.ScheduledDate });
        }
        return NotFound(new { error = "Invoice not found" });
    }

    [HttpGet("exceptions")]
    public async Task<ActionResult> GetExceptions()
    {
        var active = (await _invoiceService.GetAllInvoiceDictsAsync())
            .Where(i => !new[] { "paid", "voided", "rejected", "draft" }.Contains(GetStr(i, "status")))
            .ToList();

        var overdue = active.Where(i =>
        {
            var dueStr = GetStr(i, "dueDate");
            return !string.IsNullOrEmpty(dueStr) && DateTime.TryParse(dueStr, out var dd) && dd < DateTime.Now;
        }).ToList();

        var mfmaViolations = active.Where(i => DaysSince(GetStr(i, "invoiceDate")) > 30).ToList();

        Func<Dictionary<string, object?>, object> mapException = (inv) =>
        {
            decimal amt = 0;
            if (inv.TryGetValue("totalAmount", out var ta) && ta is Dictionary<string, object?> tad)
                amt = GetDec(tad, "amount");
            else
                amt = GetDec(inv, "totalAmountValue");

            var age = DaysSince(GetStr(inv, "invoiceDate"));
            var interestRate = 0.02m;
            var interest = age > 30 ? amt * interestRate * (age - 30) / 365 : 0;

            return new
            {
                invoiceId = GetStr(inv, "id"),
                invoiceNumber = GetStr(inv, "referenceNumber"),
                supplierName = GetStr(inv, "supplierName"),
                amount = MakeMoney(amt),
                ageDays = age,
                dueDate = GetStr(inv, "dueDate"),
                interest = MakeMoney(Math.Round(interest, 2))
            };
        };

        return Ok(new
        {
            totalExceptions = overdue.Count + mfmaViolations.Count,
            overdue_payments = new
            {
                count = overdue.Count,
                items = overdue.Select(i => mapException(i)).ToList()
            },
            failed_eft = new
            {
                count = 0,
                items = Array.Empty<object>()
            },
            mfma_violations = new
            {
                count = mfmaViolations.Count,
                items = mfmaViolations.Select(i => mapException(i)).ToList()
            },
            duplicate_payments = new
            {
                count = 0,
                items = Array.Empty<object>()
            }
        });
    }

    [HttpGet("{paymentId}/documents")]
    public async Task<ActionResult> GetDocuments(string paymentId)
    {
        var docs = (await _service.GetBatchDocumentsDictAsync(paymentId)) is {} list ? list : new List<Dictionary<string, object?>>();
        return Ok(new { documents = docs });
    }

    [HttpPost("{paymentId}/documents")]
    public async Task<ActionResult> UploadDocument(string paymentId, [FromBody] UploadDocRequest request)
    {
        if (await _service.GetBatchDictAsync(paymentId) == null)
            return NotFound(new { error = "Payment batch not found" });

        var docId = $"DOC-{_service.AllocateNextDocId():D4}";
        var doc = new Dictionary<string, object?>
        {
            ["id"] = docId,
            ["paymentId"] = paymentId,
            ["type"] = request.Type,
            ["filename"] = request.Filename,
            ["size"] = request.Size,
            ["mimeType"] = request.MimeType ?? "application/pdf",
            ["uploadedDate"] = DateTime.Now.ToString("o"),
            ["uploadedBy"] = "admin"
        };

        if ((await _service.GetBatchDocumentsDictAsync(paymentId)) is not {} existingDocs)
            existingDocs = new List<Dictionary<string, object?>>();
        existingDocs.Add(doc);
        await _service.SaveBatchDocumentsDictAsync(paymentId, existingDocs);

        return Ok(doc);
    }

    [HttpDelete("{paymentId}/documents/{docId}")]
    public async Task<ActionResult> DeleteDocument(string paymentId, string docId)
    {
        var docs = await _service.GetBatchDocumentsDictAsync(paymentId);
        if (docs != null)
        {
            var doc = docs.FirstOrDefault(d => GetStr(d, "id") == docId);
            if (doc != null)
            {
                docs.Remove(doc);
                return Ok(new { message = "Document deleted" });
            }
        }
        return NotFound(new { error = "Document not found" });
    }

    [HttpGet("bank-file/config")]
    public async Task<ActionResult> GetBankFileConfig()
    {
        return Ok(new
        {
            defaultBank = (await _service.GetBankConfigAsync())["defaultBank"],
            branchCode = (await _service.GetBankConfigAsync())["branchCode"],
            accountNumber = (await _service.GetBankConfigAsync())["accountNumber"],
            accountName = (await _service.GetBankConfigAsync())["accountName"],
            generatedFiles = (await _service.GetBankConfigAsync())["generatedFiles"]
        });
    }

    [HttpPut("bank-file/config")]
    public async Task<ActionResult> SaveBankFileConfig([FromBody] BankConfigRequest request)
    {
        (await _service.GetBankConfigAsync())["defaultBank"] = request.DefaultBank ?? (await _service.GetBankConfigAsync())["defaultBank"];
        (await _service.GetBankConfigAsync())["branchCode"] = request.BranchCode ?? (await _service.GetBankConfigAsync())["branchCode"];
        (await _service.GetBankConfigAsync())["accountNumber"] = request.AccountNumber ?? (await _service.GetBankConfigAsync())["accountNumber"];
        (await _service.GetBankConfigAsync())["accountName"] = request.AccountName ?? (await _service.GetBankConfigAsync())["accountName"];

        return Ok(new { message = "Bank configuration saved" });
    }

    [HttpGet]
    public async Task<ActionResult<PagedApiResponse<object>>> GetAll(
        [FromQuery] string? financialYear, [FromQuery] int? statusId,
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllAsync(financialYear, statusId, search, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Payment not found"));
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] object dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = 0 }, ApiResponse<object>.Ok(result, "Payment created"));
    }

    [HttpPost("{id:int}/approve")]
    public async Task<ActionResult<ApiResponse>> Approve(int id, [FromBody] object dto)
    {
        var success = await _service.ApproveAsync(id, dto);
        return Ok(ApiResponse.Ok("Payment approved"));
    }

    private static object BuildBatchResponse(Dictionary<string, object?> batch)
    {
        return new
        {
            id = GetStr(batch, "id"),
            referenceNumber = GetStr(batch, "referenceNumber"),
            batchDate = GetStr(batch, "batchDate"),
            status = GetStr(batch, "status"),
            paymentMethod = GetStr(batch, "paymentMethod"),
            totalAmount = batch.TryGetValue("totalAmount", out var ta) ? ta : MakeMoney(GetDec(batch, "totalAmountValue")),
            itemCount = batch.TryGetValue("itemCount", out var ic) ? ic : 0,
            items = batch.TryGetValue("items", out var items) ? items : new List<Dictionary<string, object?>>(),
            notes = GetStr(batch, "notes"),
            createdBy = GetStr(batch, "createdBy"),
            createdByName = GetStr(batch, "createdByName"),
            createdDate = GetStr(batch, "createdDate"),
            eftFileReference = batch.TryGetValue("eftFileReference", out var efr) ? efr : null,
            eftFileName = batch.TryGetValue("eftFileName", out var efn) ? efn : null,
            eftGeneratedDate = batch.TryGetValue("eftGeneratedDate", out var egd) ? egd : null,
            processedDate = batch.TryGetValue("processedDate", out var pd) ? pd : null,
            approvedDate = batch.TryGetValue("approvedDate", out var ad) ? ad : null,
            approvalChain = batch.TryGetValue("approvalChain", out var ac) ? ac : new List<Dictionary<string, object?>>(),
            auditTrail = batch.TryGetValue("auditTrail", out var at2) ? at2 : new List<Dictionary<string, object?>>()
        };
    }

    private static void AddAuditEntry(Dictionary<string, object?> batch, string action, string details)
    {
        var trail = batch["auditTrail"] as List<Dictionary<string, object?>> ?? new();
        trail.Add(new Dictionary<string, object?>
        {
            ["action"] = action,
            ["details"] = details,
            ["userId"] = "admin",
            ["timestamp"] = DateTime.Now.ToString("o")
        });
        batch["auditTrail"] = trail;
    }

    private async Task ReleaseInvoicesAsync(Dictionary<string, object?> batch)
    {
        var items = batch["items"] as List<Dictionary<string, object?>> ?? new();
        foreach (var item in items)
        {
            if (item.TryGetValue("invoiceId", out var invIdObj) && invIdObj != null)
            {
                var invId = Convert.ToInt32(invIdObj);
                if ((await _invoiceService.GetInvoiceDictAsync(invId)) is {} inv)
                {
                    if (GetStr(inv, "status") == "payment_batched")
                    {
                        inv["status"] = "approved";
                        await _invoiceService.SaveInvoiceDictAsync(invId, inv);
                    }
                }
            }
        }
    }

    public class CreateBatchRequest
    {
        public List<int> InvoiceIds { get; set; } = new();
        public string? PaymentMethod { get; set; }
        public string? Notes { get; set; }
    }

    public class ApproveRequest
    {
        public string? Comments { get; set; }
    }

    public class ReverseRequest
    {
        public string? Reason { get; set; }
        public string? ReversalDate { get; set; }
    }

    public class CancelRequest
    {
        public string? Reason { get; set; }
    }

    public class SendRemittanceRequest
    {
        public string? Method { get; set; }
    }

    public class MatchPaymentRequest
    {
        public string? PaymentId { get; set; }
        public string? BankStatementRef { get; set; }
        public decimal? MatchedAmount { get; set; }
    }

    public class RescheduleRequest
    {
        public string? ScheduledDate { get; set; }
        public string? Reason { get; set; }
    }

    public class UploadDocRequest
    {
        public string? Type { get; set; }
        public string? Filename { get; set; }
        public int Size { get; set; }
        public string? MimeType { get; set; }
    }

    public class BankConfigRequest
    {
        public string? DefaultBank { get; set; }
        public string? BranchCode { get; set; }
        public string? AccountNumber { get; set; }
        public string? AccountName { get; set; }
    }

    public class UpdateBatchRequest
    {
        public string? PaymentMethod { get; set; }
        public string? Notes { get; set; }
    }

    public class AddInvoiceRequest
    {
        public List<int> InvoiceIds { get; set; } = new();
    }

    public class RemoveInvoiceRequest
    {
        public int InvoiceId { get; set; }
    }
}
