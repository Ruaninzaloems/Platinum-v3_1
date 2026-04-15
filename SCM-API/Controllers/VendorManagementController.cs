using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/vendor-management")]
public class VendorManagementController : ControllerBase
{
    private readonly IVendorManagementService _service;

    public VendorManagementController(IVendorManagementService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult<PagedApiResponse<object>>> GetAll([FromQuery] string? status, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetRegistrationsAsync(status, search, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("config")]
    public ActionResult GetConfig()
        => Ok(ApiResponse<object>.Ok(new { registrationTypes = new[] { "Goods", "Services", "Works" }, bbbeeCategories = new[] { "Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7", "Level 8", "Non-compliant" }, requiredDocuments = new[] { "Tax Clearance", "CIPC Registration", "B-BBEE Certificate", "CSD Registration" } }));

    [HttpGet("registrations")]
    public async Task<ActionResult> GetRegistrations([FromQuery] string? status, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 200)
    {
        var result = await _service.GetRegistrationsAsync(status, search, page, pageSize);
        return Ok(new { data = result.Items, total = result.TotalCount, page = result.Page, pageSize = result.PageSize });
    }

    [HttpGet("documents/expiring")]
    public ActionResult GetExpiringDocuments([FromQuery] int days = 30)
        => Ok(Array.Empty<object>());

    [HttpPost("register/manual")]
    public async Task<ActionResult<ApiResponse<object>>> RegisterManual([FromBody] object dto)
    {
        var result = await _service.StartRegistrationAsync(dto);
        return Ok(ApiResponse<object>.Ok(result, "Manual registration created"));
    }

    [HttpPost("csd/import")]
    public async Task<ActionResult<ApiResponse<object>>> CsdImport([FromBody] object dto)
    {
        var result = await _service.StartRegistrationAsync(dto);
        return Ok(ApiResponse<object>.Ok(result, "CSD import successful"));
    }

    [HttpGet("csd/search")]
    public ActionResult CsdSearch([FromQuery] string? csdNumber, [FromQuery] string? companyName, [FromQuery] string? registrationNumber)
        => Ok(ApiResponse<object>.Ok(Array.Empty<object>()));

    [HttpGet("registrations/{id}")]
    public async Task<ActionResult> GetRegistrationById(string id)
    {
        var result = await _service.GetRegistrationByIdAsync(id);
        if (result == null) return NotFound(new { error = "Registration not found" });
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById(string id)
    {
        var result = await _service.GetRegistrationByIdAsync(id);
        if (result == null) return NotFound(ApiResponse.Fail("Registration not found"));
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Start([FromBody] object dto)
    {
        var result = await _service.StartRegistrationAsync(dto);
        return Ok(ApiResponse<object>.Ok(result, "Registration started"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(string id, [FromBody] object dto)
    {
        var success = await _service.UpdateRegistrationAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Registration not found"));
        return Ok(ApiResponse.Ok("Registration updated"));
    }

    [HttpPost("registrations/{id}/submit")]
    public async Task<ActionResult> SubmitRegistration(string id)
    {
        var success = await _service.SubmitRegistrationAsync(id);
        if (!success) return NotFound(new { error = "Registration not found" });
        var reg = await _service.GetRegistrationByIdAsync(id);
        return Ok(reg);
    }

    [HttpPost("registrations/{id}/approve")]
    public async Task<ActionResult> ApproveRegistration(string id, [FromBody] object dto)
    {
        var formData = dto is System.Text.Json.JsonElement je ? je : default;
        var action = "approve";
        if (formData.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            if (formData.TryGetProperty("action", out var actionProp))
                action = actionProp.GetString() ?? "approve";
        }

        bool success;
        if (action == "reject")
            success = await _service.RejectRegistrationAsync(id, dto);
        else if (action == "return")
        {
            success = await _service.UpdateRegistrationAsync(id, new Dictionary<string, object> { ["status"] = "returned" });
        }
        else
            success = await _service.ApproveRegistrationAsync(id, dto);

        if (!success) return NotFound(new { error = "Registration not found" });
        var reg = await _service.GetRegistrationByIdAsync(id);
        return Ok(reg);
    }

    [HttpPut("registrations/{id}/wizard")]
    public async Task<ActionResult> SaveWizardStep(string id, [FromBody] object dto)
    {
        var success = await _service.UpdateRegistrationAsync(id, dto);
        if (!success) return NotFound(new { error = "Registration not found" });
        var reg = await _service.GetRegistrationByIdAsync(id);
        return Ok(reg);
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult<ApiResponse<object>>> Submit(string id)
    {
        var success = await _service.SubmitRegistrationAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Registration not found"));
        return Ok(ApiResponse.Ok("Registration submitted"));
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> Approve(string id, [FromBody] object dto)
    {
        var success = await _service.ApproveRegistrationAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Registration not found"));
        return Ok(ApiResponse.Ok("Registration approved"));
    }

    [HttpPost("{id}/reject")]
    public async Task<ActionResult<ApiResponse<object>>> Reject(string id, [FromBody] object dto)
    {
        var success = await _service.RejectRegistrationAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Registration not found"));
        return Ok(ApiResponse.Ok("Registration rejected"));
    }

    [HttpGet("{id}/documents")]
    public async Task<ActionResult<ApiResponse<object>>> GetDocuments(string id)
    {
        var result = await _service.GetRegistrationDocumentsAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("{id}/documents")]
    public async Task<ActionResult<ApiResponse<object>>> UploadDocument(string id, [FromBody] object dto)
    {
        await _service.UploadRegistrationDocumentAsync(id, dto);
        return Ok(ApiResponse.Ok("Document uploaded"));
    }

    [HttpGet("{id}/directors")]
    public async Task<ActionResult<ApiResponse<object>>> GetDirectors(string id)
    {
        var result = await _service.GetRegistrationDirectorsAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("{id}/directors")]
    public async Task<ActionResult<ApiResponse<object>>> AddDirector(string id, [FromBody] object dto)
    {
        await _service.AddDirectorAsync(id, dto);
        return Ok(ApiResponse.Ok("Director added"));
    }

    [HttpDelete("{id}/directors/{directorId}")]
    public async Task<ActionResult<ApiResponse<object>>> RemoveDirector(string id, string directorId)
    {
        await _service.RemoveDirectorAsync(id, directorId);
        return Ok(ApiResponse.Ok("Director removed"));
    }

    [HttpGet("{id}/accreditations")]
    public async Task<ActionResult<ApiResponse<object>>> GetAccreditations(string id)
    {
        var result = await _service.GetRegistrationAccreditationsAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("csd-import/{registrationNumber}")]
    public async Task<ActionResult<ApiResponse<object>>> ImportFromCsd(string registrationNumber)
    {
        var result = await _service.ImportFromCsdAsync(registrationNumber);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{id}/status")]
    public async Task<ActionResult<ApiResponse<object>>> GetStatus(string id)
    {
        var result = await _service.GetRegistrationStatusAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }
}
