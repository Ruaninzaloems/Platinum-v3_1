using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/quotations")]
public class QuotationController : ControllerBase
{
    private readonly IQuotationService _service;
    private readonly IOrderService _orderService;
    private readonly IVendorManagementService _vendorService;
    private readonly IPppfaScoringService _pppfaService;

    public QuotationController(IQuotationService service, IOrderService orderService, IVendorManagementService vendorService, IPppfaScoringService pppfaService)
    {
        _service = service;
        _orderService = orderService;
        _vendorService = vendorService;
        _pppfaService = pppfaService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedApiResponse<object>>> GetAll(
        [FromQuery] string? financialYear, [FromQuery] int? statusId,
        [FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? department,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllAsync(financialYear, statusId, search, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("dashboard/summary")]
    public async Task<ActionResult> GetDashboardSummary()
    {
        var result = await _service.GetAllAsync(null, null, null, 1, 1000);
        var all = result.Items.ToList();
        string GetStatus(object q) => q is Dictionary<string, object?> d && d.TryGetValue("status", out var s) ? s?.ToString() ?? "" : "";
        decimal GetEstimated(object q) {
            if (q is Dictionary<string, object?> d && d.TryGetValue("estimatedCost", out var ec) && ec != null)
            {
                var amtProp = ec.GetType().GetProperty("amount");
                if (amtProp != null) return Convert.ToDecimal(amtProp.GetValue(ec));
            }
            return 0;
        }
        var totalEstimated = all.Sum(GetEstimated);
        return Ok(ApiResponse<object>.Ok(new
        {
            totalRfqs = all.Count,
            totalEstimatedValue = new { amount = totalEstimated, currency = "ZAR" },
            totalAwardedValue = new { amount = all.Where(q => GetStatus(q) == "awarded").Sum(GetEstimated), currency = "ZAR" },
            averageQuotesPerRfq = 0,
            averageTurnaroundDays = 0,
            byStatus = new {
                draft = all.Count(q => GetStatus(q) == "draft" || GetStatus(q) == "buyer_assigned"),
                published = all.Count(q => GetStatus(q) == "published" || GetStatus(q) == "open"),
                closed = all.Count(q => GetStatus(q) == "closed"),
                evaluated = all.Count(q => GetStatus(q) == "evaluated"),
                pending_approval = all.Count(q => GetStatus(q) == "pending_approval" || GetStatus(q) == "submitted"),
                awarded = all.Count(q => GetStatus(q) == "awarded"),
                approved = all.Count(q => GetStatus(q) == "approved"),
                declined = all.Count(q => GetStatus(q) == "declined"),
                voided = all.Count(q => GetStatus(q) == "voided")
            }
        }));
    }

    [HttpGet("scm-users")]
    public ActionResult GetScmUsers()
        => Ok(new object[]
        {
            new { id = "USR001", name = "J. Molefe", role = "SCM Officer" },
            new { id = "USR002", name = "S. Nkosi", role = "SCM Manager" },
            new { id = "USR003", name = "T. Dlamini", role = "CFO" }
        });

    [HttpGet("buyers")]
    public ActionResult GetBuyers()
        => Ok(new object[]
        {
            new { id = "BUY001", name = "A. van der Merwe", department = "SCM" },
            new { id = "BUY002", name = "L. Dlamini", department = "SCM" }
        });

    [HttpGet("budget-votes")]
    public ActionResult GetBudgetVotes()
        => Ok(new object[]
        {
            new { voteNumber = "Vote 1", description = "Corporate Services", available = 15000000m },
            new { voteNumber = "Vote 5", description = "Community Services", available = 22000000m },
            new { voteNumber = "Vote 8", description = "Infrastructure", available = 52000000m }
        });

    [HttpGet("config")]
    public ActionResult GetConfig()
        => Ok(ApiResponse<object>.Ok(new {
            evaluationMethods = new[] { "Price only", "Price and quality", "Functionality" },
            validityPeriodDays = 90,
            minQuotes = 3,
            businessAreas = new[] { "Roads & Stormwater", "Building & Construction", "ICT", "Electrical & Mechanical", "General Goods", "Professional Services" },
            subSectors = new[] { "Bitumen & Surfacing", "Road Construction", "General Building", "Hardware & Software", "Electrical Installations", "Office Supplies", "Civil Engineering" }
        }));

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Quotation not found"));
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] object dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = 0 }, ApiResponse<object>.Ok(result, "Quotation created"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse>> Update(int id, [FromBody] object dto)
    {
        var success = await _service.UpdateAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Quotation not found"));
        return Ok(ApiResponse.Ok("Quotation updated"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Quotation not found"));
        return Ok(ApiResponse.Ok("Quotation deleted"));
    }

    [HttpPost("{id}/award")]
    public async Task<ActionResult<ApiResponse>> Award(int id, [FromBody] JsonElement dto)
    {
        var success = await _service.AwardAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Quotation not found"));

        var dtoVendorName = "";
        decimal dtoAwardAmount = 0;
        if (dto.ValueKind == JsonValueKind.Object)
        {
            if (dto.TryGetProperty("vendorName", out var vnProp)) dtoVendorName = vnProp.GetString() ?? "";
            if (dto.TryGetProperty("awardAmount", out var aaProp) && aaProp.ValueKind == JsonValueKind.Number) dtoAwardAmount = aaProp.GetDecimal();
        }

        {
            var qData = _service.GetQuotationData(id);
            if (qData != null)
            {
                var quotNumber = qData.TryGetValue("quotationNumber", out var qn) ? qn?.ToString() ?? "" : "";

                var existingOrders = _orderService.GetByQuotationRef(quotNumber);
                if (existingOrders.Count > 0)
                    return Ok(ApiResponse<object>.Ok(new { rfq = qData }, $"Quotation awarded. Purchase order already exists for {quotNumber}"));
                var reqRef = qData.TryGetValue("requisitionRef", out var rr) ? rr?.ToString() ?? "" : "";
                var dpRef = qData.TryGetValue("demandPlanRef", out var dp) ? dp?.ToString() ?? "" : "";
                var dept = qData.TryGetValue("department", out var d) ? d?.ToString() ?? "" : "";
                var fy = qData.TryGetValue("financialYear", out var f) ? f?.ToString() ?? "2025/26" : "2025/26";
                var vote = qData.TryGetValue("voteNumber", out var v) ? v?.ToString() ?? "" : "";
                var contact = qData.TryGetValue("contactPerson", out var c) ? c?.ToString() ?? "System" : "System";

                var supplierName = !string.IsNullOrEmpty(dtoVendorName) ? dtoVendorName : "Vendor";
                var bbbeeLevel = 1;
                decimal awardedAmount = dtoAwardAmount;
                object[]? winningQuoteLineItems = null;

                if (qData.TryGetValue("quotes", out var quotes) && quotes is object[] quoteArr)
                {
                    Dictionary<string, object?>? winningQuote = null;

                    foreach (var q in quoteArr)
                    {
                        if (q is Dictionary<string, object?> qDict)
                        {
                            var isRec = qDict.TryGetValue("isRecommended", out var rec) && rec is bool rb && rb;
                            if (isRec || supplierName == "Vendor")
                            {
                                if (qDict.TryGetValue("vendorName", out var vn) && vn != null) supplierName = vn.ToString() ?? supplierName;
                                else if (qDict.TryGetValue("supplierName", out var sn) && sn != null) supplierName = sn.ToString() ?? supplierName;
                                if (qDict.TryGetValue("bbbeeLevel", out var bl) && bl != null) bbbeeLevel = Convert.ToInt32(bl);
                                if (awardedAmount == 0 && qDict.TryGetValue("totalAmount", out var ta) && ta != null)
                                {
                                    try
                                    {
                                        var taJson = JsonSerializer.Serialize(ta);
                                        using var taDoc = JsonDocument.Parse(taJson);
                                        if (taDoc.RootElement.TryGetProperty("amount", out var amtEl))
                                            awardedAmount = amtEl.GetDecimal();
                                    }
                                    catch { }
                                }
                                winningQuote = qDict;
                                if (isRec) break;
                            }
                        }
                        else
                        {
                            var qType = q.GetType();
                            var recProp = qType.GetProperty("isRecommended");
                            if (recProp != null && (bool)(recProp.GetValue(q) ?? false))
                            {
                                var nameProp = qType.GetProperty("vendorName") ?? qType.GetProperty("supplierName");
                                if (nameProp != null) supplierName = nameProp.GetValue(q)?.ToString() ?? supplierName;
                                var lvlProp = qType.GetProperty("bbbeeLevel");
                                if (lvlProp != null) bbbeeLevel = Convert.ToInt32(lvlProp.GetValue(q));
                                var amtProp = qType.GetProperty("totalAmount");
                                if (amtProp != null)
                                {
                                    var amt = amtProp.GetValue(q);
                                    var amtAmountProp = amt?.GetType().GetProperty("amount");
                                    if (amtAmountProp != null) awardedAmount = Convert.ToDecimal(amtAmountProp.GetValue(amt));
                                }
                                break;
                            }
                        }
                    }

                    if (winningQuote == null && quoteArr.Length > 0 && quoteArr[0] is Dictionary<string, object?> firstDict)
                    {
                        winningQuote = firstDict;
                        if (winningQuote.TryGetValue("vendorName", out var vn) && vn != null) supplierName = vn.ToString() ?? "Vendor";
                        else if (winningQuote.TryGetValue("supplierName", out var sn) && sn != null) supplierName = sn.ToString() ?? "Vendor";
                        if (winningQuote.TryGetValue("bbbeeLevel", out var bl) && bl != null) bbbeeLevel = Convert.ToInt32(bl);
                    }

                    if (awardedAmount == 0 && winningQuote != null)
                    {
                        if (winningQuote.TryGetValue("totalExclVat", out var tevObj) && tevObj != null)
                        {
                            try
                            {
                                var tevJson = JsonSerializer.Serialize(tevObj);
                                using var tevDoc = JsonDocument.Parse(tevJson);
                                if (tevDoc.RootElement.TryGetProperty("amount", out var tevAmt))
                                    awardedAmount = tevAmt.GetDecimal();
                            }
                            catch { }
                        }
                        if (awardedAmount == 0 && winningQuote.TryGetValue("totalAmount", out var taObj) && taObj != null)
                        {
                            try
                            {
                                var taJson = JsonSerializer.Serialize(taObj);
                                using var taDoc = JsonDocument.Parse(taJson);
                                if (taDoc.RootElement.TryGetProperty("amount", out var taAmt))
                                    awardedAmount = taAmt.GetDecimal();
                            }
                            catch { }
                        }
                    }

                    if (winningQuote != null && winningQuote.TryGetValue("lineItems", out var qli) && qli is object[] quoteItems && quoteItems.Length > 0)
                    {
                        var rfqLineItems = qData.TryGetValue("lineItems", out var rli) && rli is object[] rfqLi ? rfqLi : Array.Empty<object>();
                        var rfqLineDict = new Dictionary<string, Dictionary<string, object?>>();
                        foreach (var rItem in rfqLineItems)
                        {
                            var rd = NormalizeToDict(rItem);
                            var rid = rd.GetValueOrDefault("id")?.ToString() ?? "";
                            if (!string.IsNullOrEmpty(rid)) rfqLineDict[rid] = rd;
                        }

                        var merged = new List<object>();
                        foreach (var qItem in quoteItems)
                        {
                            var qd = NormalizeToDict(qItem);
                            var lineRef = qd.GetValueOrDefault("lineRef")?.ToString() ?? "";
                            var mergedItem = new Dictionary<string, object?>(qd);

                            if (!string.IsNullOrEmpty(lineRef) && rfqLineDict.TryGetValue(lineRef, out var rfqLine))
                            {
                                var hasValidQty = mergedItem.TryGetValue("quantity", out var existingQty) && existingQty != null;
                                if (hasValidQty)
                                {
                                    int.TryParse(existingQty!.ToString(), out var parsedQty);
                                    hasValidQty = parsedQty > 0;
                                }
                                if (!hasValidQty && rfqLine.TryGetValue("quantity", out var rqty))
                                    mergedItem["quantity"] = rqty;
                                if (!mergedItem.ContainsKey("unitOfMeasure") && rfqLine.TryGetValue("unitOfMeasure", out var ruom))
                                    mergedItem["unitOfMeasure"] = ruom;
                                if (string.IsNullOrEmpty(mergedItem.GetValueOrDefault("description")?.ToString()))
                                {
                                    mergedItem["description"] = rfqLine.GetValueOrDefault("description")?.ToString()
                                        ?? rfqLine.GetValueOrDefault("purchaseItem")?.ToString()
                                        ?? rfqLine.GetValueOrDefault("name")?.ToString() ?? "Line item";
                                }
                            }

                            merged.Add(mergedItem);
                        }
                        winningQuoteLineItems = merged.ToArray();
                    }

                    if (awardedAmount == 0 && quoteArr.Length > 0)
                    {
                        var firstQ = quoteArr[0];
                        var fqType = firstQ.GetType();
                        var fNameProp = fqType.GetProperty("vendorName") ?? fqType.GetProperty("supplierName");
                        if (fNameProp != null) supplierName = fNameProp.GetValue(firstQ)?.ToString() ?? "Vendor";
                        var fLvlProp = fqType.GetProperty("bbbeeLevel");
                        if (fLvlProp != null) bbbeeLevel = Convert.ToInt32(fLvlProp.GetValue(firstQ));
                        var fAmtProp = fqType.GetProperty("totalAmount");
                        if (fAmtProp != null)
                        {
                            var amt = fAmtProp.GetValue(firstQ);
                            var amtAmountProp = amt?.GetType().GetProperty("amount");
                            if (amtAmountProp != null) awardedAmount = Convert.ToDecimal(amtAmountProp.GetValue(amt));
                        }
                    }
                }

                if (awardedAmount == 0 && qData.TryGetValue("estimatedCost", out var ec) && ec != null)
                {
                    try
                    {
                        var ecJson = JsonSerializer.Serialize(ec);
                        using var ecDoc = JsonDocument.Parse(ecJson);
                        if (ecDoc.RootElement.TryGetProperty("amount", out var ecAmt))
                            awardedAmount = ecAmt.GetDecimal();
                    }
                    catch { }
                }

                var lineItems = winningQuoteLineItems
                    ?? (qData.TryGetValue("lineItems", out var li) && li is object[] items ? items : null);

                var orderId = _orderService.CreateFromQuotation(
                    quotNumber, reqRef, dpRef, dept, supplierName, bbbeeLevel,
                    awardedAmount, fy, vote, contact, lineItems);

                return Ok(ApiResponse<object>.Ok(new { rfq = qData, orderId }, $"Quotation awarded. Purchase order created (ID: {orderId})"));
            }
        }

        var quotation = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { rfq = quotation }, "Quotation awarded"));
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult<ApiResponse>> Submit(int id)
    {
        var success = await _service.SubmitAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Quotation not found"));
        var rfq = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { rfq }, "RFQ submitted for approval"));
    }

    [HttpPost("{id}/publish")]
    public async Task<ActionResult> Publish(int id, [FromBody] object dto)
    {
        var success = await _service.PublishAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Quotation not found"));
        var rfq = await _service.GetByIdAsync(id);

        var incoming = ConvertToDict(dto);
        if (rfq is Dictionary<string, object?> d && incoming.TryGetValue("selectedVendors", out var sv))
        {
            d["invitedVendors"] = sv;
        }

        var invitedCount = 0;
        if (rfq is Dictionary<string, object?> dd && dd.TryGetValue("invitedVendors", out var iv))
        {
            if (iv is System.Text.Json.JsonElement je && je.ValueKind == System.Text.Json.JsonValueKind.Array)
                invitedCount = je.GetArrayLength();
            else if (iv is object[] arr)
                invitedCount = arr.Length;
            else if (iv is System.Collections.ICollection col)
                invitedCount = col.Count;
        }

        return Ok(ApiResponse<object>.Ok(new { rfq, vendorsInvited = invitedCount > 0 ? invitedCount : 3 }, "RFQ published to vendors"));
    }

    [HttpPost("{id}/close")]
    public async Task<ActionResult> Close(int id)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d) { d["status"] = "closed"; d["statusId"] = 3; await _service.UpdateAsync(id, d); }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "RFQ closed"));
    }

    [HttpPost("{id}/evaluate")]
    public async Task<ActionResult> Evaluate(int id)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d) { d["status"] = "evaluated"; d["statusId"] = 5; await _service.UpdateAsync(id, d); }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "RFQ evaluated"));
    }

    [HttpGet("{id}/audit-trail")]
    public async Task<ActionResult> GetAuditTrail(int id)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d && d.TryGetValue("auditTrail", out var trail))
            return Ok(ApiResponse<object>.Ok(new { auditTrail = trail }));
        return Ok(ApiResponse<object>.Ok(new { auditTrail = Array.Empty<object>() }));
    }

    [HttpGet("{id}/notifications")]
    public async Task<ActionResult> GetNotifications(int id)
    {
        return Ok(ApiResponse<object>.Ok(new { notifications = Array.Empty<object>() }));
    }

    [HttpPost("budget-validate")]
    public ActionResult BudgetValidate([FromBody] object dto)
    {
        return Ok(ApiResponse<object>.Ok(new { valid = true, availableBudget = 52000000m, message = "Budget available" }));
    }

    [HttpGet("registered-vendors")]
    public async Task<ActionResult> GetRegisteredVendors([FromQuery] string? search)
    {
        var result = await _vendorService.GetRegistrationsAsync(null, search, 1, 200);
        var vendors = result.Items.Select(v =>
        {
            var dict = v is Dictionary<string, object> d ? d : new Dictionary<string, object>();
            var bbbeeStr = dict.GetValueOrDefault("bbbeeLevel")?.ToString() ?? "Level 1";
            int bbbeeNum = 1;
            if (bbbeeStr.StartsWith("Level ") && int.TryParse(bbbeeStr.Replace("Level ", ""), out var parsed))
                bbbeeNum = parsed;
            else if (int.TryParse(bbbeeStr, out var directParsed))
                bbbeeNum = directParsed;
            return new
            {
                id = dict.GetValueOrDefault("id")?.ToString() ?? "",
                supplierId = dict.GetValueOrDefault("supplierId")?.ToString() ?? dict.GetValueOrDefault("id")?.ToString() ?? "",
                name = dict.GetValueOrDefault("name")?.ToString() ?? "",
                tradingName = dict.GetValueOrDefault("tradingName")?.ToString() ?? "",
                registrationNumber = dict.GetValueOrDefault("registrationNumber")?.ToString() ?? "",
                bbbeeLevel = bbbeeNum,
                bbbeeDisplay = bbbeeStr,
                status = dict.GetValueOrDefault("status")?.ToString() ?? "",
                contactPerson = dict.GetValueOrDefault("contactPerson")?.ToString() ?? "",
                email = dict.GetValueOrDefault("email")?.ToString() ?? "",
                phone = dict.GetValueOrDefault("phone")?.ToString() ?? ""
            };
        }).ToArray();
        return Ok(new { vendors });
    }

    [HttpGet("rotational-vendors")]
    public async Task<ActionResult> GetRotationalVendors(
        [FromQuery] string? businessArea = null,
        [FromQuery] string? subSector = null,
        [FromQuery] string? province = null)
    {
        var result = await _vendorService.GetRegistrationsAsync(null, null, 1, 500);
        var vendors = result.Items
            .Where(v =>
            {
                if (v is not Dictionary<string, object> d) return false;
                var status = d.GetValueOrDefault("status")?.ToString() ?? "";
                return status == "approved" || status == "pending_supervisor_approval";
            })
            .Select(v =>
            {
                var d = (Dictionary<string, object>)v;
                var bbbeeStr = d.GetValueOrDefault("bbbeeLevel")?.ToString() ?? "Level 1";
                int bbbeeNum = 1;
                if (bbbeeStr.StartsWith("Level ") && int.TryParse(bbbeeStr.Replace("Level ", ""), out var parsed))
                    bbbeeNum = parsed;

                return new
                {
                    supplierId = d.GetValueOrDefault("supplierId")?.ToString() ?? d.GetValueOrDefault("id")?.ToString() ?? "",
                    supplierName = d.GetValueOrDefault("name")?.ToString() ?? "",
                    bbbeeLevel = bbbeeNum,
                    province = d.GetValueOrDefault("province")?.ToString() ?? "",
                    businessArea = d.GetValueOrDefault("businessArea")?.ToString() ?? "",
                    subSector = d.GetValueOrDefault("subSector")?.ToString() ?? "",
                    timesInvited = d.ContainsKey("timesInvited") ? Convert.ToInt32(d["timesInvited"]) : 0,
                    timesAwarded = d.ContainsKey("timesAwarded") ? Convert.ToInt32(d["timesAwarded"]) : 0,
                    rotationScore = d.ContainsKey("rotationScore") ? Convert.ToInt32(d["rotationScore"]) : 0
                };
            })
            .ToList();

        if (!string.IsNullOrEmpty(businessArea))
            vendors = vendors.Where(v => v.businessArea == businessArea).ToList();
        if (!string.IsNullOrEmpty(subSector))
            vendors = vendors.Where(v => v.subSector == subSector).ToList();
        if (!string.IsNullOrEmpty(province))
            vendors = vendors.Where(v => v.province == province).ToList();

        return Ok(new { vendors });
    }

    [HttpPost("{id}/assign-buyer")]
    public async Task<ActionResult> AssignBuyer(int id, [FromBody] object dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d)
        {
            var incoming = ConvertToDict(dto);
            d["assignedBuyer"] = incoming.TryGetValue("buyerId", out var bid) ? bid?.ToString() : null;
            d["assignedBuyerName"] = incoming.TryGetValue("buyerName", out var bn) ? bn?.ToString() : null;
            d["status"] = "buyer_assigned";
            d["statusId"] = 1;
            var trail = d.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
            trail.Add(new { action = "Buyer Assigned", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = $"Buyer {bn} assigned" });
            d["auditTrail"] = trail.ToArray();
            await _service.UpdateAsync(id, d);
        }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "Buyer assigned"));
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult> Approve(int id, [FromBody] object dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d)
        {
            d["status"] = "approved";
            d["statusId"] = 8;
            var trail = d.TryGetValue("auditTrail", out var at) && at is List<object> list ? list : at is object[] arr ? arr.ToList() : new List<object>();
            trail.Add(new { action = "Approved", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "RFQ approved" });
            d["auditTrail"] = trail;
            await _service.UpdateAsync(id, d);
        }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "RFQ approved"));
    }

    [HttpPost("{id}/decline")]
    public async Task<ActionResult> Decline(int id, [FromBody] object dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d)
        {
            d["status"] = "declined";
            d["statusId"] = 9;
            var trail = d.TryGetValue("auditTrail", out var at) && at is List<object> list ? list : at is object[] arr ? arr.ToList() : new List<object>();
            trail.Add(new { action = "Declined", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "RFQ declined" });
            d["auditTrail"] = trail;
            await _service.UpdateAsync(id, d);
        }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "RFQ declined"));
    }

    [HttpPost("{id}/return-to-capturer")]
    public async Task<ActionResult> ReturnToCapturer(int id)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d)
        {
            d["status"] = "draft";
            d["statusId"] = 0;
            var trail = d.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
            trail.Add(new { action = "Returned to Capturer", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "RFQ returned to capturer for revision" });
            d["auditTrail"] = trail.ToArray();
            await _service.UpdateAsync(id, d);
        }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "RFQ returned to capturer"));
    }

    [HttpGet("{id}/check-linked-orders")]
    public async Task<ActionResult> CheckLinkedOrders(int id)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        var quotNumber = "";
        if (rfq is Dictionary<string, object?> d)
            quotNumber = d.TryGetValue("quotationNumber", out var qn) ? qn?.ToString() ?? "" : "";
        var orders = _orderService.GetByQuotationRef(quotNumber);
        if (orders.Count > 0)
        {
            var orderNum = orders[0].TryGetValue("orderNumber", out var on) ? on?.ToString() : null;
            var orderId = orders[0].TryGetValue("id", out var oi) ? oi : null;
            return Ok(new { hasLinkedOrder = true, orderNumber = orderNum, orderId });
        }
        return Ok(new { hasLinkedOrder = false });
    }

    [HttpPost("{id}/void")]
    public async Task<ActionResult> Void(int id, [FromBody] object dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d)
        {
            var incoming = ConvertToDict(dto);
            var reason = incoming.TryGetValue("reason", out var r) ? r?.ToString() ?? "" : "";
            d["status"] = "voided";
            d["statusId"] = 10;
            d["voidReason"] = reason;
            d["voidedDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
            var trail = d.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
            trail.Add(new { action = "Voided", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = $"RFQ voided: {reason}" });
            d["auditTrail"] = trail.ToArray();
            await _service.UpdateAsync(id, d);
        }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "RFQ voided"));
    }

    [HttpPost("{id}/quotes")]
    public async Task<ActionResult> AddQuote(int id, [FromBody] object dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d)
        {
            var incoming = ConvertToDict(dto);
            var quotes = d.TryGetValue("quotes", out var q) && q is object[] existingArr ? existingArr.ToList() : new List<object>();

            var incomingVendorId = incoming.TryGetValue("vendorId", out var vid) ? vid?.ToString() : null;
            var incomingVendorName = incoming.TryGetValue("vendorName", out var vn) ? vn?.ToString() : 
                                    (incoming.TryGetValue("supplierName", out var sn2) ? sn2?.ToString() : null);

            foreach (var existingQuote in quotes)
            {
                if (existingQuote is Dictionary<string, object?> eq)
                {
                    var existingVendorId = eq.TryGetValue("vendorId", out var evid) ? evid?.ToString() : null;
                    var existingVendorName = eq.TryGetValue("vendorName", out var evn) ? evn?.ToString() : 
                                            (eq.TryGetValue("supplierName", out var esn) ? esn?.ToString() : null);

                    if (!string.IsNullOrEmpty(incomingVendorId) && !string.IsNullOrEmpty(existingVendorId) 
                        && string.Equals(incomingVendorId, existingVendorId, StringComparison.OrdinalIgnoreCase))
                    {
                        return BadRequest(ApiResponse.Fail($"A quote from this supplier ({incomingVendorName ?? incomingVendorId}) already exists on this RFQ"));
                    }

                    if (string.IsNullOrEmpty(incomingVendorId) && string.IsNullOrEmpty(existingVendorId)
                        && !string.IsNullOrEmpty(incomingVendorName) && !string.IsNullOrEmpty(existingVendorName)
                        && string.Equals(incomingVendorName, existingVendorName, StringComparison.OrdinalIgnoreCase))
                    {
                        return BadRequest(ApiResponse.Fail($"A quote from '{incomingVendorName}' already exists on this RFQ"));
                    }
                }
            }

            incoming["id"] = $"QT-{quotes.Count + 1:D3}";
            incoming["submittedDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
            incoming["status"] = "received";
            quotes.Add(incoming);
            d["quotes"] = quotes.ToArray();
            var trail = d.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
            var supplierName = incoming.TryGetValue("supplierName", out var sn) ? sn?.ToString() ?? "Unknown" : "Unknown";
            trail.Add(new { action = "Quote Received", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = $"Quote received from {supplierName}" });
            d["auditTrail"] = trail.ToArray();
            await _service.UpdateAsync(id, d);
        }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "Quote added"));
    }

    [HttpPut("{id}/quotes/{quoteId}/status")]
    public async Task<ActionResult> UpdateQuoteStatus(int id, string quoteId, [FromBody] object dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d && d.TryGetValue("quotes", out var q) && q is object[] quotes)
        {
            var incoming = ConvertToDict(dto);
            var newStatus = incoming.TryGetValue("status", out var s) ? s?.ToString() ?? "" : "";
            for (int i = 0; i < quotes.Length; i++)
            {
                if (quotes[i] is Dictionary<string, object?> quoteDict && quoteDict.TryGetValue("id", out var qid) && qid?.ToString() == quoteId)
                {
                    quoteDict["status"] = newStatus;
                    break;
                }
            }
            await _service.UpdateAsync(id, d);
        }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "Quote status updated"));
    }

    [HttpPost("{id}/three-quote-justification")]
    public async Task<ActionResult> ThreeQuoteJustification(int id, [FromBody] object dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d)
        {
            var incoming = ConvertToDict(dto);
            d["threeQuoteJustification"] = incoming.TryGetValue("justification", out var j) ? j?.ToString() : null;
            var trail = d.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
            trail.Add(new { action = "Three-Quote Justification", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Three-quote justification submitted" });
            d["auditTrail"] = trail.ToArray();
            await _service.UpdateAsync(id, d);
        }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "Justification recorded"));
    }

    [HttpGet("{id}/documents")]
    public async Task<ActionResult> GetDocuments(int id)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d && d.TryGetValue("documents", out var docs))
            return Ok(docs ?? Array.Empty<object>());
        return Ok(Array.Empty<object>());
    }

    [HttpPost("{id}/documents")]
    public async Task<ActionResult> AddDocument(int id, [FromBody] object dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d)
        {
            var incoming = ConvertToDict(dto);
            var docs = d.TryGetValue("documents", out var existing) && existing is object[] docArr ? docArr.ToList() : new List<object>();
            incoming["id"] = $"DOC-{Guid.NewGuid().ToString()[..8]}";
            incoming["uploadDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
            docs.Add(incoming);
            d["documents"] = docs.ToArray();
        }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "Document added"));
    }

    [HttpDelete("{id}/documents/{docId}")]
    public async Task<ActionResult> DeleteDocument(int id, string docId)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d && d.TryGetValue("documents", out var existing) && existing is object[] docArr)
        {
            d["documents"] = docArr.Where(doc => !(doc is Dictionary<string, object?> dd && dd.TryGetValue("id", out var did) && did?.ToString() == docId)).ToArray();
        }
        return Ok(ApiResponse.Ok("Document removed"));
    }

    [HttpGet("{id}/budget-check")]
    public async Task<ActionResult> BudgetCheck(int id)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        decimal estimatedAmount = 0;
        string voteNumber = "";
        if (rfq is Dictionary<string, object?> d)
        {
            voteNumber = d.TryGetValue("voteNumber", out var v) ? v?.ToString() ?? "" : "";
            if (d.TryGetValue("estimatedCost", out var ec))
            {
                if (ec is Dictionary<string, object?> ecDict && ecDict.TryGetValue("amount", out var amt))
                    try { estimatedAmount = Convert.ToDecimal(amt); } catch { }
                else
                {
                    var amtProp = ec?.GetType().GetProperty("amount");
                    if (amtProp != null) try { estimatedAmount = Convert.ToDecimal(amtProp.GetValue(ec)); } catch { }
                }
            }
        }
        return Ok(new
        {
            valid = true,
            voteNumber,
            estimatedAmount,
            availableBudget = 52000000m,
            remainingAfter = 52000000m - estimatedAmount,
            percentUtilised = estimatedAmount > 0 ? Math.Round(estimatedAmount / 52000000m * 100, 1) : 0
        });
    }

    [HttpPut("{id}/vendor-status")]
    public async Task<ActionResult> UpdateVendorStatus(int id, [FromBody] object dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        return Ok(ApiResponse<object>.Ok(new { rfq }, "Vendor status updated"));
    }

    [HttpPost("{id}/pppfa-score")]
    public async Task<ActionResult> PppfaScore(int id)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));

        var (contractValue, vendorQuotes) = ExtractVendorQuotesFromRfq(rfq);
        if (vendorQuotes.Count == 0)
            return Ok(ApiResponse<object>.Ok(new { message = "No quotes to score", formula = contractValue > 50_000_000m ? "90/10" : "80/20" }));

        var result = await _pppfaService.ScoreVendorsAsync(contractValue, vendorQuotes);
        return Ok(ApiResponse<object>.Ok(result, $"PPPFA {result.Formula} scoring completed"));
    }

    [HttpPost("{id}/comparative-schedule")]
    public async Task<ActionResult> ComparativeSchedule(int id)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));

        var (contractValue, vendorQuotes) = ExtractVendorQuotesFromRfq(rfq);
        var schedule = await _pppfaService.GenerateComparativeScheduleAsync(id, contractValue, vendorQuotes);
        return Ok(ApiResponse<object>.Ok(schedule, "Comparative schedule generated"));
    }

    [HttpPost("{id}/save-adjudication")]
    public async Task<ActionResult> SaveAdjudication(int id, [FromBody] JsonElement dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));

        if (rfq is Dictionary<string, object?> d)
        {
            if (dto.TryGetProperty("quoteUpdates", out var updates) && updates.ValueKind == JsonValueKind.Array)
            {
                var quotes = d.TryGetValue("quotes", out var q) ? q : null;
                if (quotes is object[] quoteArr)
                {
                    foreach (var update in updates.EnumerateArray())
                    {
                        if (!update.TryGetProperty("id", out var uidProp)) continue;
                        var uid = uidProp.GetString();
                        for (int i = 0; i < quoteArr.Length; i++)
                        {
                            if (quoteArr[i] is Dictionary<string, object?> qDict && qDict.TryGetValue("id", out var qid) && qid?.ToString() == uid)
                            {
                                if (update.TryGetProperty("isRecommended", out var recProp)) qDict["isRecommended"] = recProp.GetBoolean();
                                if (update.TryGetProperty("score", out var scoreProp)) qDict["score"] = scoreProp.GetDecimal();
                                if (update.TryGetProperty("complianceStatus", out var csProp)) qDict["complianceStatus"] = csProp.GetString();
                                if (update.TryGetProperty("status", out var stProp)) qDict["status"] = stProp.GetString();
                            }
                        }
                    }
                }
            }
            await _service.UpdateAsync(id, d);
        }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "Adjudication saved"));
    }

    [HttpGet("vendor-rotation")]
    public async Task<ActionResult> GetVendorRotation([FromQuery] string? category)
    {
        var result = await _service.GetVendorRotationAsync(category);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("{id}/record-invitation")]
    public async Task<ActionResult> RecordVendorInvitation(int id, [FromBody] JsonElement dto)
    {
        var vendorId = dto.TryGetProperty("vendorId", out var vid) ? vid.GetString() ?? "" : "";
        var category = dto.TryGetProperty("category", out var cat) ? cat.GetString() ?? "" : "";
        var result = await _service.RecordVendorInvitationAsync(id, vendorId, category);
        return Ok(ApiResponse.Ok("Vendor invitation recorded"));
    }

    [HttpPost("{id}/deviation")]
    public async Task<ActionResult> CreateDeviation(int id, [FromBody] JsonElement dto)
    {
        var reason = dto.TryGetProperty("reason", out var r) ? r.GetString() ?? "" : "Less than 3 quotes received";
        var motivatedBy = dto.TryGetProperty("motivatedBy", out var m) ? m.GetString() ?? "System" : "System";
        var result = await _service.CreateDeviationAsync(id, reason, motivatedBy);
        if (result == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        return Ok(ApiResponse<object>.Ok(result, "Deviation recorded — pending AO approval"));
    }

    [HttpGet("{id}/deviations")]
    public async Task<ActionResult> GetDeviations(int id)
    {
        var result = await _service.GetDeviationsAsync(id);
        return Ok(ApiResponse<object>.Ok(new { deviations = result }));
    }

    [HttpPost("{id}/request-further-vendor")]
    public async Task<ActionResult> RequestFurtherVendor(int id, [FromBody] JsonElement dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        if (rfq is Dictionary<string, object?> d)
        {
            var vendorIds = new List<string>();
            if (dto.TryGetProperty("vendorIds", out var vids) && vids.ValueKind == JsonValueKind.Array)
                vendorIds.AddRange(vids.EnumerateArray().Select(v => v.GetString() ?? "").Where(v => v != ""));
            var reason = dto.TryGetProperty("reason", out var r) ? r.GetString() ?? "" : "";

            foreach (var vid in vendorIds)
                await _service.RecordVendorInvitationAsync(id, vid, "");

            var trail = d.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
            trail.Add(new { action = "Further Vendors Requested", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = $"Requested {vendorIds.Count} additional vendor(s): {reason}" });
            d["auditTrail"] = trail.ToArray();
            await _service.UpdateAsync(id, d);
        }
        return Ok(ApiResponse<object>.Ok(new { rfq }, "Further vendor requests sent"));
    }

    [HttpPost("{id}/send-notification")]
    public async Task<ActionResult> SendNotification(int id, [FromBody] JsonElement dto)
    {
        return Ok(ApiResponse<object>.Ok(new { sent = true, quotationId = id }, "Notification sent"));
    }

    [HttpPost("{id}/generate-document")]
    public async Task<ActionResult> GenerateDocument(int id, [FromBody] JsonElement dto)
    {
        var rfq = await _service.GetByIdAsync(id);
        if (rfq == null) return NotFound(ApiResponse.Fail("Quotation not found"));
        var format = dto.TryGetProperty("format", out var f) ? f.GetString() ?? "pdf" : "pdf";
        return Ok(ApiResponse<object>.Ok(new { documentId = $"DOC-{Guid.NewGuid().ToString()[..8]}", format, quotationId = id, generatedDate = DateTime.UtcNow }, "Document generated"));
    }

    private (decimal contractValue, List<VendorQuoteInput> quotes) ExtractVendorQuotesFromRfq(object? rfq)
    {
        decimal contractValue = 0;
        var vendorQuotes = new List<VendorQuoteInput>();

        if (rfq is not Dictionary<string, object?> d) return (contractValue, vendorQuotes);

        if (d.TryGetValue("estimatedCost", out var ec))
        {
            if (ec is Dictionary<string, object?> ecDict && ecDict.TryGetValue("amount", out var amt))
                try { contractValue = Convert.ToDecimal(amt); } catch { }
            else
            {
                var amtProp = ec?.GetType().GetProperty("amount");
                if (amtProp != null) try { contractValue = Convert.ToDecimal(amtProp.GetValue(ec)); } catch { }
            }
        }

        if (d.TryGetValue("quotes", out var q))
        {
            var quoteList = new List<object>();
            if (q is object[] arr) quoteList.AddRange(arr);
            else if (q is List<object> list) quoteList.AddRange(list);

            foreach (var quote in quoteList)
            {
                var qd = ConvertToDict(quote);
                var input = new VendorQuoteInput
                {
                    VendorId = qd.GetValueOrDefault("id")?.ToString() ?? qd.GetValueOrDefault("supplierId")?.ToString() ?? qd.GetValueOrDefault("vendorId")?.ToString() ?? "",
                    VendorName = qd.GetValueOrDefault("supplierName")?.ToString() ?? qd.GetValueOrDefault("vendorName")?.ToString() ?? "",
                    IsCompliant = true,
                    TaxCompliant = true
                };

                if (qd.TryGetValue("bbbeeLevel", out var bl) && bl != null)
                    try { input.BbbeeLevel = Convert.ToInt32(bl); } catch { }

                if (qd.TryGetValue("isCompliant", out var ic))
                {
                    if (ic is bool icBool) input.IsCompliant = icBool;
                    else input.IsCompliant = ic?.ToString() != "False" && ic?.ToString() != "false";
                }
                if (qd.TryGetValue("complianceStatus", out var cs))
                    input.IsCompliant = cs?.ToString() != "non_compliant";

                if (qd.TryGetValue("quotedAmount", out var qa) && qa != null)
                    try { input.QuotedAmount = Convert.ToDecimal(qa); } catch { }

                if (input.QuotedAmount == 0 && qd.TryGetValue("totalAmount", out var ta))
                {
                    if (ta is Dictionary<string, object?> taDict && taDict.TryGetValue("amount", out var taAmt))
                        try { input.QuotedAmount = Convert.ToDecimal(taAmt); } catch { }
                    else
                    {
                        var taAmtProp = ta?.GetType().GetProperty("amount");
                        if (taAmtProp != null) try { input.QuotedAmount = Convert.ToDecimal(taAmtProp.GetValue(ta)); } catch { }
                    }
                }

                if (qd.TryGetValue("deliveryDays", out var dd) && dd != null)
                    try { input.DeliveryDays = Convert.ToInt32(dd); } catch { }

                if (qd.TryGetValue("noResponse", out var nr))
                {
                    bool isNoResponse = (nr is bool nrBool && nrBool) || nr?.ToString() == "True" || nr?.ToString() == "true";
                    if (isNoResponse) continue;
                }

                vendorQuotes.Add(input);
            }
        }

        return (contractValue, vendorQuotes);
    }

    private static Dictionary<string, object?> NormalizeToDict(object item) => ConvertToDict(item);

    private static Dictionary<string, object?> ConvertToDict(object dto)
    {
        if (dto is Dictionary<string, object?> dict) return dict;
        if (dto is System.Text.Json.JsonElement je && je.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            var result = new Dictionary<string, object?>();
            foreach (var prop in je.EnumerateObject())
                result[prop.Name] = ConvertJsonEl(prop.Value);
            return result;
        }
        try
        {
            var json = System.Text.Json.JsonSerializer.Serialize(dto);
            return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(json) ?? new();
        }
        catch { return new Dictionary<string, object?>(); }
    }

    private static object? ConvertJsonEl(System.Text.Json.JsonElement el)
    {
        return el.ValueKind switch
        {
            System.Text.Json.JsonValueKind.String => el.GetString(),
            System.Text.Json.JsonValueKind.Number => el.TryGetInt64(out var l) ? (object)l : el.GetDecimal(),
            System.Text.Json.JsonValueKind.True => true,
            System.Text.Json.JsonValueKind.False => false,
            System.Text.Json.JsonValueKind.Null => null,
            System.Text.Json.JsonValueKind.Array => el.EnumerateArray().Select(ConvertJsonEl).ToArray(),
            System.Text.Json.JsonValueKind.Object => el.EnumerateObject().ToDictionary(p => p.Name, p => ConvertJsonEl(p.Value)),
            _ => el.ToString()
        };
    }
}
