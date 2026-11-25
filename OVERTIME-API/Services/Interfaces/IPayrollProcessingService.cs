using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;

namespace PlatinumOvertime_API.Services.Interfaces;

/// <summary>
/// Service contract for the Payroll Processing page.
/// Provides search over "Approved for Payment" transactions and the
/// "Send to Payroll" write-back that inserts into Payroll_EmployeeOvertime
/// and advances the workflow status.
/// </summary>
public interface IPayrollProcessingService
{
    /// <summary>
    /// Returns transactions with status <c>ApprovedForPayment</c> that have not
    /// yet been sent to payroll, optionally filtered by date range and
    /// department / division.
    /// </summary>
    Task<ApiResponse<PayrollProcessingSummaryDto>> SearchAsync(
        DateTime? fromDate,
        DateTime? toDate,
        int? cycleId,
        int? departmentId,
        int? divisionId,
        CancellationToken ct = default);

    /// <summary>
    /// Inserts the selected approved transactions into <c>Payroll_EmployeeOvertime</c>
    /// and transitions their workflow status to <c>AwaitingPayrollApproval</c>.
    /// Returns the count of rows successfully written.
    /// </summary>
    Task<ApiResponse<int>> SendToPayrollAsync(
        SendToPayrollRequest request,
        CancellationToken ct = default);
}
