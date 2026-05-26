using Microsoft.AspNetCore.Mvc;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Controllers;

[ApiController]
[Route("api/overtime-transactions")]
public class OvertimeTransactionsController : ControllerBase
{
    private readonly IOvertimeTransactionsService _service;
    private readonly ICurrentUserService _currentUser;

    public OvertimeTransactionsController(
        IOvertimeTransactionsService service,
        ICurrentUserService currentUser)
    {
        _service     = service;
        _currentUser = currentUser;
    }

    [HttpGet("current")]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>>> ListCurrent(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
        => Ok(await _service.ListCurrentForUserAsync(page, pageSize, ct));

    [HttpGet("processed")]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>>> ListProcessed(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
        => Ok(await _service.ListProcessedAsync(page, pageSize, ct));

    [HttpGet("enquiry")]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>>> ListEnquiry(
        [FromQuery] int? status = null,
        [FromQuery] string? departmentId = null,
        [FromQuery] string? employeeSearch = null,
        [FromQuery] string? salaryHeadName = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        if (!_currentUser.Current.CanAccessCapture)
            return StatusCode(403, ApiResponse<PaginatedResponse<OvertimeTransactionDto>>.Failure(
                "You do not have permission to access Overtime Enquiry (permission 3201 required)."));
        return Ok(await _service.ListEnquiryAsync(status, departmentId, employeeSearch, salaryHeadName, fromDate, toDate, page, pageSize, ct));
    }

    [HttpGet("by-employee/{employeeId}")]
    public async Task<ActionResult<ApiResponse<List<OvertimeTransactionDto>>>> ListForEmployee(
        string employeeId, CancellationToken ct = default)
        => Ok(await _service.ListForEmployeeAsync(employeeId, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<OvertimeTransactionDto>>> Get(Guid id, CancellationToken ct = default)
    {
        var resp = await _service.GetAsync(id, ct);
        return resp.IsSuccess ? Ok(resp) : NotFound(resp);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<OvertimeTransactionDto>>> Create(
        [FromBody] CreateOvertimeTransactionRequest req, CancellationToken ct = default)
    {
        var resp = await _service.CreateAsync(req, ct);
        return resp.IsSuccess ? Ok(resp) : BadRequest(resp);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<OvertimeTransactionDto>>> Update(
        Guid id, [FromBody] UpdateOvertimeTransactionRequest req, CancellationToken ct = default)
    {
        var resp = await _service.UpdateAsync(id, req, ct);
        return resp.IsSuccess ? Ok(resp) : BadRequest(resp);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken ct = default)
    {
        var resp = await _service.DeleteAsync(id, ct);
        return resp.IsSuccess ? Ok(resp) : BadRequest(resp);
    }

    [HttpPost("preview-amount")]
    public async Task<ActionResult<ApiResponse<AmountPreviewDto>>> PreviewAmount(
        [FromBody] AmountPreviewRequest req, CancellationToken ct = default)
    {
        var resp = await _service.PreviewAmountAsync(req, ct);
        return resp.IsSuccess ? Ok(resp) : BadRequest(resp);
    }

    [HttpGet("/api/employees/{employeeId}/overtime-types")]
    public async Task<ActionResult<ApiResponse<List<OvertimeTypeOption>>>> GetOvertimeTypesForEmployee(
        string employeeId, CancellationToken ct = default)
        => Ok(await _service.GetOvertimeTypesForEmployeeAsync(employeeId, ct));

    [HttpPost("{id:guid}/documents")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<OvertimeDocumentDto>>> UploadDocument(
        Guid id, [FromForm] UploadDocumentRequest request, CancellationToken ct = default)
    {
        var resp = await _service.UploadDocumentAsync(id, request.File, ct);
        return resp.IsSuccess ? Ok(resp) : BadRequest(resp);
    }

    [HttpGet("{id:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> DownloadDocument(Guid id, Guid documentId, CancellationToken ct = default)
    {
        var doc = await _service.DownloadDocumentAsync(id, documentId, ct);
        if (doc is null) return NotFound();
        return File(doc.Value.Bytes, doc.Value.ContentType, doc.Value.FileName);
    }
}
