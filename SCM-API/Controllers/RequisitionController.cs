using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/requisitions")]
public class RequisitionController : ControllerBase
{
    private readonly IRequisitionService _service;
    private readonly IQuotationService _quotationService;
    private readonly IScmConfigService _scmConfigService;

    public RequisitionController(IRequisitionService service, IQuotationService quotationService, IScmConfigService scmConfigService)
    {
        _service = service;
        _quotationService = quotationService;
        _scmConfigService = scmConfigService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedApiResponse<object>>> GetAll(
        [FromQuery] string? financialYear, [FromQuery] int? statusId, [FromQuery] int? departmentId,
        [FromQuery] string? search, [FromQuery] string? sortBy, [FromQuery] string? sortDir,
        [FromQuery] string? status, [FromQuery] string? department,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllAsync(financialYear, statusId, departmentId, search, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("summary")]
    public async Task<ActionResult> GetSummary()
    {
        var result = await _service.GetAllAsync(null, null, null, null, 1, 1000);
        var all = result.Items.ToList();
        var total = all.Count;
        var approved = all.Count(r => r is Dictionary<string, object?> d && d.TryGetValue("status", out var s) && s?.ToString() == "final_approved");
        var submitted = all.Count(r => r is Dictionary<string, object?> d && d.TryGetValue("status", out var s) && (s?.ToString() == "submitted" || s?.ToString() == "supervisor_review" || s?.ToString() == "hod_review"));
        var draft = all.Count(r => r is Dictionary<string, object?> d && d.TryGetValue("status", out var s) && (s?.ToString() == "draft" || s?.ToString() == "saved"));

        return Ok(ApiResponse<object>.Ok(new
        {
            totalRequisitions = total,
            pending = submitted,
            approved,
            rejected = 0,
            draft,
            totalValue = 24500000m,
            avgProcessingDays = 5,
            withinSla = approved,
            exceedingSla = 0,
            pipeline = new
            {
                stages = new object[]
                {
                    new { key = "draft", label = "Draft", count = draft, value = 3200000m },
                    new { key = "submitted", label = "Submitted", count = submitted, value = 12800000m },
                    new { key = "approved", label = "Approved", count = approved, value = 8500000m },
                    new { key = "routed", label = "Routed", count = 0, value = 0m }
                }
            },
            slaPerformance = new
            {
                stages = new object[]
                {
                    new { label = "Supervisor Review", actualAvgDays = 2, targetDays = 3 },
                    new { label = "HOD Review", actualAvgDays = 3, targetDays = 5 },
                    new { label = "SCM Routing", actualAvgDays = 1, targetDays = 2 }
                }
            }
        }));
    }

    [HttpGet("pipeline")]
    public async Task<ActionResult> GetPipeline()
    {
        var result = await _service.GetAllAsync(null, null, null, null, 1, 1000);
        var all = result.Items.ToList();

        int CountByStatus(params string[] statuses) =>
            all.Count(r => r is Dictionary<string, object?> d && d.TryGetValue("status", out var s) && statuses.Contains(s?.ToString()));
        decimal ValueByStatus(params string[] statuses) =>
            all.Where(r => r is Dictionary<string, object?> d && d.TryGetValue("status", out var s) && statuses.Contains(s?.ToString()))
               .Sum(r => r is Dictionary<string, object?> d && d.TryGetValue("totalEstimatedValue", out var v)
                   ? (v?.GetType()?.GetProperty("amount")?.GetValue(v) is decimal amt ? amt : 0m) : 0m);

        return Ok(ApiResponse<object>.Ok(new
        {
            pipeline = new Dictionary<string, object>
            {
                ["draft"] = new { count = CountByStatus("draft"), value = ValueByStatus("draft") },
                ["saved"] = new { count = CountByStatus("saved"), value = ValueByStatus("saved") },
                ["submitted"] = new { count = CountByStatus("submitted"), value = ValueByStatus("submitted") },
                ["supervisor_review"] = new { count = CountByStatus("supervisor_review"), value = ValueByStatus("supervisor_review") },
                ["hod_review"] = new { count = CountByStatus("hod_review"), value = ValueByStatus("hod_review") },
                ["final_approved"] = new { count = CountByStatus("final_approved"), value = ValueByStatus("final_approved") },
                ["routed"] = new { count = CountByStatus("routed"), value = ValueByStatus("routed") },
                ["completed"] = new { count = CountByStatus("completed"), value = ValueByStatus("completed") },
                ["supervisor_rejected"] = new { count = CountByStatus("supervisor_rejected"), value = ValueByStatus("supervisor_rejected") },
                ["hod_rejected"] = new { count = CountByStatus("hod_rejected"), value = ValueByStatus("hod_rejected") },
                ["voided"] = new { count = CountByStatus("voided"), value = ValueByStatus("voided") }
            }
        }));
    }

    [HttpGet("my-approvals")]
    public ActionResult GetMyApprovals()
        => Ok(Array.Empty<object>());

    [HttpGet("process-boundaries")]
    public async Task<ActionResult> GetProcessBoundaries()
    {
        var boundaries = await _scmConfigService.GetProcessBoundariesAsync();
        return Ok(ApiResponse<object>.Ok(new { boundaries }));
    }

    [HttpGet("sla-targets")]
    public ActionResult GetSlaTargets()
        => Ok(ApiResponse<object>.Ok(new
        {
            stages = new object[]
            {
                new { label = "Supervisor Review", targetDays = 3 },
                new { label = "HOD Review", targetDays = 5 },
                new { label = "SCM Routing", targetDays = 2 }
            }
        }));

    [HttpGet("pipeline-by-department")]
    public ActionResult GetPipelineByDepartment()
        => Ok(ApiResponse<object>.Ok(new { departments = Array.Empty<object>() }));

    [HttpGet("project-history/{projectId}")]
    public ActionResult GetProjectHistory(string projectId)
        => Ok(ApiResponse<object>.Ok(Array.Empty<object>()));

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Requisition not found"));
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] object dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = 0 }, ApiResponse<object>.Ok(result, "Requisition created"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse>> Update(int id, [FromBody] object dto)
    {
        var success = await _service.UpdateAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Requisition not found"));
        var updated = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { requisition = updated }, "Requisition updated"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Requisition not found"));
        return Ok(ApiResponse.Ok("Requisition deleted"));
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApiResponse>> Approve(int id, [FromBody] object dto)
    {
        var success = await _service.ApproveAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Requisition not found"));

        var req = await _service.GetByIdAsync(id);
        string message = "Requisition approved";

        if (req is Dictionary<string, object?> reqData)
        {
            await DetermineProcurementRoute(reqData, id);

            var reqNumber = reqData.TryGetValue("requisitionNumber", out var rn) ? rn?.ToString() ?? "" : "";
            var existingRfqs = _quotationService.GetByRequisitionRef(reqNumber);
            if (existingRfqs.Count > 0)
            {
                message = $"Requisition approved. RFQ already exists for {reqNumber}";
            }
            else
            {
                var rfqId = await CreateRfqFromRequisitionWithRouting(_quotationService, reqData);
                message = $"Requisition approved. RFQ created (ID: {rfqId})";
            }
        }

        return Ok(ApiResponse<object>.Ok(new { requisition = req }, message));
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult<ApiResponse>> Submit(int id)
    {
        var success = await _service.SubmitAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Requisition not found"));
        var req = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { requisition = req }, "Requisition submitted"));
    }

    [HttpPost("{id}/route")]
    public async Task<ActionResult<ApiResponse>> Route(int id, [FromBody] object dto)
    {
        var success = await _service.RouteAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Requisition not found"));

        var req = await _service.GetByIdAsync(id);
        string message = "Requisition routed";
        object? linkedQuotation = null;

        if (req is Dictionary<string, object?> reqData)
        {
            await DetermineProcurementRoute(reqData, id);

            var reqNumber = reqData.TryGetValue("requisitionNumber", out var rn) ? rn?.ToString() ?? "" : "";
            var existingRfqs = _quotationService.GetByRequisitionRef(reqNumber);
            if (existingRfqs.Count == 0)
            {
                var rfqId = await CreateRfqFromRequisitionWithRouting(_quotationService, reqData);
                linkedQuotation = rfqId;
                message = $"Requisition routed. RFQ created (ID: {rfqId})";
            }
        }

        return Ok(ApiResponse<object>.Ok(new { requisition = req, linkedQuotation }, message));
    }

    [HttpPost("{id}/return")]
    public async Task<ActionResult<ApiResponse>> Return(int id, [FromBody] object dto)
    {
        var success = await _service.ReturnAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Requisition not found"));
        var req = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { requisition = req }, "Requisition returned"));
    }

    [HttpPost("{id}/supervisor-approve")]
    public async Task<ActionResult> SupervisorApprove(int id, [FromBody] object dto)
    {
        var req = await _service.GetByIdAsync(id);
        if (req == null) return NotFound(ApiResponse.Fail("Requisition not found"));
        if (req is Dictionary<string, object?> reqData)
        {
            reqData["status"] = "hod_review";
            reqData["statusId"] = 5;
            var trail = reqData.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
            trail.Add(new { action = "Supervisor Approved", by = "Supervisor", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Approved by supervisor, forwarded to HOD for review" });
            reqData["auditTrail"] = trail.ToArray();
            await _service.UpdateAsync(id, reqData);
        }
        return Ok(ApiResponse<object>.Ok(new { requisition = req }, "Supervisor approved — forwarded to HOD for review"));
    }

    [HttpPost("{id}/supervisor-reject")]
    public async Task<ActionResult> SupervisorReject(int id, [FromBody] object dto)
    {
        var req = await _service.GetByIdAsync(id);
        if (req == null) return NotFound(ApiResponse.Fail("Requisition not found"));
        if (req is Dictionary<string, object?> reqData)
        {
            reqData["status"] = "supervisor_rejected";
            reqData["statusId"] = 10;
            await _service.UpdateAsync(id, reqData);
        }
        return Ok(ApiResponse<object>.Ok(new { requisition = req }, "Supervisor rejected"));
    }

    [HttpPost("{id}/supervisor-return")]
    public async Task<ActionResult> SupervisorReturn(int id, [FromBody] object dto)
    {
        var req = await _service.GetByIdAsync(id);
        if (req == null) return NotFound(ApiResponse.Fail("Requisition not found"));
        if (req is Dictionary<string, object?> reqData)
        {
            reqData["status"] = "returned";
            reqData["statusId"] = 9;
            await _service.UpdateAsync(id, reqData);
        }
        return Ok(ApiResponse<object>.Ok(new { requisition = req }, "Returned by supervisor"));
    }

    [HttpPost("{id}/hod-approve")]
    public async Task<ActionResult> HodApprove(int id, [FromBody] object dto)
    {
        var success = await _service.ApproveAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Requisition not found"));
        var req = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { requisition = req }, "HOD approved"));
    }

    [HttpPost("{id}/hod-reject")]
    public async Task<ActionResult> HodReject(int id, [FromBody] object dto)
    {
        var req = await _service.GetByIdAsync(id);
        if (req == null) return NotFound(ApiResponse.Fail("Requisition not found"));
        if (req is Dictionary<string, object?> reqData)
        {
            reqData["status"] = "hod_rejected";
            reqData["statusId"] = 10;
            await _service.UpdateAsync(id, reqData);
        }
        return Ok(ApiResponse<object>.Ok(new { requisition = req }, "HOD rejected"));
    }

    [HttpPost("{id}/hod-return")]
    public async Task<ActionResult> HodReturn(int id, [FromBody] object dto)
    {
        var req = await _service.GetByIdAsync(id);
        if (req == null) return NotFound(ApiResponse.Fail("Requisition not found"));
        if (req is Dictionary<string, object?> reqData)
        {
            reqData["status"] = "returned";
            reqData["statusId"] = 9;
            await _service.UpdateAsync(id, reqData);
        }
        return Ok(ApiResponse<object>.Ok(new { requisition = req }, "Returned by HOD"));
    }

    [HttpGet("{id}/approval-history")]
    public async Task<ActionResult> GetApprovalHistory(int id)
    {
        var history = await _service.GetApprovalHistoryAsync(id);
        return Ok(ApiResponse<object>.Ok(history));
    }

    [HttpGet("{id}/documents")]
    public async Task<ActionResult> GetDocuments(int id)
    {
        var docs = await _service.GetDocumentsAsync(id);
        return Ok(ApiResponse<object>.Ok(docs));
    }

    [HttpGet("{id}/service-details")]
    public async Task<ActionResult> GetServiceDetails(int id)
    {
        var details = await _service.GetServiceDetailsAsync(id);
        return Ok(ApiResponse<object>.Ok(details));
    }

    private static string GetStringField(Dictionary<string, object?> data, string key, string fallback = "")
    {
        if (!data.TryGetValue(key, out var val) || val == null) return fallback;
        if (val is string s) return s;
        if (val is Dictionary<string, object?> dict && dict.TryGetValue("name", out var name))
            return name?.ToString() ?? fallback;
        return val.ToString() ?? fallback;
    }

    private static decimal GetDecimalAmount(object? val)
    {
        if (val == null) return 0;
        if (val is decimal dec) return dec;
        if (val is long l) return l;
        if (val is int i) return i;
        if (val is double dbl) return (decimal)dbl;
        var valType = val.GetType();
        var amountProp = valType.GetProperty("amount");
        if (amountProp != null)
        {
            try { return Convert.ToDecimal(amountProp.GetValue(val)); } catch { }
        }
        if (val is Dictionary<string, object?> dict && dict.TryGetValue("amount", out var amt))
        {
            try { return Convert.ToDecimal(amt); } catch { }
        }
        try { return Convert.ToDecimal(val); } catch { return 0; }
    }

    private async Task DetermineProcurementRoute(Dictionary<string, object?> reqData, int reqId)
    {
        decimal estimatedValue = ExtractEstimatedValue(reqData);
        if (estimatedValue <= 0) return;

        var routeResult = await _scmConfigService.GetProcurementRouteAsync(estimatedValue);
        if (routeResult is Dictionary<string, object?> routeDict)
        {
            var method = routeDict.TryGetValue("method", out var m) ? m?.ToString() : null;
            var label = routeDict.TryGetValue("label", out var l) ? l?.ToString() : null;
            if (!string.IsNullOrEmpty(method))
            {
                reqData["procurementRoute"] = method;
                reqData["procurementRouteReason"] = $"Auto-determined: value R{estimatedValue:N2} falls within {label} threshold";
                await _service.UpdateAsync(reqId, reqData);
            }
        }
    }

    private async Task<int> CreateRfqFromRequisitionWithRouting(IQuotationService quotService, Dictionary<string, object?> reqData)
    {
        var reqNumber = GetStringField(reqData, "requisitionNumber");
        if (string.IsNullOrEmpty(reqNumber)) reqNumber = GetStringField(reqData, "referenceNumber");
        var dpRef = GetStringField(reqData, "demandPlanRef");
        var title = GetStringField(reqData, "title");
        var desc = GetStringField(reqData, "serviceDescription");
        if (string.IsNullOrEmpty(desc)) desc = GetStringField(reqData, "description");
        if (string.IsNullOrEmpty(title)) title = $"RFQ for {desc}";
        var dept = GetStringField(reqData, "department");
        var fy = GetStringField(reqData, "financialYear", "2025/26");
        var vote = GetStringField(reqData, "voteNumber");
        var contact = GetStringField(reqData, "requestedBy", "System");
        var route = GetStringField(reqData, "procurementRoute", "goods");
        var category = GetStringField(reqData, "category");

        decimal estimatedValue = ExtractEstimatedValue(reqData);
        var lineItems = reqData.TryGetValue("lineItems", out var li) && li is object[] items ? items : null;

        string? scoring = null;
        int? minQuotes = null;
        int? advertDays = null;

        if (estimatedValue > 0)
        {
            var routeResult = await _scmConfigService.GetProcurementRouteAsync(estimatedValue);
            if (routeResult is Dictionary<string, object?> routeDict)
            {
                scoring = routeDict.TryGetValue("scoring", out var s) ? s?.ToString() : null;
                minQuotes = routeDict.TryGetValue("minQuotes", out var mq) && mq is int mqInt ? mqInt : null;
                advertDays = routeDict.TryGetValue("advertDays", out var ad) && ad is int adInt ? adInt : null;
            }
        }

        return quotService.CreateFromRequisition(
            reqNumber, dpRef, title, desc, dept,
            estimatedValue, fy, vote, route, contact, lineItems, category,
            scoring, minQuotes, advertDays);
    }

    private static decimal ExtractEstimatedValue(Dictionary<string, object?> reqData)
    {
        decimal estimatedValue = 0;
        if (reqData.TryGetValue("totalEstimatedValue", out var tev) && tev != null)
        {
            estimatedValue = GetDecimalAmount(tev);
        }
        if (estimatedValue == 0 && reqData.TryGetValue("lineItems", out var liVal) && liVal is object[] lineArr)
        {
            foreach (var item in lineArr)
            {
                if (item is Dictionary<string, object?> liDict)
                {
                    if (liDict.TryGetValue("estimatedTotal", out var et))
                        estimatedValue += GetDecimalAmount(et);
                    else if (liDict.TryGetValue("totalCost", out var tc))
                        estimatedValue += GetDecimalAmount(tc);
                }
                else
                {
                    var tcProp = item?.GetType().GetProperty("totalCost");
                    if (tcProp != null) estimatedValue += GetDecimalAmount(tcProp.GetValue(item));
                    var etProp = item?.GetType().GetProperty("estimatedTotal");
                    if (etProp != null) estimatedValue += GetDecimalAmount(etProp.GetValue(item));
                }
            }
        }
        return estimatedValue;
    }
}
