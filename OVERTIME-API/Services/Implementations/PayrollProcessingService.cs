using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

public class PayrollProcessingService : IPayrollProcessingService
{
    private readonly OvertimeDbContext _db;
    private readonly ICurrentUserService _user;
    private readonly ILogger<PayrollProcessingService> _log;

    public PayrollProcessingService(
        OvertimeDbContext db,
        ICurrentUserService user,
        ILogger<PayrollProcessingService> log)
    {
        _db = db; _user = user; _log = log;
    }

    // -----------------------------------------------------------------------
    //  Search
    // -----------------------------------------------------------------------

    public async Task<ApiResponse<PayrollProcessingSummaryDto>> SearchAsync(
        DateTime? fromDate,
        DateTime? toDate,
        int? cycleId,
        int? departmentId,
        int? divisionId,
        CancellationToken ct = default)
    {
        // Postgres requires timestamps with time zone; normalise Unspecified → UTC.
        var from = fromDate.HasValue
            ? DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc)
            : (DateTime?)null;
        var to = toDate.HasValue
            ? DateTime.SpecifyKind(toDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : (DateTime?)null;

        // Transactions arrive here after the full approval chain:
        //   Requested → Recommended → ApprovedForPayment → AwaitingPayrollApproval
        // The workflow engine sets status to AwaitingPayrollApproval when the
        // approver (or excess-approver) signs off.  IsPayrollCaptured starts
        // false and is only set to true by SendToPayrollAsync, so this filter
        // shows exactly the queue awaiting payroll capture.
        var q = _db.OvertimeTransactions
            .AsNoTracking()
            .Where(t => t.Status == WorkflowStatus.AwaitingPayrollApproval
                     && !t.IsPayrollCaptured);

        if (from.HasValue)
            q = q.Where(t => t.OvertimeDate >= from.Value);
        if (to.HasValue)
            q = q.Where(t => t.OvertimeDate <= to.Value);

        // Cycle is NOT stored on the transaction — look it up from the
        // employee master (Payroll_Employee.CycleID) so that existing records
        // (and future ones) work regardless of what was snapshotted at capture.
        if (cycleId.HasValue)
        {
            var empIdsInCycle = await _db.PayrollEmployees
                .AsNoTracking()
                .Where(e => e.CycleId == cycleId.Value)
                .Select(e => e.EmployeeId.ToString())
                .ToListAsync(ct);

            q = q.Where(t => empIdsInCycle.Contains(t.EmployeeId));
        }

        if (departmentId.HasValue)
            q = q.Where(t => t.LegacyDepartmentId == departmentId.Value);
        if (divisionId.HasValue)
            q = q.Where(t => t.LegacyDivisionId == divisionId.Value);

        var transactions = await q.OrderBy(t => t.OvertimeDate)
            .ThenBy(t => t.EmployeeName)
            .ToListAsync(ct);

        // Build position description lookup (string PositionId → PositionDesc).
        var positionIds = transactions
            .Where(t => !string.IsNullOrWhiteSpace(t.PositionId))
            .Select(t => t.PositionId)
            .Distinct()
            .ToHashSet();

        Dictionary<string, string> posDescMap = new(StringComparer.OrdinalIgnoreCase);
        if (positionIds.Count > 0)
        {
            var intIds = positionIds
                .Where(id => int.TryParse(id, out _))
                .Select(id => int.Parse(id!))
                .ToList();

            if (intIds.Count > 0)
            {
                var positions = await _db.PayrollPositions
                    .AsNoTracking()
                    .Where(p => intIds.Contains(p.PositionId))
                    .Select(p => new { p.PositionId, p.PositionDesc })
                    .ToListAsync(ct);

                foreach (var pos in positions)
                    posDescMap[pos.PositionId.ToString()] = pos.PositionDesc ?? string.Empty;
            }
        }

        var rows = transactions.Select(t =>
        {
            int? legacyEmpId = int.TryParse(t.EmployeeId, out var eid) ? eid : (int?)null;
            posDescMap.TryGetValue(t.PositionId ?? string.Empty, out var posDesc);
            return new PayrollProcessingRowDto
            {
                Id = t.Id,
                EmployeeId = t.EmployeeId,
                EmployeeName = t.EmployeeName,
                LegacyEmployeeId = legacyEmpId,
                LegacyDepartmentId = t.LegacyDepartmentId,
                LegacyDepartmentName = t.LegacyDepartmentName,
                LegacyDivisionId = t.LegacyDivisionId,
                LegacyDivisionName = t.LegacyDivisionName,
                PositionId = t.PositionId,
                PositionDescription = posDesc,
                OvertimeDate = t.OvertimeDate,
                SalaryHeadId = t.SalaryHeadId,
                SalaryHeadName = t.SalaryHeadName,
                StartTime = t.StartTime.HasValue ? t.StartTime.Value.ToString(@"hh\:mm") : null,
                EndTime = t.EndTime.HasValue ? t.EndTime.Value.ToString(@"hh\:mm") : null,
                Hours = t.Hours,
                Amount = t.Amount,
                RecommenderEmployeeName = t.RecommenderEmployeeName,
                ApproverEmployeeName = t.ApproverEmployeeName,
                CapturedByName = t.CapturedByName,
                IsExcess = t.IsExcess,
                Status = (int)t.Status,
                StatusLabel = t.Status.ToLabel()
            };
        }).ToList();

        var summary = new PayrollProcessingSummaryDto
        {
            TotalRows = rows.Count,
            TotalHours = rows.Sum(r => r.Hours),
            TotalAmount = rows.Sum(r => r.Amount),
            Rows = rows
        };

        return ApiResponse<PayrollProcessingSummaryDto>.Success(summary);
    }

