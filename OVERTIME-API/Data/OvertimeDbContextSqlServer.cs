using Microsoft.EntityFrameworkCore;

namespace PlatinumOvertime_API.Data;

/// <summary>
/// SQL-Server-targeted variant. Canonical migration source for production.
///   dotnet ef migrations add ... --context OvertimeDbContextSqlServer
///       --output-dir Data/Migrations/SqlServer
///   dotnet ef migrations script --context OvertimeDbContextSqlServer --idempotent
///       --output ../database/sqlserver/001_initial.sql
/// Migrations live under Data/Migrations/SqlServer/.
/// </summary>
public class OvertimeDbContextSqlServer : OvertimeDbContext
{
    public OvertimeDbContextSqlServer(DbContextOptions<OvertimeDbContextSqlServer> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Explicitly pin every DateTime column to datetime2 on SQL Server.
        // Without this, schema tools and some drivers default to datetimeoffset,
        // which causes InvalidCastException when EF reads into DateTime properties.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                {
                    property.SetColumnType("datetime2");
                }
            }
        }
    }
}
