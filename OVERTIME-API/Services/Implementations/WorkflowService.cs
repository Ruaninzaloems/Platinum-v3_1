using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Multi-stage approval workflow:
///   Requested → (Recommender) → Recommended
///             → (Approver) → ApprovedForPayment
///             → (ExcessApprover, only if IsExcess) → ApprovedForPayment*
///             → (PayrollCapturer) → AwaitingPayrollApproval
///             → (PayrollApprover) → Processed
///
/// Submit/Approve advance one step. Return sets state to Returned and routes
/// the row back to the original capturer for edits. Reject is terminal.
/// Auto-approve fires when the resolved next assignee is the current user
/// (e.g. capturer is also the recommender), looping until either a different
/// assignee is hit or a terminal state is reached.
/// </summary>
public class WorkflowService : IWorkflowService
{
    private readonly OvertimeDbContext _db;
    private readonly ICurrentUserService _user;
    private readonly DevUserDirectory _users;
    private readonly ILogger<WorkflowService> _log;

    public WorkflowService(OvertimeDbContext db, ICurrentUserService user, DevUserDirectory users, ILogger<WorkflowService> log)
    { _db = db; _user = user; _users = users; _log = log; }

    // ---------- Public API ----------

    public Task<ApiResponse<OvertimeTransactionDto>> SubmitAsync(Guid id, WorkflowActionRequest req, CancellationToken ct = default)
        => AdvanceAsync(id, req, isSubmit: true, isReturn: false, isReject: false, ct);

    public Task<ApiResponse<OvertimeTransactionDto>> ApproveAsync(Guid id, WorkflowActionRequest req, CancellationToken ct = default)
        => AdvanceAsync(id, req, isSubmit: false, isReturn: false, isReject: false, ct);

    public Task<ApiResponse<OvertimeTransactionDto>> ReturnAsync(Guid id, WorkflowActionRequest req, CancellationToken ct = default)
        => AdvanceAsync(id, req, isSubmit: false, isReturn: true, isReject: false, ct);

    public Task<ApiResponse<OvertimeTransactionDto>> RejectAsync(Guid id, WorkflowActionRequest req, CancellationToken ct = default)
        => AdvanceAsync(id, req, isSubmit: false, isReturn: false, isReject: true, ct);

    public async Task<ApiResponse<List<WorkflowEventDto>>> HistoryAsync(Guid id, CancellationToken ct = default)
    {
        var rows = await _db.OvertimeWorkflowStates
            .Where(w => w.OvertimeTransactionId == id)
            .OrderBy(w => w.ActionedAt)
            .Select(w => new WorkflowEventDto
            {
                Id = w.Id, FromStatus = w.FromStatus, ToStatus = w.ToStatus,
                ActionedBy = w.ActionedBy, Comments = w.Comments, ActionedAt = w.ActionedAt
            })
            .ToListAsync(ct);
        return ApiResponse<List<WorkflowEventDto>>.Success(rows);
    }

    // ---------- Core advance ----------