    // -----------------------------------------------------------------------
    //  Send to Payroll
    // -----------------------------------------------------------------------

    public async Task<ApiResponse<int>> SendToPayrollAsync(
        SendToPayrollRequest request,
        CancellationToken ct = default)
    {
        if (request.SelectedIds.Count == 0)
            return ApiResponse<int>.Failure("No transactions selected.");

        // Load the target payroll period to get FinancialYear / TaxYear.
        var period = await _db.PayrollCyclePeriodDetails
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PeriodId == request.PeriodId, ct);

        if (period == null)
            return ApiResponse<int>.Failure($"Period {request.PeriodId} not found.");

        // Load only AwaitingPayrollApproval + not-yet-captured transactions.
        var transactions = await _db.OvertimeTransactions
            .Where(t => request.SelectedIds.Contains(t.Id)
                     && t.Status == WorkflowStatus.AwaitingPayrollApproval
                     && !t.IsPayrollCaptured)
            .ToListAsync(ct);

        if (transactions.Count == 0)
            return ApiResponse<int>.Failure("None of the selected transactions are awaiting payroll capture.");

        // Build MOCID lookup: SalaryHeadId → first enabled Const_MOC MOCId.
        var salaryHeadIds = transactions.Select(t => t.SalaryHeadId).Distinct().ToList();
        var mocMap = await _db.ConstMOCs
            .AsNoTracking()
            .Where(m => salaryHeadIds.Contains(m.SalaryHeadId) && (m.Enabled ?? false))
            .GroupBy(m => m.SalaryHeadId)
            .Select(g => new { SalaryHeadId = g.Key, MOCId = g.Min(m => m.MOCId) })
            .ToDictionaryAsync(x => x.SalaryHeadId, x => x.MOCId, ct);

        var currentUser = _user.Current;

        // Capturer must be a valid legacy integer employee ID.
        if (!int.TryParse(currentUser.EmployeeId, out var capturerId))
            return ApiResponse<int>.Failure(
                $"Current user EmployeeId '{currentUser.EmployeeId}' is not a valid legacy employee ID.");

