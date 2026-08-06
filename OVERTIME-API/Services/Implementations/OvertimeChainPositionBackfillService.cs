using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// One-time backfill that populates the chain-position snapshot columns
/// (RecommenderChainPositionId/Name, ApproverChainPositionId/Name) on
/// OvertimeTransaction rows that were created before the snapshot was
/// introduced.
///
/// Without these columns filled, ToDto falls back to each assignee's
/// home position — which is wrong when an acting employee filled the seat
/// at capture time.
///
/// Safe to run repeatedly: only rows where BOTH chain columns are NULL are
/// touched. Once filled they are never overwritten by this service.
/// </summary>
public class OvertimeChainPositionBackfillService
{
    private readonly OvertimeDbContext _db;
    private readonly IAssigneeResolverService _resolver;
    private readonly ILogger<OvertimeChainPositionBackfillService> _log;

    public OvertimeChainPositionBackfillService(
        OvertimeDbContext db,
        IAssigneeResolverService resolver,
        ILogger<OvertimeChainPositionBackfillService> log)
    {
        _db = db; _resolver = resolver; _log = log;
    }

    public async Task BackfillAsync(CancellationToken ct = default)
    {
        // Find all transactions that are missing both chain-position columns.
        // We check BOTH being null so a partially-filled row (one column set,
        // one null) is not silently overwritten — it would indicate a data
        // anomaly that deserves separate investigation.
        var rows = await _db.OvertimeTransactions
            .Where(t => t.RecommenderChainPositionId == null
                     && t.ApproverChainPositionId == null
                     && t.PositionId != null)
            .Select(t => new { t.Id, t.PositionId })
            .ToListAsync(ct);

        if (rows.Count == 0)
        {
            _log.LogInformation("OvertimeChainPositionBackfill: nothing to backfill.");
            return;
        }

        _log.LogInformation(
            "OvertimeChainPositionBackfill: {Count} transaction(s) need backfill.", rows.Count);

        // Group by PositionId so the resolver is called once per unique position
        // rather than once per transaction — the graph walk is the expensive part.
        var byPosition = rows
            .GroupBy(r => r.PositionId!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Select(r => r.Id).ToList(),
                          StringComparer.OrdinalIgnoreCase);

        var resolvedCount = 0;
        var skippedCount  = 0;

        foreach (var (positionId, txIds) in byPosition)
        {
            AssigneeBundle bundle;
            try
            {
                bundle = await _resolver.ResolveAsync(positionId, ct: ct);
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex,
                    "OvertimeChainPositionBackfill: resolver failed for positionId={PositionId}, skipping {Count} row(s).",
                    positionId, txIds.Count);
                skippedCount += txIds.Count;
                continue;
            }

            // If the resolver returned no useful chain position data for this
            // position there is nothing to write — skip silently so we do not
            // overwrite NULL with NULL and then re-visit the same rows forever.
            if (string.IsNullOrWhiteSpace(bundle.RecommenderPositionId)
             && string.IsNullOrWhiteSpace(bundle.ApproverPositionId))
            {
                _log.LogDebug(
                    "OvertimeChainPositionBackfill: resolver returned no chain positions for positionId={PositionId}, skipping {Count} row(s).",
                    positionId, txIds.Count);
                skippedCount += txIds.Count;
                continue;
            }

            // Load and update the matching transactions in one EF query per group.
            var txBatch = await _db.OvertimeTransactions
                .Where(t => txIds.Contains(t.Id))
                .ToListAsync(ct);

            foreach (var tx in txBatch)
            {
                tx.RecommenderChainPositionId   = bundle.RecommenderPositionId;
                tx.RecommenderChainPositionName = bundle.RecommenderPositionDescription;
                tx.ApproverChainPositionId      = bundle.ApproverPositionId;
                tx.ApproverChainPositionName    = bundle.ApproverPositionDescription;
            }

            await _db.SaveChangesAsync(ct);
            resolvedCount += txBatch.Count;

            _log.LogDebug(
                "OvertimeChainPositionBackfill: positionId={PositionId} → recommender={RecPos} approver={AppPos} ({Count} row(s) updated).",
                positionId,
                bundle.RecommenderPositionDescription ?? bundle.RecommenderPositionId ?? "(none)",
                bundle.ApproverPositionDescription    ?? bundle.ApproverPositionId    ?? "(none)",
                txBatch.Count);
        }

        _log.LogInformation(
            "OvertimeChainPositionBackfill complete: {Resolved} updated, {Skipped} skipped.",
            resolvedCount, skippedCount);
    }
}