    private async Task<ApiResponse<OvertimeTransactionDto>> AdvanceAsync(Guid id, WorkflowActionRequest req, bool isSubmit, bool isReturn, bool isReject, CancellationToken ct)
    {
        var tx = await _db.OvertimeTransactions
            .Include(t => t.Documents)
            .Include(t => t.WorkflowHistory)
            .FirstOrDefaultAsync(t => t.Id == id, ct);
        if (tx is null) return ApiResponse<OvertimeTransactionDto>.Failure("Overtime transaction not found.");

        if (tx.Status == WorkflowStatus.Processed || tx.Status == WorkflowStatus.Rejected)
            return ApiResponse<OvertimeTransactionDto>.Failure("Transaction is already in a terminal state.");

        // Action-specific authorisation:
        //   Submit  → only the original capturer, only when the row is in
        //             Requested or Returned (it's been kicked back for edits).
        //   Approve / Return → only the currently-assigned approver.
        //   Reject  → the current assignee OR the original capturer when the
        //             transaction is still at Requested or Returned stage
        //             (allows a capturer to cancel their own draft or a
        //             returned transaction without needing to be the assignee).
        var meId = _user.Current.UserId;
        var isCapturer = string.Equals(tx.CapturedBy, meId, StringComparison.OrdinalIgnoreCase);
        var isAssignee = string.Equals(tx.CurrentAssigneeUserId, meId, StringComparison.OrdinalIgnoreCase);

        if (isSubmit)
        {
            if (tx.Status != WorkflowStatus.Requested && tx.Status != WorkflowStatus.Returned)
                return ApiResponse<OvertimeTransactionDto>.Failure("Only Requested / Returned transactions can be submitted.");
            if (!isCapturer)
                return ApiResponse<OvertimeTransactionDto>.Failure("Only the original capturer can submit this transaction.");
        }
        else
        {
            // Capturer may reject their own transaction while it has not yet
            // been acted on by anyone else: Requested (not yet submitted),
            // Recommended (submitted but recommender hasn't acted yet), or
            // Returned (kicked back for corrections).
            var capturerCanReject = isReject && isCapturer &&
                (tx.Status == WorkflowStatus.Requested
                 || tx.Status == WorkflowStatus.Recommended
                 || tx.Status == WorkflowStatus.Returned);

            if (!isAssignee && !capturerCanReject)
                return ApiResponse<OvertimeTransactionDto>.Failure("Only the current assignee can action this transaction.");
        }

        if (isReject)
        {
            if (string.IsNullOrWhiteSpace(req.Comments))
                return ApiResponse<OvertimeTransactionDto>.Failure("A reason is required when rejecting a transaction.");

            RecordTransition(tx, tx.Status, WorkflowStatus.Rejected, req.Comments);
            tx.Status = WorkflowStatus.Rejected;
            tx.CurrentAssigneeUserId = null;
        }
        else if (isReturn)
        {
            RecordTransition(tx, tx.Status, WorkflowStatus.Returned, req.Comments);
            tx.Status = WorkflowStatus.Returned;
            tx.CurrentAssigneeUserId = tx.CapturedBy;     // back to capturer
        }
        else
        {
            // Forward step. Loop while the next assignee equals the current
            // user — that yields auto-approve when one person wears the next
            // hat as well.
            const int maxHops = 8;
            var hops = 0;
            while (hops++ < maxHops)
            {
                var (next, assignee) = NextStage(tx);

                // Only emit a transition row when the status actually changes
                // — but for the "stay in same status" hops (excess approver,
                // payroll approver) we still want a history entry so the
                // audit log shows the second sign-off.
                RecordTransition(tx, tx.Status, next, req.Comments);

                // Update the tracking flags for the in-place hops BEFORE we
                // mutate the status; this lets the next NextStage() call see
                // the correct branch.
                if (tx.Status == WorkflowStatus.ApprovedForPayment && next == WorkflowStatus.ApprovedForPayment)
                    tx.IsExcessApproved = true;
                else if (tx.Status == WorkflowStatus.AwaitingPayrollApproval && next == WorkflowStatus.AwaitingPayrollApproval)
                    tx.IsPayrollCaptured = true;

                tx.Status = next;
                tx.CurrentAssigneeUserId = assignee;

                if (next == WorkflowStatus.Processed) break;
                if (!string.Equals(assignee, meId, StringComparison.OrdinalIgnoreCase)) break;

                // Auto-approve once; clear comments so we don't double-stamp.
                req = new WorkflowActionRequest { Comments = null };
            }
        }

        tx.UpdatedAt = DateTime.UtcNow;
        _db.OvertimeAuditTrails.Add(new OvertimeAuditTrail
        {
            EntityName = nameof(OvertimeTransaction), EntityId = tx.Id.ToString(),
            Action = isReject ? "Reject" : isReturn ? "Return" : "Advance",
            PerformedBy = meId,
            Details = $"NewStatus={tx.Status}; Assignee={tx.CurrentAssigneeUserId}"
        });

        await _db.SaveChangesAsync(ct);
        return ApiResponse<OvertimeTransactionDto>.Success(OvertimeTransactionsService.ToDto(tx, _user));
    }

