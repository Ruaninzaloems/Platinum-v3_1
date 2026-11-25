using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace PlatinumOvertime_API.Data;

/// <summary>
/// `dotnet ef` invocations construct the context through these factories at
/// design time so connection strings and provider plumbing are hard-wired and
/// don't depend on the application's runtime configuration.
/// </summary>
public class OvertimeDbContextPostgresDesignTimeFactory
    : IDesignTimeDbContextFactory<OvertimeDbContextPostgres>
{
    public OvertimeDbContextPostgres CreateDbContext(string[] args)
    {
        var conn = Environment.GetEnvironmentVariable("DESIGN_TIME_PG_CONN")
                   ?? "Host=localhost;Port=5432;Database=platinum_overtime;Username=postgres;Password=postgres";
        var opts = new DbContextOptionsBuilder<OvertimeDbContextPostgres>()
            .UseNpgsql(conn, npg => npg.MigrationsAssembly(typeof(OvertimeDbContextPostgres).Assembly.FullName))
            .Options;
        return new OvertimeDbContextPostgres(opts);
    }
}

public class OvertimeDbContextSqlServerDesignTimeFactory
    : IDesignTimeDbContextFactory<OvertimeDbContextSqlServer>
{
    public OvertimeDbContextSqlServer CreateDbContext(string[] args)
    {
        var conn = Environment.GetEnvironmentVariable("DESIGN_TIME_MSSQL_CONN")
                   ?? "Server=(localdb)\\MSSQLLocalDB;Database=PlatinumOvertime;Trusted_Connection=True;TrustServerCertificate=True;";
        var opts = new DbContextOptionsBuilder<OvertimeDbContextSqlServer>()
            .UseSqlServer(conn, mssql => mssql.MigrationsAssembly(typeof(OvertimeDbContextSqlServer).Assembly.FullName))
            .Options;
        return new OvertimeDbContextSqlServer(opts);
    }
}
