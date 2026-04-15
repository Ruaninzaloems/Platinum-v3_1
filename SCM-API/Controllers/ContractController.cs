using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/contracts")]
public class ContractController : ControllerBase
{
    private readonly IContractService _service;

    public ContractController(IContractService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult<PagedApiResponse<object>>> GetAll(
        [FromQuery] string? financialYear, [FromQuery] int? statusId,
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllAsync(financialYear, statusId, search, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("expiring")]
    public async Task<ActionResult> GetExpiring([FromQuery] int days = 90)
    {
        var result = await _service.GetExpiringAsync(days);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("value-alerts")]
    public async Task<ActionResult> GetValueAlerts()
    {
        return Ok(ApiResponse<object>.Ok(Array.Empty<object>()));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Contract not found"));
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{id}/dashboard")]
    public async Task<ActionResult> GetContractDashboard(int id)
    {
        var result = await _service.GetContractDashboardAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{id}/payment-certificates")]
    public ActionResult GetPaymentCertificates(int id)
        => Ok(ApiResponse<object>.Ok(Array.Empty<object>()));

    [HttpGet("{id}/approvals")]
    public async Task<ActionResult> GetApprovalChain(int id)
    {
        var result = await _service.GetApprovalChainAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{id}/variations")]
    public async Task<ActionResult> GetVariations(int id)
    {
        var result = await _service.GetVariationsAsync(id);
        return Ok(ApiResponse<object>.Ok(new { data = result }));
    }

    [HttpGet("{id}/performance")]
    public async Task<ActionResult> GetPerformance(int id)
    {
        var result = await _service.GetPerformanceAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{id}/service-requests")]
    public async Task<ActionResult> GetServiceRequests(int id)
    {
        var result = await _service.GetServiceRequestsAsync(id);
        return Ok(ApiResponse<object>.Ok(new { data = result }));
    }

    [HttpGet("{id}/value-exhaustion")]
    public async Task<ActionResult> GetValueExhaustion(int id)
    {
        var result = await _service.GetValueExhaustionAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{id}/retention")]
    public async Task<ActionResult> GetRetention(int id)
    {
        var result = await _service.GetRetentionAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{id}/guarantee")]
    public ActionResult GetGuarantee(int id)
        => Ok(ApiResponse<object>.Ok(new { contractId = id, guaranteePercentage = 0, guaranteeAmount = 0m, status = "none" }));

    [HttpGet("{id}/penalties")]
    public async Task<ActionResult> GetPenalties(int id)
    {
        var result = await _service.GetPenaltiesAsync(id);
        return Ok(ApiResponse<object>.Ok(new { data = result }));
    }

    [HttpGet("{id}/correspondence")]
    public ActionResult GetCorrespondence(int id)
        => Ok(ApiResponse<object>.Ok(new { correspondence = Array.Empty<object>() }));

    [HttpGet("{id}/orders")]
    public async Task<ActionResult> GetContractOrders(int id)
    {
        var result = await _service.GetContractOrdersAsync(id);
        return Ok(ApiResponse<object>.Ok(new { data = result }));
    }

    [HttpGet("{id}/detail-items")]
    public async Task<ActionResult> GetDetailItems(int id)
    {
        var result = await _service.GetDetailItemsAsync(id);
        return Ok(ApiResponse<object>.Ok(new { data = result }));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] object dto)
    {
        var result = await _service.CreateAsync(dto);
        var createdId = result is Dictionary<string, object?> dict && dict.TryGetValue("id", out var idVal) ? idVal : 0;
        return CreatedAtAction(nameof(GetById), new { id = createdId }, ApiResponse<object>.Ok(result, "Contract created"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] object dto)
    {
        var success = await _service.UpdateAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Contract not found"));
        return Ok(ApiResponse.Ok("Contract updated"));
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult> Submit(int id)
    {
        var success = await _service.SubmitAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Contract not found"));
        return Ok(ApiResponse.Ok("Contract submitted for approval"));
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult> Approve(int id, [FromBody] object dto)
    {
        var success = await _service.ApproveAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Contract not found"));
        return Ok(ApiResponse.Ok("Contract approved"));
    }

    [HttpPost("{id}/activate")]
    public async Task<ActionResult> Activate(int id)
    {
        var success = await _service.ActivateAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Contract not found"));
        var contract = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { contract }, "Contract activated"));
    }

    [HttpPost("{id}/terminate")]
    public async Task<ActionResult> Terminate(int id, [FromBody] JsonElement dto)
    {
        var reason = dto.TryGetProperty("reason", out var r) ? r.GetString() ?? "" : "";
        var success = await _service.TerminateAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Contract not found"));
        var contract = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(new { contract }, "Contract terminated"));
    }

    [HttpPost("{id}/signing-invitation")]
    public ActionResult SendSigningInvitation(int id)
        => Ok(ApiResponse.Ok("Signing invitation sent"));

    [HttpPost("{id}/approvals")]
    public async Task<ActionResult> SubmitApproval(int id, [FromBody] JsonElement dto)
    {
        var level = dto.TryGetProperty("level", out var l) ? l.GetInt32() : 1;
        var userId = dto.TryGetProperty("userId", out var u) ? u.GetInt32() : 1;
        var isApproved = !dto.TryGetProperty("isApproved", out var a) || a.GetBoolean();
        var comment = dto.TryGetProperty("comment", out var c) ? c.GetString() : null;

        var result = await _service.SubmitApprovalAsync(id, level, userId, isApproved, comment);
        if (result == null) return NotFound(ApiResponse.Fail("Contract not found"));
        return Ok(ApiResponse<object>.Ok(result, "Approval recorded"));
    }

    [HttpPost("{id}/variations")]
    public async Task<ActionResult> CreateVariation(int id, [FromBody] JsonElement dto)
    {
        var variationType = dto.TryGetProperty("variationType", out var vt) ? vt.GetString() ?? "scope" : "scope";
        var description = dto.TryGetProperty("description", out var d) ? d.GetString() ?? "" : "";
        decimal? variationValue = dto.TryGetProperty("variationValue", out var vv) ? vv.GetDecimal() : null;
        DateTime? newEndDate = dto.TryGetProperty("newEndDate", out var ned) && DateTime.TryParse(ned.GetString(), out var nedt) ? nedt : null;
        var reason = dto.TryGetProperty("reason", out var r) ? r.GetString() : null;

        var result = await _service.CreateVariationAsync(id, variationType, description, variationValue, newEndDate, reason);
        if (result == null) return NotFound(ApiResponse.Fail("Contract not found"));
        return Ok(ApiResponse<object>.Ok(result, "Variation order created — pending approval"));
    }

    [HttpPost("variations/{variationId}/approve")]
    public async Task<ActionResult> ApproveVariation(int variationId, [FromBody] JsonElement dto)
    {
        var userId = dto.TryGetProperty("userId", out var u) ? u.GetInt32() : 1;
        var success = await _service.ApproveVariationAsync(variationId, userId);
        if (!success) return NotFound(ApiResponse.Fail("Variation not found"));
        return Ok(ApiResponse.Ok("Variation approved — contract updated"));
    }

    [HttpPost("{id}/performance")]
    public async Task<ActionResult> RecordPerformance(int id, [FromBody] JsonElement dto)
    {
        var dims = dto.TryGetProperty("dimensions", out var d) ? d : dto;
        var quality = dims.TryGetProperty("quality", out var q) ? q.GetInt32() : 70;
        var delivery = dims.TryGetProperty("delivery", out var dl) ? dl.GetInt32() : 70;
        var cost = dims.TryGetProperty("cost", out var c) ? c.GetInt32() : 70;
        var service = dims.TryGetProperty("service", out var s) ? s.GetInt32() : 70;
        var comments = dto.TryGetProperty("comments", out var cm) ? cm.GetString() : null;
        var period = dto.TryGetProperty("period", out var p) ? p.GetString() : null;

        var result = await _service.RecordPerformanceAsync(id, quality, delivery, cost, service, comments, period);
        if (result == null) return NotFound(ApiResponse.Fail("Contract not found"));
        return Ok(ApiResponse<object>.Ok(result, "Performance assessment recorded"));
    }

    [HttpPost("{id}/service-requests")]
    public async Task<ActionResult> CreateServiceRequest(int id, [FromBody] JsonElement dto)
    {
        var description = dto.TryGetProperty("description", out var d) ? d.GetString() ?? "" : "";
        decimal? requestedValue = dto.TryGetProperty("requestedValue", out var rv) ? rv.GetDecimal() : null;
        DateTime? requiredDate = dto.TryGetProperty("requiredDate", out var rd) && DateTime.TryParse(rd.GetString(), out var rdt) ? rdt : null;
        int? vendorId = dto.TryGetProperty("vendorId", out var vi) ? vi.GetInt32() : null;

        var result = await _service.CreateServiceRequestAsync(id, description, requestedValue, requiredDate, vendorId);
        if (result == null) return NotFound(ApiResponse.Fail("Contract not found"));
        return Ok(ApiResponse<object>.Ok(result, "Service request created"));
    }

    [HttpPost("service-requests/{serviceRequestId}/approve")]
    public async Task<ActionResult> ApproveServiceRequest(int serviceRequestId, [FromBody] JsonElement dto)
    {
        var userId = dto.TryGetProperty("userId", out var u) ? u.GetInt32() : 1;
        decimal? approvedValue = dto.TryGetProperty("approvedValue", out var av) ? av.GetDecimal() : null;
        var success = await _service.ApproveServiceRequestAsync(serviceRequestId, userId, approvedValue);
        if (!success) return NotFound(ApiResponse.Fail("Service request not found"));
        return Ok(ApiResponse.Ok("Service request approved"));
    }

    [HttpPost("{id}/milestones/{milestoneId}/complete")]
    public async Task<ActionResult> CompleteMilestone(int id, int milestoneId)
    {
        var result = await _service.CompleteMilestoneAsync(id, milestoneId);
        if (result == null) return NotFound(ApiResponse.Fail("Milestone not found"));
        return Ok(ApiResponse<object>.Ok(result, "Milestone completed"));
    }

    [HttpPost("{id}/penalties")]
    public async Task<ActionResult> RecordPenalty(int id, [FromBody] JsonElement dto)
    {
        var type = dto.TryGetProperty("type", out var t) ? t.GetString() ?? "" : "";
        var amount = dto.TryGetProperty("amount", out var a) ? a.GetDecimal() : 0m;
        var reason = dto.TryGetProperty("reason", out var r) ? r.GetString() : null;

        var result = await _service.RecordPenaltyAsync(id, type, amount, reason);
        if (result == null) return NotFound(ApiResponse.Fail("Contract not found"));
        return Ok(ApiResponse<object>.Ok(result, "Penalty recorded"));
    }

    [HttpPost("{id}/retention/{retentionId}/release")]
    public async Task<ActionResult> ReleaseRetention(int id, int retentionId, [FromBody] JsonElement dto)
    {
        var userId = dto.TryGetProperty("userId", out var u) ? u.GetInt32() : 1;
        var success = await _service.ReleaseRetentionAsync(retentionId, userId);
        if (!success) return NotFound(ApiResponse.Fail("Retention record not found"));
        return Ok(ApiResponse.Ok("Retention released"));
    }
}
