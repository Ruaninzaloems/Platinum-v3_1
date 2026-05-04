using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder that wires up the sample organogram supplied by
/// the customer (CFO root → CIO / Dep Dirs → managers/officers).
///
/// Data model convention:
///   PositionReportingRelationship rows are stored on the SUPERIOR position's
///   PositionApprovalConfig.  ReportsToPositionId holds the ID of the
///   SUBORDINATE position (the one that "reports to" the config owner).
///   Example: CFO (541) config owns a row with ReportsToPositionId = "681"
///   meaning "Dep Dir: Expenditure &amp; SCM (681) reports to the CFO."
///
/// On each run the seeder:
///   1. Ensures a PositionApprovalConfig exists for every PARENT in the edge list.
///   2. Removes any previously-seeded WRONG-direction row
///      (child config → parent, which is the opposite of the intended convention).
///   3. Inserts the correct DOWNWARD row (parent config → child) if absent.
/// </summary>
public class OrgChartSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<OrgChartSeeder> _log;

    public OrgChartSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<OrgChartSeeder> log)
    {
        _db = db;
        _env = env;
        _log = log;
    }

    /// <summary>
    /// Edges of the orgchart expressed as (ChildId, ParentId).
    /// Every id has been verified to exist in the seeded Payroll_Position dataset.
    /// </summary>
    private static readonly (int ChildId, int ParentId)[] Edges =
    {
        // CFO direct reports
        (543, 541),  // Chief Information Officer
        (681, 541),  // Dep Dir: Expenditure & SCM
        (682, 541),  // Dep Dir: Financial Management
        (685, 541),  // Dep Dir: Revenue Management

        // Under CIO (543)
        (1568, 543), // Manager: Information Management Systems & Technology
        (2126, 543), // Senior Manager: CRM (Vacant)
        (19,   543), // Senior SCM Practitioner (Vacant)

        // Under Dep Dir: Expenditure & SCM (681)
        (18,   681), // Admin Officer (18)
        (1555, 681), // Manager: Contract Administration & SCM Compliance (Vacant)
        (1561, 681), // Manager: Expenditure
        (1580, 681), // Senior Manager: SCM

        // Under Dep Dir: Financial Management (682)
        (1548, 682), // Manager: Budgeting & Financial Management
        (1560, 682), // Manager: Executive Support Services (Vacant)
        (1563, 682), // Manager: Financial Reporting, Assets & Insurance

        // Under Dep Dir: Revenue Management (685)
        (21,   685), // Admin Officer (21)
        (1547, 685), // Manager: Billing Services
        (1556, 685), // Manager: Credit Control & Indigent Management
    };

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("OrgChartSeeder skipped (environment={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }

        var providerName = _db.Database.ProviderName ?? string.Empty;
        var isPostgres = providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase);
        if (!isPostgres)
        {
            _log.LogInformation("OrgChartSeeder skipped (provider={Provider}); production data is owned by Platinum Payroll.", providerName);
            return;
        }

        var ids = Edges.Select(e => e.ChildId).Concat(Edges.Select(e => e.ParentId)).Distinct().ToHashSet();
        var positions = await _db.Set<PayrollPosition>()
            .AsNoTracking()
            .Where(p => ids.Contains(p.PositionId))
            .ToDictionaryAsync(p => p.PositionId, p => p, ct);

        var missing = ids.Where(id => !positions.ContainsKey(id)).ToList();
        if (missing.Count > 0)
        {
            _log.LogWarning("OrgChartSeeder: {Count} positions missing from Payroll_Position ({Ids}); skipping seed.",
                missing.Count, string.Join(",", missing));
            return;
        }

        var now = DateTime.UtcNow;
        var startDate = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);

        var inserted = 0;
        var alreadyPresent = 0;
        var removed = 0;

        foreach (var edge in Edges)
        {
            var childIdStr  = edge.ChildId.ToString();
            var parentIdStr = edge.ParentId.ToString();
            var childPos    = positions[edge.ChildId];
            var parentPos   = positions[edge.ParentId];

            // ── Step 1: ensure a config exists for the PARENT ──────────────────
            var parentConfig = await _db.Set<PositionApprovalConfig>()
                .FirstOrDefaultAsync(c => c.PositionId == parentIdStr, ct);

            if (parentConfig is null)
            {
                parentConfig = new PositionApprovalConfig
                {
                    Id                                   = Guid.NewGuid(),
                    PositionId                           = parentIdStr,
                    PositionDescription                  = parentPos.PositionDesc ?? string.Empty,
                    IsOvertimeRecommender                = false,
                    IsOvertimeApprover                   = false,
                    IsDepartmentExcessOvertimeApprover   = false,
                    CreatedAt                            = now,
                    UpdatedAt                            = now,
                    UpdatedBy                            = "OrgChartSeeder"
                };
                _db.Set<PositionApprovalConfig>().Add(parentConfig);
                await _db.SaveChangesAsync(ct);
            }

            // ── Step 2: remove any wrong-direction row left by the old seeder ──
            //    Old seeder stored the relationship on the CHILD's config pointing
            //    UP to the parent.  Find that child config (if it exists) and
            //    delete the offending row so the UI doesn't show stale data.
            var childConfig = await _db.Set<PositionApprovalConfig>()
                .FirstOrDefaultAsync(c => c.PositionId == childIdStr, ct);

            if (childConfig is not null)
            {
                var wrongRows = await _db.Set<PositionReportingRelationship>()
                    .Where(r => r.PositionApprovalConfigId == childConfig.Id
                             && r.ReportsToPositionId == parentIdStr)
                    .ToListAsync(ct);

                if (wrongRows.Count > 0)
                {
                    _db.Set<PositionReportingRelationship>().RemoveRange(wrongRows);
                    await _db.SaveChangesAsync(ct);
                    removed += wrongRows.Count;
                }
            }

            // ── Step 3: insert the correct DOWNWARD row on the parent's config ─
            //    ReportsToPositionId = childIdStr means "childId reports to (is
            //    approved by) the owner of this config".
            var exists = await _db.Set<PositionReportingRelationship>()
                .AnyAsync(r => r.PositionApprovalConfigId == parentConfig.Id
                            && r.ReportsToPositionId == childIdStr, ct);

            if (exists)
            {
                alreadyPresent++;
                continue;
            }

            _db.Set<PositionReportingRelationship>().Add(new PositionReportingRelationship
            {
                Id                          = Guid.NewGuid(),
                PositionApprovalConfigId    = parentConfig.Id,
                ReportsToPositionId         = childIdStr,
                ReportsToPositionDescription = childPos.PositionDesc ?? string.Empty,
                StartDate                   = startDate,
                EndDate                     = null,
                CreatedAt                   = now,
                UpdatedAt                   = now
            });
            await _db.SaveChangesAsync(ct);
            inserted++;
        }

        _log.LogInformation(
            "OrgChartSeeder complete. Inserted {Inserted} relationships, {Skipped} already present, {Removed} wrong-direction rows removed.",
            inserted, alreadyPresent, removed);
    }
}
