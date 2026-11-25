using Microsoft.AspNetCore.Mvc;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Controllers;

/// <summary>
/// Payroll Processing page API. Provides search over "Approved for Payment"
/// overtime transactions and the "Send to Payroll" write-back that inserts
/// rows into the legacy <c>Payroll_EmployeeOvertime</c> table.
/// </summary>
[ApiController]
[Route("api/payroll-processing")]
public class PayrollProcessingController : ControllerBase
{
    private readonly IPayrollProcessingService _service;
    private readonly ICurrentUserService _currentUser;

    public PayrollProcessingController(
        IPayrollProcessingService service,
        ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Returns all "Approved for Payment" transactions, optionally filtered.
    /// Requires permission 3202 (CanAccessPayroll).
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<PayrollProcessingSummaryDto>>> Search(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int? cycleId,
        [FromQuery] int? departmentId,
        [FromQuery] int? divisionId,
        CancellationToken ct)
    {
        if (!_currentUser.Current.CanAccessPayroll)
            return StatusCode(403, ApiResponse<PayrollProcessingSummaryDto>.Failure(
                "You do not have permission to access Payroll Processing (permission 3202 required)."));

        var result = await _service.SearchAsync(fromDate, toDate, cycleId, departmentId, divisionId, ct);
        return Ok(result);
    }

    /// <summary>
    /// Writes the selected approved transactions to <c>Payroll_EmployeeOvertime</c>
    /// and advances their status to <c>AwaitingPayrollApproval</c>.
    /// Requires permission 3202 (CanAccessPayroll).
    /// </summary>
    [HttpPost("send-to-payroll")]
    public async Task<ActionResult<ApiResponse<int>>> SendToPayroll(
        [FromBody] SendToPayrollRequest request,
        CancellationToken ct)
    {
        if (!_currentUser.Current.CanAccessPayroll)
            return StatusCode(403, ApiResponse<int>.Failure(
                "You do not have permission to access Payroll Processing (permission 3202 required)."));

        var result = await _service.SendToPayrollAsync(request, ct);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}
