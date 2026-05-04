using Microsoft.AspNetCore.Mvc;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Controllers;

/// <summary>
/// Position lookups (proxied through the Platinum integration boundary)
/// and per-position approval configuration.
/// </summary>
[ApiController]
[Route("api/positions")]
public class PositionsController : ControllerBase
{
    private readonly IPlatinumIntegrationService _platinum;
    private readonly IPositionApprovalService _approval;

    public PositionsController(
        IPlatinumIntegrationService platinum,
        IPositionApprovalService approval)
    {
        _platinum = platinum;
        _approval = approval;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, CancellationToken ct)
        => Ok(ApiResponse<object>.Success(await _platinum.GetPositionsAsync(search, ct)));

    /// <summary>
    /// Paginated list of positions enriched with an isConfigured flag.
    /// </summary>
    [HttpGet("list")]
    public async Task<IActionResult> GetList(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? sort = null,
        [FromQuery] string? direction = null,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        if (pageSize > 200) pageSize = 200;

        var paged = await _platinum.GetPositionsListAsync(search, status, page, pageSize, sort, direction, ct);
        return Ok(ApiResponse<object>.Success(paged));
    }

    /// <summary>
    /// Counts of total / configured / not-configured positions.
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken ct)
    {
        var summary = await _platinum.GetPositionsSummaryAsync(ct);
        return Ok(ApiResponse<object>.Success(summary));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, CancellationToken ct)
    {
        var p = await _platinum.GetPositionAsync(id, ct);
        return p is null
            ? NotFound(ApiResponse<object>.Failure($"Position '{id}' not found."))
            : Ok(ApiResponse<object>.Success(p));
    }

    [HttpGet("{id}/approval-config")]
    public async Task<IActionResult> GetApprovalConfig(string id, CancellationToken ct)
        => Ok(ApiResponse<object>.Success(await _approval.GetByPositionIdAsync(id, ct)));

    [HttpPut("{id}/approval-config")]
    public async Task<IActionResult> UpsertApprovalConfig(
        string id, [FromBody] UpdatePositionApprovalConfigRequest request, CancellationToken ct)
    {
        var updatedBy = User?.Identity?.Name;
        var data = await _approval.UpsertAsync(id, request, updatedBy, ct);
        return Ok(ApiResponse<object>.Success(data, "Position approval configuration saved."));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Bulk Import endpoints
    // ──────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Download a pre-populated Excel template for bulk import.
    /// Sheet 1 — Position Config (one row per Platinum position).
    /// Sheet 2 — Reporting Relationships.
    /// Sheet 3 — Acting Appointments.
    /// </summary>
    [HttpGet("approval-config/template")]
    public async Task<IActionResult> DownloadImportTemplate(CancellationToken ct)
    {
        var bytes = await _approval.GenerateImportTemplateAsync(ct);
        var fileName = $"PositionApprovalConfig_Template_{DateTime.UtcNow:yyyyMMdd}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    /// <summary>
    /// Export the current position approval setup as a formatted Excel report.
    /// One row per reporting relationship; configured positions with no
    /// relationships appear as a single row with blank applies-to columns.
    /// </summary>
    [HttpGet("approval-config/report")]
    public async Task<IActionResult> DownloadReport(CancellationToken ct)
    {
        var bytes = await _approval.GenerateReportAsync(ct);
        var fileName = $"PositionRelationshipsReport_{DateTime.UtcNow:yyyyMMdd}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    /// <summary>
    /// Validate an uploaded .xlsx import file and return a preview of the
    /// changes that would be applied, plus any row-level errors.
    /// Nothing is committed at this step.
    /// </summary>
    [HttpPost("approval-config/import")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<IActionResult> ValidateImport(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<object>.Failure("No file uploaded."));

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".xlsx")
            return BadRequest(ApiResponse<object>.Failure("Only .xlsx files are accepted."));

        using var stream = file.OpenReadStream();
        var result = await _approval.ValidateImportAsync(stream, ct);
        return Ok(ApiResponse<object>.Success(result));
    }

    /// <summary>
    /// Commit the validated import payload inside a transaction.
    /// The client sends back the validated data it received from /import.
    /// </summary>
    [HttpPost("approval-config/import/confirm")]
    public async Task<IActionResult> ConfirmImport(
        [FromBody] ConfirmPositionApprovalImportRequest request, CancellationToken ct)
    {
        try
        {
            var updatedBy = User?.Identity?.Name;
            var result = await _approval.ConfirmImportAsync(request, updatedBy, ct);
            return Ok(ApiResponse<object>.Success(result, "Import applied successfully."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.Failure(ex.Message));
        }
    }
}
