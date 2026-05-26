using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly OvertimeDbContext _db;
    private readonly ICurrentUserService _user;

    public DashboardController(OvertimeDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    /// <summary>
    /// Returns per-role action counts for the current user.
    ///
    /// Workflow stage → status mapping (from WorkflowService.NextStage):
    ///   Capturer submits          → Status = Recommended            → Recommender acts
    ///   Recommender acts          → Status = ApprovedForPayment     → Overtime Approver acts
    ///   Overtime Approver acts    → Status = AwaitingPayrollApproval (open queue)
    ///   Any payroll user captures → Status = AwaitingPayrollApproval (IsPayrollCaptured=true)
    ///   Any payroll user approves → Status = Processed
    ///
    /// Routing model (mixed):
    ///   Recommended / ApprovedForPayment — routed by CurrentAssigneeUserId (designated individual).
    ///   AwaitingPayrollApproval          — open queue; CurrentAssigneeUserId=null. Any user
    ///                                      with CanAccessPayroll permission can action and sees
    ///                                      all items in this stage regardless of assignee.
    /// </summary>
    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> Summary(CancellationToken ct = default)
    {
        var me = _user.Current;

        // ── Recommendation queue ─────────────────────────────────────────────
        // Capturer submitted → Status=Recommended, assigned to Recommender.
        var awaitingMyRecommendation = await _db.OvertimeTransactions.CountAsync(
            t => t.CurrentAssigneeUserId == me.UserId
                 && t.Status == WorkflowStatus.Recommended, ct);

        // ── Overtime approval queue ──────────────────────────────────────────
        // Recommender acted → Status=ApprovedForPayment, assigned to Overtime Approver.
        // (Excess approver sub-hop also sits at this status but the workflow
        //  correctly re-assigns CurrentAssigneeUserId, so no extra filter needed.)
        var awaitingMyApproval = await _db.OvertimeTransactions.CountAsync(
            t => t.CurrentAssigneeUserId == me.UserId
                 && t.Status == WorkflowStatus.ApprovedForPayment, ct);

        // ── Payroll capture queue ────────────────────────────────────────────
        // Open queue — any user with CanAccessPayroll sees all transactions
        // at AwaitingPayrollApproval that haven't been payroll-captured yet.
        var awaitingPayrollCapture = me.CanAccessPayroll
            ? await _db.OvertimeTransactions.CountAsync(
                t => t.Status == WorkflowStatus.AwaitingPayrollApproval
                     && !t.IsPayrollCaptured, ct)
            : 0;

        // ── Payroll approval queue ───────────────────────────────────────────
        // Open queue — any payroll user sees transactions captured but not yet
        // payroll-approved.
        var awaitingPayrollApproval = me.CanAccessPayroll
            ? await _db.OvertimeTransactions.CountAsync(
                t => t.Status == WorkflowStatus.AwaitingPayrollApproval
                     && t.IsPayrollCaptured, ct)
            : 0;

        // ── In-progress captures ─────────────────────────────────────────────
        var capturedByMeInProgress = await _db.OvertimeTransactions.CountAsync(
            t => t.CapturedBy == me.UserId
                 && t.Status != WorkflowStatus.Processed
                 && t.Status != WorkflowStatus.Rejected
                 && t.Status != WorkflowStatus.Returned, ct);

        // ── Returned to me ───────────────────────────────────────────────────
        var returnedToMe = await _db.OvertimeTransactions.CountAsync(
            t => t.Status == WorkflowStatus.Returned
                 && (t.CapturedBy == me.UserId || t.CurrentAssigneeUserId == me.UserId), ct);

        var dto = new DashboardSummaryDto
        {
            AwaitingMyRecommendation = awaitingMyRecommendation,
            AwaitingMyApproval       = awaitingMyApproval,
            AwaitingPayrollCapture   = awaitingPayrollCapture,
            AwaitingPayrollApproval  = awaitingPayrollApproval,
            CapturedByMeInProgress   = capturedByMeInProgress,
            ReturnedToMe             = returnedToMe,
        };

        return Ok(ApiResponse<DashboardSummaryDto>.Success(dto));
    }
}
