using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Repositories.Interfaces;

namespace PlatinumOvertime_API.Repositories.Implementations;

public class OvertimeConfigRepository : IOvertimeConfigRepository
{
    private readonly OvertimeDbContext _db;
    public OvertimeConfigRepository(OvertimeDbContext db) => _db = db;

    public async Task<OvertimeConfig?> GetAsync(CancellationToken ct = default) =>
        await _db.OvertimeConfig.AsNoTracking().FirstOrDefaultAsync(ct);

    public async Task<OvertimeConfig> UpsertAsync(OvertimeConfig incoming, CancellationToken ct = default)
    {
        var existing = await _db.OvertimeConfig.FirstOrDefaultAsync(ct);
        if (existing is null)
        {
            incoming.CreatedAt = DateTime.UtcNow;
            incoming.UpdatedAt = DateTime.UtcNow;
            _db.OvertimeConfig.Add(incoming);
            await _db.SaveChangesAsync(ct);
            return incoming;
        }

        existing.AllowOvertimeMultipleApproval = incoming.AllowOvertimeMultipleApproval;
        existing.StartDate = incoming.StartDate;
        existing.CountingPeriodStartDay = incoming.CountingPeriodStartDay;
        existing.CountingPeriodEndDay = incoming.CountingPeriodEndDay;
        existing.MaximumMonthlyOvertimeHours = incoming.MaximumMonthlyOvertimeHours;
        existing.ExceptionalMaximumOvertimeHours = incoming.ExceptionalMaximumOvertimeHours;
        existing.UpdatedBy = incoming.UpdatedBy;
        existing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return existing;
    }
}
