using Microsoft.EntityFrameworkCore;

namespace PlatinumOvertime_API.Data;

/// <summary>
/// Postgres-targeted variant. Used at runtime in Development and as the
/// design-time context for `dotnet ef migrations add ... --context OvertimeDbContextPostgres`.
/// Migrations live under Data/Migrations/Postgres/.
/// </summary>
public class OvertimeDbContextPostgres : OvertimeDbContext
{
    public OvertimeDbContextPostgres(DbContextOptions<OvertimeDbContextPostgres> options) : base(options) { }
}
