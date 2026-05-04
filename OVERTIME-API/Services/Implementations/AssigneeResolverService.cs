using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Resolves the recommender, approver, and excess-approver for an overtime
/// submission by walking the PositionApprovalConfig hierarchy upward.
///
/// Data model:
///   Each position's PositionApprovalConfig owns a list of
///   PositionReportingRelationship rows. Each row's ReportsToPositionId holds
///   the ID of a position that is BELOW the config owner in the org chart
///   (i.e. a position whose overtime this config owner is responsible for).
///   Example: CFO (541) has a relationship row with ReportsToPositionId = "681"
///   meaning "Dep Dir: Expenditure &amp; SCM reports to / is approved by the CFO".
///
/// Traversal:
///   "Who is the parent (immediate superior) of position X?" is answered by a
///   REVERSE lookup — scan all configs and find the one that lists X in its
///   relationships. That config's position is X's parent in the approval chain.
///
/// Algorithm (confirmed by product owner):
///   1. Recommender  — walk from the PARENT of the employee's position upward;
///                     first configured position with IsOvertimeRecommender wins.
///   2. Approver     — walk from the PARENT of the resolved recommender upward;
///                     first configured position with IsOvertimeApprover wins.
///   3. ExcessApprover — walk from the PARENT of the resolved approver upward;
///                     first configured position with IsDepartmentExcessOvertimeApprover wins.
///
/// Example chains:
///   Employee in 1654  →  Recommender = 270,   Approver = 1911
///   Employee in 270   →  Recommender = 1911,  Approver = 1561
///   Employee in 1911  →  Recommender = 1561,  Approver = 681
///   Employee in 1561  →  Recommender = 681,   Approver = 541
///
/// Acting appointments and dev-user fallbacks are honoured as before.
/// </summary>
public class AssigneeResolverService : IAssigneeResolverService
{
    private readonly OvertimeDbContext _db;
    private readonly DevUserDirectory _users;

    public AssigneeResolverService(OvertimeDbContext db, DevUserDirectory users)
    { _db = db; _users = users; }

    public async Task<AssigneeBundle> ResolveAsync(string capturedForPositionId, CancellationToken ct = default)
    {
        var configs = await _db.PositionApprovalConfigs
            .Include(c => c.ReportingRelationships)
            .Include(c => c.ActingAppointments)
            .AsNoTracking()
            .ToListAsync(ct);

        var byPosId = configs.ToDictionary(c => c.PositionId, StringComparer.OrdinalIgnoreCase);
        var now = DateTime.UtcNow;

        // Returns the parent position ID of the given child position by REVERSE
        // lookup: scan all configs and find the one that lists childPositionId in
        // its active ReportingRelationships. Because the data model stores
        // relationships on the SUPERIOR's config pointing DOWN to subordinates,
        // the config that mentions childPositionId is childPositionId's direct parent.
        string? GetParentId(string? childPositionId)
        {
            if (string.IsNullOrWhiteSpace(childPositionId)) return null;
            return configs.FirstOrDefault(c => c.ReportingRelationships.Any(r =>
                    string.Equals(r.ReportsToPositionId, childPositionId, StringComparison.OrdinalIgnoreCase)
                    && r.StartDate <= now && (r.EndDate == null || r.EndDate >= now)))
                ?.PositionId;
        }

        // Resolves the DevUser for a winning position, honouring any active
        // TemporaryActingAppointment that covers the winning position.
        DevUser? ResolveUser(Models.Domain.PositionApprovalConfig winningCfg)
        {
            var posId = winningCfg.PositionId;
            var acting = winningCfg.ActingAppointments
                .FirstOrDefault(a => a.ActingInPositionId == posId
                                     && a.StartDate <= now && a.EndDate >= now);
            if (acting != null)
            {
                var actingUser = _users.All.FirstOrDefault(u =>
                    string.Equals(u.EmployeeId, acting.ActingEmployeeId, StringComparison.OrdinalIgnoreCase));
                if (actingUser != null) return actingUser;
            }
            return _users.All.FirstOrDefault(u =>
                string.Equals(u.PositionId, posId, StringComparison.OrdinalIgnoreCase));
        }

        // Walk upward starting AT startPositionId (inclusive) until a position
        // matching the predicate is found. Returns (user, resolvedPositionId).
        // "Upward" is found via GetParentId's reverse lookup at each hop.
        // Callers pass GetParentId(x) to skip position x itself and begin at
        // x's immediate superior.
        (DevUser? User, string? PositionId) WalkFrom(string? startPositionId, Func<Models.Domain.PositionApprovalConfig, bool> match)
        {
            var current = startPositionId;
            for (var hop = 0; hop < 16; hop++)
            {
                if (string.IsNullOrWhiteSpace(current)) return (null, null);
                if (!byPosId.TryGetValue(current, out var cfg)) return (null, null);
                if (match(cfg)) return (ResolveUser(cfg), cfg.PositionId);

                // Move upward via reverse lookup (find which config lists 'current'
                // in its relationships — that config is 'current's superior).
                current = GetParentId(current);
            }
            return (null, null);
        }

        // --- Chained resolution --------------------------------------------------
        //
        // Each role's walk starts from the PARENT of the previous resolved position,
        // ensuring the same position is never used for two consecutive roles when a
        // higher candidate exists.

        // Step 1: Recommender — start from the parent of the employee's position.
        var (recommender, recommenderPosId) =
            WalkFrom(GetParentId(capturedForPositionId), c => c.IsOvertimeRecommender);

        // Step 2: Approver — start from the parent of the recommender's position.
        var (approver, approverPosId) =
            WalkFrom(GetParentId(recommenderPosId), c => c.IsOvertimeApprover);

        // Step 3: ExcessApprover — start from the parent of the approver's position.
        var (excessApprover, _) =
            WalkFrom(GetParentId(approverPosId), c => c.IsDepartmentExcessOvertimeApprover);

        // Fall back to the first dev-user with the matching role flag when the
        // position graph yields nothing (e.g. chain not yet fully configured).
        return new AssigneeBundle
        {
            Recommender    = recommender   ?? _users.All.FirstOrDefault(u => u.IsRecommender),
            Approver       = approver      ?? _users.All.FirstOrDefault(u => u.IsApprover),
            ExcessApprover = excessApprover ?? _users.All.FirstOrDefault(u => u.IsExcessApprover),
            PayrollCapturer = _users.All.FirstOrDefault(u => u.IsPayrollCapturer),
            PayrollApprover = _users.All.FirstOrDefault(u => u.IsPayrollApprover),
        };
    }
}