    private void RecordTransition(OvertimeTransaction tx, WorkflowStatus from, WorkflowStatus to, string? comments)
    {
        // Add via the DbSet directly so EF marks the row as Added. Going
        // through the navigation collection invokes DetectChanges, which —
        // because OvertimeWorkflowState.Id is pre-initialised to a non-empty
        // Guid in the model constructor — caused EF to interpret the entity
        // as an existing-but-modified row and emit an UPDATE that matched
        // zero rows (DbUpdateConcurrencyException).
        var state = new OvertimeWorkflowState
        {
            OvertimeTransactionId = tx.Id,
            FromStatus = from, ToStatus = to,
            ActionedBy = _user.Current.UserId,
            Comments = comments,
            ActionedAt = DateTime.UtcNow
        };
        _db.OvertimeWorkflowStates.Add(state);
        tx.WorkflowHistory.Add(state);
    }

    /// <summary>
    /// Compute the next status + assignee user id given the transaction's
    /// current state and the snapshot of approvers stored on the row.
    /// </summary>
    private (WorkflowStatus Next, string? Assignee) NextStage(OvertimeTransaction tx)
    {
        // The workflow snapshots Payroll EmployeeIds on each tx
        // (RecommenderEmployeeId, ApproverEmployeeId, ...). Authorisation
        // and "my queue" filters compare CurrentAssigneeUserId against
        // ICurrentUserService.Current.UserId, which is a User_UserDetail
        // user id, so we must translate empId → user id here. Falling back
        // to the empId itself keeps non-dev rows flowing in case the
        // directory hasn't seen that employee yet (the X-User-Id shim
        // accepts either form).
        return tx.Status switch
        {
            // Capturer submits → goes to recommender.
            WorkflowStatus.Requested or WorkflowStatus.Returned
                => (WorkflowStatus.Recommended, ResolveAssignee(tx.RecommenderEmployeeId)),

            // Recommender approves → always to the normal approver first.
            WorkflowStatus.Recommended
                => (WorkflowStatus.ApprovedForPayment, ResolveAssignee(tx.ApproverEmployeeId)),

            // Approver acted. If the row is over the monthly cap and the
            // excess approver hasn't signed off yet, stay in
            // ApprovedForPayment for one more hop (excess approver). The
            // outer loop sets IsExcessApproved=true after this hop.
            WorkflowStatus.ApprovedForPayment when tx.IsExcess && !tx.IsExcessApproved
                => (WorkflowStatus.ApprovedForPayment, ResolveAssignee(tx.ExcessApproverEmployeeId)),

            // Approver (or excess approver) done → goes to payroll capturer.
            WorkflowStatus.ApprovedForPayment
                => (WorkflowStatus.AwaitingPayrollApproval, ResolveAssignee(tx.PayrollCapturerEmployeeId)),

            // Payroll capturer released → stay in AwaitingPayrollApproval
            // for one more hop so the payroll approver can sign off. The
            // outer loop sets IsPayrollCaptured=true after this hop.
            WorkflowStatus.AwaitingPayrollApproval when !tx.IsPayrollCaptured
                => (WorkflowStatus.AwaitingPayrollApproval, ResolveAssignee(tx.PayrollApproverEmployeeId)),

            // Payroll approver signs off → terminal Processed, no assignee.
            WorkflowStatus.AwaitingPayrollApproval
                => (WorkflowStatus.Processed, null),

            _ => (tx.Status, tx.CurrentAssigneeUserId)
        };
    }

    /// <summary>
    /// Translate a snapshotted Payroll EmployeeId into the User_UserDetail
    /// user id used by ICurrentUserService.Current.UserId. Without this, the
    /// "is the current user the assignee?" check in <see cref="AdvanceAsync"/>
    /// (and the "my queue" filter in <see cref="ListCurrentForUserAsync"/>)
    /// would never match after the first transition.
    /// </summary>
    private string? ResolveAssignee(string? empId)
    {
        if (string.IsNullOrWhiteSpace(empId)) return empId;
        return _users.FindByUserId(empId)?.UserId ?? empId;
    }
}
