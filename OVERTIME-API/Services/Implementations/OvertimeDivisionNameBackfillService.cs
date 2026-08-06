using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// One-time backfill that populates the DivisionName column on
/// OvertimeTransaction rows that were created before the column was added.
///
/// The division is resolved by joining Payroll_Position → Const_Division
/// on the transaction's snapshotted PositionId — the same lookup performed
/// at create time going forward.
///
/// Safe to run repeatedly: only rows where DivisionName IS NULL are touched.
/// </summary>
public class OvertimeDivisionNameBackfillService
{
    private readonly OvertimeDbContext _db;
    private readonly ILogger<OvertimeDivisionNameBackfillService> _log;

    public OvertimeDivisionNameBackfillService(
        OvertimeDbContext db,
        ILogger<OvertimeDivisionNameBackfillService> log)
    { _db = db; _log = log; }

    public async Task BackfillAsync(CancellationToken ct = default)
    {
        // Only rows with a parseable PositionId and a null DivisionName need work.
        var rows = await _db.OvertimeTransactions
            .Where(t => t.DivisionName == null && t.PositionId != null && t.PositionId != "")
            .Select(t => new { t.Id, t.PositionId })
            .ToListAsync(ct);

        if (rows.Count == 0)
        {
            _log.LogInformation("OvertimeDivisionNameBackfill: nothing to backfill.");
            return;
        }

        _log.LogInformation(
            "OvertimeDivisionNameBackfill: {Count} transaction(s) need backfill.", rows.Count);

        // Build a lookup: positionId (int) → divisionName, for all distinct positions
        // in a single query rather than one query per row.
        var parsedPositions = rows
            .Select(r => r.PositionId)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(pid => int.TryParse(pid, out var n) ? (int?)n : null)
            .Where(n => n.HasValue)
            .Select(n => n!.Value)
            .ToList();

        if (parsedPositions.Count == 0)
        {
            _log.LogInformation("OvertimeDivisionNameBackfill: no parseable PositionIds, skipping.");
            return;
        }

        var divisionByPositionId = await (
            from pos in _db.PayrollPositions
            join div in _db.ConstDivisions on pos.DivisionId equals div.DivisionId
            where parsedPositions.Contains(pos.PositionId)
            select new { pos.PositionId, DivisionName = div.DivisionDesc })
            .ToDictionaryAsync(x => x.PositionId, x => x.DivisionName, ct);

        // Group transactions by PositionId so we do one SaveChanges call per batch.
        var byPosition = rows
            .GroupBy(r => r.PositionId!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Select(r => r.Id).ToList(),
                          StringComparer.OrdinalIgnoreCase);

        var updated = 0;
        var skipped = 0;

        foreach (var (positionId, txIds) in byPosition)
        {
            if (!int.TryParse(positionId, out var posInt)
             || !divisionByPositionId.TryGetValue(posInt, out var divName)
             || string.IsNullOrWhiteSpace(divName))
            {
                skipped += txIds.Count;
                continue;
            }

            var txBatch = await _db.OvertimeTransactions
                .Where(t => txIds.Contains(t.Id))
                .ToListAsync(ct);

            foreach (var tx in txBatch)
                tx.DivisionName = divName;

            await _db.SaveChangesAsync(ct);
            updated += txBatch.Count;
        }

        _log.LogInformation(
            "OvertimeDivisionNameBackfill complete: {Updated} updated, {Skipped} skipped.",
            updated, skipped);
    }
}
