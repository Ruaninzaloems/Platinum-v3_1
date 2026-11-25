using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Repositories.Interfaces;

namespace PlatinumOvertime_API.Repositories.Implementations;

public class PositionApprovalRepository : IPositionApprovalRepository
{
    private readonly OvertimeDbContext _db;
    public PositionApprovalRepository(OvertimeDbContext db) => _db = db;

    public async Task<PositionApprovalConfig?> GetByPositionIdAsync(string positionId, CancellationToken ct = default) =>
        await _db.PositionApprovalConfigs
            .Include(p => p.ReportingRelationships)
            .Include(p => p.ActingAppointments)
            .FirstOrDefaultAsync(p => p.PositionId == positionId, ct);

    public async Task<List<PositionApprovalConfig>> GetAllAsync(CancellationToken ct = default) =>
        await _db.PositionApprovalConfigs
            .AsNoTracking()
            .Include(p => p.ReportingRelationships)
            .Include(p => p.ActingAppointments)
            .ToListAsync(ct);

    public async Task<HashSet<string>> GetConfiguredPositionIdsAsync(CancellationToken ct = default)
    {
        var ids = await _db.PositionApprovalConfigs
            .AsNoTracking()
            .Select(p => p.PositionId)
            .ToListAsync(ct);
        return new HashSet<string>(ids, StringComparer.OrdinalIgnoreCase);
    }

    public async Task<int> BatchUpsertInTransactionAsync(IEnumerable<PositionApprovalConfig> configs, CancellationToken ct = default)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            int count = 0;
            foreach (var config in configs)
            {
                var existing = await _db.PositionApprovalConfigs
                    .Include(p => p.ReportingRelationships)
                    .Include(p => p.ActingAppointments)
                    .FirstOrDefaultAsync(p => p.PositionId == config.PositionId, ct);

                if (existing is null)
                {
                    ValidateActingAppointments(config.ActingAppointments, config.PositionId);
                    config.CreatedAt = DateTime.UtcNow;
                    config.UpdatedAt = DateTime.UtcNow;
                    _db.PositionApprovalConfigs.Add(config);
                }
                else
                {
                    ValidateActingAppointments(config.ActingAppointments, existing.PositionId);

                    existing.PositionDescription = config.PositionDescription;
                    existing.IsOvertimeRecommender = config.IsOvertimeRecommender;
                    existing.IsOvertimeApprover = config.IsOvertimeApprover;
                    existing.IsDepartmentExcessOvertimeApprover = config.IsDepartmentExcessOvertimeApprover;
                    existing.UpdatedBy = config.UpdatedBy;
                    existing.UpdatedAt = DateTime.UtcNow;

                    // Delete via DbSet so EF keeps them in the Deleted state.
                    // Reassigning the navigation property after RemoveRange detaches
                    // the Deleted entities → SaveChanges sees 0 rows affected →
                    // DbUpdateConcurrencyException. Add new children via DbSet too.
                    _db.PositionReportingRelationships.RemoveRange(existing.ReportingRelationships);
                    _db.TemporaryActingAppointments.RemoveRange(existing.ActingAppointments);
                    foreach (var r in config.ReportingRelationships)
                    {
                        r.Id = Guid.NewGuid();
                        r.PositionApprovalConfigId = existing.Id;
                        _db.PositionReportingRelationships.Add(r);
                    }
                    foreach (var a in config.ActingAppointments)
                    {
                        a.Id = Guid.NewGuid();
                        a.PositionApprovalConfigId = existing.Id;
                        _db.TemporaryActingAppointments.Add(a);
                    }
                }

                count++;
            }

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return count;
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<PositionApprovalConfig> UpsertAsync(PositionApprovalConfig config, CancellationToken ct = default)
    {
        var existing = await _db.PositionApprovalConfigs
            .Include(p => p.ReportingRelationships)
            .Include(p => p.ActingAppointments)
            .FirstOrDefaultAsync(p => p.PositionId == config.PositionId, ct);

        if (existing is null)
        {
            ValidateActingAppointments(config.ActingAppointments, config.PositionId);
            config.CreatedAt = DateTime.UtcNow;
            config.UpdatedAt = DateTime.UtcNow;
            _db.PositionApprovalConfigs.Add(config);
            await _db.SaveChangesAsync(ct);
            return config;
        }

        ValidateActingAppointments(config.ActingAppointments, existing.PositionId);

        existing.PositionDescription = config.PositionDescription;
        existing.IsOvertimeRecommender = config.IsOvertimeRecommender;
        existing.IsOvertimeApprover = config.IsOvertimeApprover;
        existing.IsDepartmentExcessOvertimeApprover = config.IsDepartmentExcessOvertimeApprover;
        existing.UpdatedBy = config.UpdatedBy;
        existing.UpdatedAt = DateTime.UtcNow;

        // Delete via DbSet so EF keeps them in the Deleted state.
        // Reassigning the navigation property after RemoveRange detaches
        // the Deleted entities → SaveChanges sees 0 rows affected →
        // DbUpdateConcurrencyException. Add new children via DbSet too.
        _db.PositionReportingRelationships.RemoveRange(existing.ReportingRelationships);
        _db.TemporaryActingAppointments.RemoveRange(existing.ActingAppointments);
        foreach (var r in config.ReportingRelationships)
        {
            r.Id = Guid.NewGuid();
            r.PositionApprovalConfigId = existing.Id;
            _db.PositionReportingRelationships.Add(r);
        }
        foreach (var a in config.ActingAppointments)
        {
            a.Id = Guid.NewGuid();
            a.PositionApprovalConfigId = existing.Id;
            _db.TemporaryActingAppointments.Add(a);
        }

        await _db.SaveChangesAsync(ct);
        return existing;
    }

    /// <summary>
    /// Enforces the invariant: every TemporaryActingAppointment stored under a
    /// PositionApprovalConfig must have ActingInPositionId equal to that
    /// config's PositionId.  The PositionApprovalConfigId FK is derived from
    /// this relationship; if the two diverge, the acting badge resolution in
    /// AssigneeResolverService will silently fail.
    /// </summary>
    private static void ValidateActingAppointments(
        IEnumerable<TemporaryActingAppointment> appointments,
        string configPositionId)
    {
        foreach (var a in appointments)
        {
            if (!string.Equals(a.ActingInPositionId, configPositionId, StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException(
                    $"Acting appointment has ActingInPositionId '{a.ActingInPositionId}' but is being saved " +
                    $"under config for position '{configPositionId}'. These must match: the appointment must " +
                    $"belong to the PositionApprovalConfig for the position being acted into.");
        }
    }
}
