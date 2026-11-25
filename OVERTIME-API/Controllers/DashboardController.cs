using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Services.Implementations;
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

        // Resolve all userIds the current user is actively acting for, so that
        // transactions assigned to those users also appear in this user's queue.
        var actingConfigs = new List<PositionApprovalConfig>();
        if (!string.IsNullOrWhiteSpace(me.EmployeeId))
        {
            var nowUtc = DateTime.UtcNow;
            actingConfigs = await _db.PositionApprovalConfigs
                .Include(c => c.ActingAppointments)
                .Where(c => c.ActingAppointments.Any(a =>
                    a.ActingEmployeeId == me.EmployeeId
                    && a.StartDate <= nowUtc && a.EndDate >= nowUtc))
                .AsNoTracking()
                .ToListAsync(ct);
        }

        // Match both the canonical application UserId and the payroll
        // EmployeeId used by legacy rows. Acting primary holders contribute
        // both forms too, so acting appointments behave identically.
        var myAssigneeIds = WorkflowAssigneeIdentity.ForUserAndActing(
            me, _user.AllUsers, actingConfigs);
        var myCaptureIds = WorkflowAssigneeIdentity.ForUser(me);

        // ── Recommendation queue ─────────────────────────────────────────────
        // Capturer submitted → Status=Recommended, assigned to Recommender.
        var awaitingMyRecommendation = await _db.OvertimeTransactions.CountAsync(
            t => t.CurrentAssigneeUserId != null
                 && myAssigneeIds.Contains(t.CurrentAssigneeUserId)
                 && t.Status == WorkflowStatus.Recommended, ct);

        // ── Overtime approval queue ──────────────────────────────────────────
        // Recommender acted → Status=ApprovedForPayment, assigned to Overtime Approver.
        // (Excess approver sub-hop also sits at this status but the workflow
        //  correctly re-assigns CurrentAssigneeUserId, so no extra filter needed.)
        var awaitingMyApproval = await _db.OvertimeTransactions.CountAsync(
            t => t.CurrentAssigneeUserId != null
                 && myAssigneeIds.Contains(t.CurrentAssigneeUserId)
                 && t.Status == WorkflowStatus.ApprovedForPayment, ct);

        // ── Payroll queues (capture + approval) ─────────────────────────────
        // Both sit at AwaitingPayrollApproval, split only by IsPayrollCaptured.
        // One GroupBy query replaces two COUNT queries.
        int awaitingPayrollCapture = 0;
        int awaitingPayrollApproval = 0;
        if (me.CanAccessPayroll)
        {
            var payrollCounts = await _db.OvertimeTransactions
                .Where(t => t.Status == WorkflowStatus.AwaitingPayrollApproval)
                .GroupBy(t => t.IsPayrollCaptured)
                .Select(g => new { IsCaptured = g.Key, Count = g.Count() })
                .ToListAsync(ct);

            awaitingPayrollCapture  = payrollCounts.FirstOrDefault(x => !x.IsCaptured)?.Count ?? 0;
            awaitingPayrollApproval = payrollCounts.FirstOrDefault(x =>  x.IsCaptured)?.Count ?? 0;
        }

        // ── In-progress captures ─────────────────────────────────────────────
        var capturedByMeInProgress = await _db.OvertimeTransactions.CountAsync(
            t => t.CapturedBy != null
                 && myCaptureIds.Contains(t.CapturedBy)
                 && t.Status != WorkflowStatus.Processed
                 && t.Status != WorkflowStatus.Rejected
                 && t.Status != WorkflowStatus.Returned, ct);

        // ── Returned to me ───────────────────────────────────────────────────
        var returnedToMe = await _db.OvertimeTransactions.CountAsync(
            t => t.Status == WorkflowStatus.Returned
                 && ((t.CapturedBy != null && myCaptureIds.Contains(t.CapturedBy))
                     || (t.CurrentAssigneeUserId != null
                         && myAssigneeIds.Contains(t.CurrentAssigneeUserId))), ct);

        // ── System-wide "at a glance" stats ──────────────────────────────────
        // Derive the tax year date window from AAAA_ConfigSettings.
        // Format is "YYYY/YYYY+1" (e.g. "2026/2027"). South-African tax year
        // starts 1 March, so "2026/2027" → [2026-03-01, 2027-03-01).
        var taxYearStr = await _db.AAAAConfigSettings
            .Where(c => c.KeyName == "TaxYear")
            .Select(c => c.KeyValue)
            .FirstOrDefaultAsync(ct) ?? "";

        DateTime taxYearStart = DateTime.MinValue;
        DateTime taxYearEnd   = DateTime.MaxValue;
        if (!string.IsNullOrWhiteSpace(taxYearStr))
        {
            var parts = taxYearStr.Split('/');
            if (parts.Length == 2
                && int.TryParse(parts[0], out var startYear)
                && int.TryParse(parts[1], out var endYear))
            {
                taxYearStart = new DateTime(startYear, 3, 1, 0, 0, 0, DateTimeKind.Utc);
                taxYearEnd   = new DateTime(endYear,   3, 1, 0, 0, 0, DateTimeKind.Utc);
            }
        }

        // ── Tax-year at-a-glance stats ────────────────────────────────────────
        // One GroupBy query replaces three separate COUNT / SUM queries.
        var taxYearStats = await _db.OvertimeTransactions
            .Where(t => t.CreatedAt >= taxYearStart && t.CreatedAt < taxYearEnd)
            .GroupBy(_ => true)
            .Select(g => new
            {
                Total     = g.Count(),
                Hours     = g.Sum(t => t.Hours),
                Processed = g.Count(t => t.Status == WorkflowStatus.Processed),
            })
            .FirstOrDefaultAsync(ct);

        var totalTransactionsThisTaxYear = taxYearStats?.Total     ?? 0;
        var totalHoursThisTaxYear        = taxYearStats?.Hours     ?? 0m;
        var totalProcessedThisTaxYear    = taxYearStats?.Processed ?? 0;

        var totalInProgress = await _db.OvertimeTransactions.CountAsync(
            t => t.Status != WorkflowStatus.Processed
                 && t.Status != WorkflowStatus.Rejected
                 && t.Status != WorkflowStatus.Returned, ct);

        var dto = new DashboardSummaryDto
        {
            AwaitingMyRecommendation     = awaitingMyRecommendation,
            AwaitingMyApproval           = awaitingMyApproval,
            AwaitingPayrollCapture       = awaitingPayrollCapture,
            AwaitingPayrollApproval      = awaitingPayrollApproval,
            CapturedByMeInProgress       = capturedByMeInProgress,
            ReturnedToMe                 = returnedToMe,
            TotalTransactionsThisTaxYear = totalTransactionsThisTaxYear,
            TotalHoursThisTaxYear        = totalHoursThisTaxYear,
            TotalProcessedThisTaxYear    = totalProcessedThisTaxYear,
            TotalInProgress              = totalInProgress,
        };

        return Ok(ApiResponse<DashboardSummaryDto>.Success(dto));
    }

    /// <summary>
    /// Returns current payroll cycle/period status for the active tax year.
    /// Mirrors the logic of Payroll_GetPayrollCycleDetailsStatus SP:
    ///   For each (CycleID, CycleModeID) group find the earliest unprocessed period
    ///   and report its status (Open / Approved / LockedDown / Processed).
    /// All authenticated users may call this endpoint.
    /// </summary>
    [HttpGet("payroll-cycles")]
    public async Task<ActionResult<ApiResponse<PayrollCyclesResponseDto>>> PayrollCycles(CancellationToken ct = default)
    {
        // 1. Resolve active tax year.
        var taxYear = await _db.AAAAConfigSettings
            .Where(c => c.KeyName == "TaxYear")
            .Select(c => c.KeyValue)
            .FirstOrDefaultAsync(ct) ?? "";

        // 2. Find min Period_ID per (CycleID, CycleModeID) — active, unprocessed periods.
        var minPeriods = await _db.PayrollCyclePeriodDetails
            .Where(p => p.TaxYear == taxYear && p.Processed == false && p.Enabled == true)
            .GroupBy(p => new { p.CycleId, p.CycleModeId })
            .Select(g => new
            {
                g.Key.CycleId,
                g.Key.CycleModeId,
                MinPeriodId = g.Min(p => p.PeriodId)
            })
            .ToListAsync(ct);

        if (minPeriods.Count == 0)
            return Ok(ApiResponse<PayrollCyclesResponseDto>.Success(
                new PayrollCyclesResponseDto { TaxYear = taxYear }));

        // 3. Load the matching period rows, cycles, and cycle modes.
        var periodIds   = minPeriods.Select(x => x.MinPeriodId).Distinct().ToList();
        var cycleIds    = minPeriods.Select(x => x.CycleId).Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToList();
        var cycleModeIds = minPeriods.Select(x => x.CycleModeId).Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToList();

        var periods = await _db.PayrollCyclePeriodDetails
            .Where(p => periodIds.Contains(p.PeriodId))
            .AsNoTracking()
            .ToListAsync(ct);

        var cycles = await _db.ConstCycles
            .Where(c => c.Enabled == true && cycleIds.Contains(c.CycleId))
            .AsNoTracking()
            .ToListAsync(ct);

        var cycleModes = await _db.ConstPayrollCycleModes
            .Where(m => m.Enabled != 0 && cycleModeIds.Contains(m.CycleModeId))
            .AsNoTracking()
            .ToListAsync(ct);

        // 4. Join and build response — ordered by cycle description.
        var cycleMap     = cycles.ToDictionary(c => c.CycleId);
        var cycleModeMap = cycleModes.ToDictionary(m => m.CycleModeId);
        var periodMap    = periods.ToDictionary(p => p.PeriodId);

        var rows = (from mp in minPeriods
                    where periodMap.ContainsKey(mp.MinPeriodId)
                       && mp.CycleId.HasValue && cycleMap.ContainsKey(mp.CycleId.Value)
                       && mp.CycleModeId.HasValue && cycleModeMap.ContainsKey(mp.CycleModeId.Value)
                    let p  = periodMap[mp.MinPeriodId]
                    let c  = cycleMap[mp.CycleId!.Value]
                    where c.CycleDesc != "Ad Hoc Termination"
                    let cm = cycleModeMap[mp.CycleModeId!.Value]
                    orderby c.CycleDesc
                    select new PayrollCycleStatusDto
                    {
                        Payroll   = c.CycleDesc ?? "",
                        CycleType = cm.CycleModeDesc ?? "",
                        Period    = p.ProcessingMonth ?? "",
                        Status    = p.Processed == true     ? "Processed"
                                  : p.ApprovedStatus == "Yes" ? "Approved"
                                  : p.LockedDown == true    ? "LockedDown"
                                  : "Open"
                    }).ToList();

        return Ok(ApiResponse<PayrollCyclesResponseDto>.Success(new PayrollCyclesResponseDto
        {
            TaxYear = taxYear,
            Cycles  = rows
        }));
    }
}