        // Pre-validate all selected transactions so the operation either fully
        // succeeds or fully fails — never partially writes.
        var invalidEmpIds = transactions
            .Where(t => !int.TryParse(t.EmployeeId, out _))
            .Select(t => new { t.Id, t.EmployeeId, t.EmployeeName })
            .ToList();

        if (invalidEmpIds.Count > 0)
        {
            var detail = string.Join(", ", invalidEmpIds.Select(x => $"{x.EmployeeName} ({x.EmployeeId})"));
            return ApiResponse<int>.Failure(
                $"Cannot send to payroll: the following employees do not have valid legacy integer IDs: {detail}.");
        }

        var now = DateTime.UtcNow;

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            int written = 0;

            foreach (var t in transactions)
            {
                int.TryParse(t.EmployeeId, out var empId);  // guaranteed to succeed — validated above

                mocMap.TryGetValue(t.SalaryHeadId, out var mocId);

                var row = new PayrollEmployeeOvertime
                {
                    EmployeeId = empId,
                    OverTimeDate = t.OvertimeDate,
                    OverTimeHour = t.Hours,
                    OverTimeFlag = false,
                    FinancialYear = period.FinancialYear ?? period.TaxYear,
                    Enabled = true,
                    CapturerId = capturerId,
                    DateCaptured = now,
                    MOCId = mocId > 0 ? mocId : null,
                    EarDedTypeId = null,
                    PeriodId = request.PeriodId,
                    TaxYear = period.TaxYear,
                    TotalAmount = t.Amount,
                    SalaryHeadId = t.SalaryHeadId,
                    IsBulk = false,
                    Processed = false,
                    ExcludeFromPayment = false,
                    TerminationEscalated = false,
                    CapturedDuringPeriodId = request.PeriodId,
                    IsApprovalRequired = true,
                    IsApproved = false,
                    RejectedReason = null,
                    // TransactionNo is the DB-generated integer on the existing
                    // OvertimeTransaction row; store it here so payroll can
                    // trace this row back to the source transaction.
                    LinkId = t.TransactionNo
                };

                _db.PayrollEmployeeOvertimes.Add(row);

                // Mark as captured and advance to Processed.
                var previousStatus = t.Status;
                t.Status = WorkflowStatus.Processed;
                t.IsPayrollCaptured = true;
                t.PayrollCapturerEmployeeId = currentUser.EmployeeId;
                t.PayrollCapturerEmployeeName = currentUser.EmployeeName;
                // Resolve the snapshotted PayrollApproverEmployeeId to a
                // User_UserDetail UserId (same translation WorkflowService
                // performs in ResolveAssignee).
                var approverUserId = !string.IsNullOrWhiteSpace(t.PayrollApproverEmployeeId)
                    ? _user.FindByUserId(t.PayrollApproverEmployeeId)?.UserId
                      ?? t.PayrollApproverEmployeeId
                    : null;
                t.CurrentAssigneeUserId = approverUserId;
                t.UpdatedAt = now;

                _db.OvertimeWorkflowStates.Add(new OvertimeWorkflowState
                {
                    OvertimeTransactionId = t.Id,
                    FromStatus = previousStatus,
                    ToStatus = WorkflowStatus.Processed,
                    ActionedBy = currentUser.UserId,
                    Comments = $"Sent to payroll (period {request.PeriodId})",
                    ActionedAt = now
                });

                written++;
            }

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            _log.LogInformation(
                "SendToPayroll: {Count}/{Total} transactions written by user {User}.",
                written, transactions.Count, currentUser.UserId);

            return ApiResponse<int>.Success(written);
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync(ct);
            _log.LogError(ex, "SendToPayroll failed for {Count} transactions.", transactions.Count);
            return ApiResponse<int>.Failure("Send to payroll failed: " + ex.Message);
        }
    }
}
