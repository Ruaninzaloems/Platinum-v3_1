using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/tenders")]
public class TenderController : ControllerBase
{
    private readonly ITenderService _service;

    public TenderController(ITenderService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] string? financialYear, [FromQuery] int? statusId,
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllAsync(financialYear, statusId, search, page, pageSize);
        return Ok(new
        {
            isSuccess = true,
            data = result.Items,
            page = result.Page,
            pageSize = result.PageSize,
            total = result.TotalCount,
            totalCount = result.TotalCount,
            totalPages = result.TotalPages
        });
    }

    [HttpGet("pipeline")]
    public async Task<ActionResult> GetPipeline()
    {
        var pipeline = await _service.GetPipelineAsync();
        return Ok(pipeline);
    }

    [HttpGet("dashboard/summary")]
    public async Task<ActionResult> GetDashboardSummary()
    {
        var summary = await _service.GetDashboardSummaryAsync();
        return Ok(ApiResponse<object>.Ok(summary));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Tender not found"));
        return Ok(result);
    }

    [HttpGet("{id:int}/sla-performance")]
    public ActionResult GetSlaPerformance(int id)
    {
        return Ok(new
        {
            tenderId = id,
            overallScore = 78,
            phases = new object[]
            {
                new { phase = "BSC Review", targetDays = 14, actualDays = 12, status = "on_track" },
                new { phase = "Advertisement", targetDays = 21, actualDays = 21, status = "on_track" },
                new { phase = "BEC Evaluation", targetDays = 14, actualDays = 0, status = "pending" },
                new { phase = "BAC Adjudication", targetDays = 7, actualDays = 0, status = "pending" }
            }
        });
    }

    [HttpGet("{id:int}/boq")]
    public ActionResult GetBoq(int id)
        => Ok(new { boqItems = Array.Empty<object>() });

    [HttpGet("{id:int}/boq/comparison")]
    public ActionResult GetBoqComparison(int id)
        => Ok(new { comparison = Array.Empty<object>() });

    [HttpGet("{id:int}/subcontracting")]
    public ActionResult GetSubcontracting(int id)
        => Ok(new { subcontractingPlan = (object?)null, items = Array.Empty<object>() });

    [HttpGet("{id:int}/documents")]
    public async Task<ActionResult> GetDocuments(int id)
    {
        var tender = await _service.GetByIdAsync(id);
        if (tender == null) return NotFound(ApiResponse.Fail("Tender not found"));
        var docs = Array.Empty<object>();
        if (tender is Dictionary<string, object?> dict && dict.TryGetValue("documents", out var d) && d != null)
            return Ok(new { documents = d });
        return Ok(new { documents = docs });
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] object dto)
    {
        var result = await _service.CreateAsync(dto);
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, [FromBody] object dto)
    {
        var success = await _service.UpdateAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var updated = await _service.GetByIdAsync(id);
        return Ok(updated ?? new { id, message = "Tender updated" });
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        return Ok(ApiResponse.Ok("Tender deleted"));
    }

    [HttpPost("{id:int}/submit-specifications")]
    public async Task<ActionResult> SubmitSpecifications(int id)
    {
        var success = await _service.TransitionStatusAsync(id, "specifications");
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "Submitted to BSC" });
    }

    [HttpPost("{id:int}/publish")]
    public async Task<ActionResult> Publish(int id)
    {
        var success = await _service.PublishAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "Tender published" });
    }

    [HttpPost("{id:int}/close")]
    public async Task<ActionResult> Close(int id)
    {
        var success = await _service.CloseAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "Tender closed" });
    }

    [HttpPost("{id:int}/bec/start")]
    public async Task<ActionResult> BecStart(int id)
    {
        var success = await _service.TransitionStatusAsync(id, "evaluation");
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "BEC evaluation started" });
    }

    [HttpPost("{id:int}/bec/complete")]
    public async Task<ActionResult> BecComplete(int id, [FromBody] object dto)
    {
        var success = await _service.TransitionStatusAsync(id, "evaluation");
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "BEC evaluation completed" });
    }

    [HttpPost("{id:int}/bac/start")]
    public async Task<ActionResult> BacStart(int id)
    {
        var success = await _service.TransitionStatusAsync(id, "adjudication");
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "BAC adjudication started" });
    }

    [HttpPost("{id:int}/bac/decide")]
    public async Task<ActionResult> BacDecide(int id, [FromBody] JsonElement dto)
    {
        var decision = "award";
        if (dto.TryGetProperty("decision", out var decEl) && decEl.ValueKind == JsonValueKind.String)
            decision = decEl.GetString() ?? "award";

        string newStatus = decision switch
        {
            "award" => "awarded",
            "cancel" => "cancelled",
            "refer_back" => "evaluation",
            _ => "adjudication"
        };

        var success = await _service.TransitionStatusAsync(id, newStatus);
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = $"BAC decision: {decision}" });
    }

    [HttpPost("{id:int}/ao-approve")]
    public async Task<ActionResult> AoApprove(int id, [FromBody] JsonElement dto)
    {
        var approved = true;
        if (dto.TryGetProperty("approved", out var apEl))
            approved = apEl.ValueKind == JsonValueKind.True;

        var newStatus = approved ? "contract_active" : "adjudication";
        var success = await _service.TransitionStatusAsync(id, newStatus);
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = approved ? "AO approved" : "AO rejected" });
    }

    [HttpPost("{id:int}/void-request")]
    public async Task<ActionResult> VoidRequest(int id, [FromBody] object dto)
    {
        var success = await _service.TransitionStatusAsync(id, "void_requested");
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "Void request submitted" });
    }

    [HttpPost("{id:int}/void-approve")]
    public async Task<ActionResult> VoidApprove(int id)
    {
        var success = await _service.TransitionStatusAsync(id, "cancelled");
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "Void approved" });
    }

    [HttpPost("{id:int}/void-reject")]
    public async Task<ActionResult> VoidReject(int id, [FromBody] object dto)
    {
        var tender = await _service.GetByIdAsync(id);
        if (tender == null) return NotFound(ApiResponse.Fail("Tender not found"));
        return Ok(new { tender, message = "Void rejected" });
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult> Cancel(int id, [FromBody] object dto)
    {
        var success = await _service.TransitionStatusAsync(id, "cancelled");
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "Tender cancelled" });
    }

    [HttpPost("{id:int}/bsc/approve")]
    public async Task<ActionResult> BscApprove(int id, [FromBody] object dto)
    {
        var tender = await _service.GetByIdAsync(id);
        if (tender == null) return NotFound(ApiResponse.Fail("Tender not found"));
        if (tender is Dictionary<string, object?> dict)
        {
            if (dict.TryGetValue("committees", out var c) && c is Dictionary<string, object?> committees)
                committees["bsc"] = new { status = "approved" };
        }
        return Ok(new { tender, message = "BSC approved" });
    }

    [HttpPost("{id:int}/bsc/revise")]
    public async Task<ActionResult> BscRevise(int id, [FromBody] object dto)
    {
        var success = await _service.TransitionStatusAsync(id, "draft");
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "Returned for revision" });
    }

    [HttpPost("{id:int}/bsc/level2-approve")]
    public async Task<ActionResult> BscLevel2Approve(int id, [FromBody] object dto)
    {
        var tender = await _service.GetByIdAsync(id);
        if (tender == null) return NotFound(ApiResponse.Fail("Tender not found"));
        return Ok(new { tender, message = "BSC Level 2 approved" });
    }

    [HttpPost("{id:int}/bsc/level2-revise")]
    public async Task<ActionResult> BscLevel2Revise(int id, [FromBody] object dto)
    {
        var tender = await _service.GetByIdAsync(id);
        if (tender == null) return NotFound(ApiResponse.Fail("Tender not found"));
        return Ok(new { tender, message = "BSC Level 2 revision requested" });
    }

    [HttpPost("{id:int}/opening-approve")]
    public async Task<ActionResult> OpeningApprove(int id, [FromBody] object dto)
    {
        var tender = await _service.GetByIdAsync(id);
        if (tender == null) return NotFound(ApiResponse.Fail("Tender not found"));
        if (tender is Dictionary<string, object?> dict)
            dict["openingApproval"] = new { status = "approved", date = DateTime.UtcNow.ToString("yyyy-MM-dd") };
        return Ok(new { tender, message = "Opening approved" });
    }

    [HttpPost("{id:int}/opening-reject")]
    public async Task<ActionResult> OpeningReject(int id, [FromBody] object dto)
    {
        var tender = await _service.GetByIdAsync(id);
        if (tender == null) return NotFound(ApiResponse.Fail("Tender not found"));
        return Ok(new { tender, message = "Opening rejected" });
    }

    [HttpPost("{id:int}/boq")]
    public ActionResult SaveBoq(int id, [FromBody] JsonElement dto)
    {
        var items = new List<object>();
        if (dto.TryGetProperty("items", out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in arr.EnumerateArray())
            {
                items.Add(new
                {
                    id = $"BOQ-{id}-{items.Count + 1}",
                    description = item.TryGetProperty("description", out var d) ? d.GetString() : "",
                    section = item.TryGetProperty("section", out var s) ? s.GetString() : "General",
                    unit = item.TryGetProperty("unit", out var u) ? u.GetString() : "each",
                    quantity = item.TryGetProperty("quantity", out var q) && q.ValueKind == JsonValueKind.Number ? q.GetDecimal() : 0,
                    estimatedRate = item.TryGetProperty("estimatedRate", out var r) && r.ValueKind == JsonValueKind.Number ? r.GetDecimal() : 0,
                    estimatedTotal = (item.TryGetProperty("quantity", out var q2) && q2.ValueKind == JsonValueKind.Number ? q2.GetDecimal() : 0) *
                                     (item.TryGetProperty("estimatedRate", out var r2) && r2.ValueKind == JsonValueKind.Number ? r2.GetDecimal() : 0)
                });
            }
        }
        return Ok(new { added = items, message = "BOQ items saved" });
    }

    [HttpPost("{id:int}/boq/bidder-pricing")]
    public ActionResult SaveBidderPricing(int id, [FromBody] object dto)
        => Ok(new { message = "Bidder pricing saved" });

    [HttpPost("{id:int}/subcontracting")]
    public ActionResult SaveSubcontracting(int id, [FromBody] object dto)
        => Ok(new { message = "Subcontracting plan saved" });

    [HttpPost("{id:int}/documents")]
    public ActionResult SaveDocument(int id, [FromBody] object dto)
        => Ok(new { message = "Document saved" });

    [HttpPost("{id:int}/briefing-session")]
    public async Task<ActionResult> SaveBriefingSession(int id, [FromBody] object dto)
    {
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "Briefing session saved" });
    }

    [HttpPut("{id:int}/briefing-session/attendance")]
    public ActionResult SaveBriefingAttendance(int id, [FromBody] object dto)
        => Ok(new { message = "Attendance recorded" });

    [HttpPost("{id:int}/re-invite")]
    public async Task<ActionResult> ReInvite(int id, [FromBody] object dto)
    {
        var success = await _service.TransitionStatusAsync(id, "published");
        if (!success) return NotFound(ApiResponse.Fail("Tender not found"));
        var tender = await _service.GetByIdAsync(id);
        return Ok(new { tender, message = "Tender re-invited" });
    }

    [HttpPost("{id:int}/assign-buyer")]
    public async Task<ActionResult> AssignBuyer(int id, [FromBody] JsonElement dto)
    {
        var buyerName = "";
        if (dto.TryGetProperty("buyerName", out var bn) && bn.ValueKind == JsonValueKind.String)
            buyerName = bn.GetString() ?? "";

        var tender = await _service.GetByIdAsync(id);
        if (tender == null) return NotFound(ApiResponse.Fail("Tender not found"));
        if (tender is Dictionary<string, object?> dict)
            dict["assignedBuyer"] = buyerName;
        return Ok(new { tender, message = $"Buyer {buyerName} assigned" });
    }

    [HttpPost("{id:int}/bidders")]
    public async Task<ActionResult> RegisterBidder(int id, [FromBody] JsonElement dto)
    {
        var tender = await _service.GetByIdAsync(id);
        if (tender == null) return NotFound(ApiResponse.Fail("Tender not found"));
        if (tender is Dictionary<string, object?> dict)
        {
            var bidders = dict.TryGetValue("bidders", out var b) && b is List<object> list ? list : new List<object>();
            var newBidder = new Dictionary<string, object?>
            {
                ["id"] = $"BID-{id}-{bidders.Count + 1}",
                ["supplierName"] = dto.TryGetProperty("supplierName", out var sn) ? sn.GetString() : "",
                ["bidAmount"] = dto.TryGetProperty("bidAmount", out var ba) ? (object)ba.Clone() : new { amount = 0, currency = "ZAR" },
                ["bbbeeLevel"] = dto.TryGetProperty("bbbeeLevel", out var bl) && bl.ValueKind == JsonValueKind.Number ? bl.GetInt32() : 1,
                ["contactEmail"] = dto.TryGetProperty("contactEmail", out var ce) ? ce.GetString() : "",
                ["contactPerson"] = dto.TryGetProperty("contactPerson", out var cp) ? cp.GetString() : "",
                ["registrationNumber"] = dto.TryGetProperty("registrationNumber", out var rn) ? rn.GetString() : "",
                ["briefingAttended"] = dto.TryGetProperty("briefingAttended", out var batt) && batt.ValueKind == JsonValueKind.True,
                ["responsive"] = true,
                ["complianceChecked"] = false,
                ["status"] = "registered"
            };
            bidders.Add(newBidder);
            dict["bidders"] = bidders;
        }
        return Ok(new { tender, message = "Bidder registered" });
    }

    [HttpPost("{id:int}/generate-order")]
    public ActionResult GenerateOrder(int id)
        => Ok(new { order = new { id = 0, referenceNumber = $"PO-{DateTime.UtcNow:yyyy}-{id}" }, message = "Purchase order generated" });

    [HttpDelete("{id:int}/boq/{boqId}")]
    public ActionResult DeleteBoqItem(int id, string boqId)
        => Ok(new { message = "BOQ item removed" });

    [HttpDelete("{id:int}/documents/{docId}")]
    public ActionResult DeleteDocument(int id, string docId)
        => Ok(new { message = "Document removed" });
}
