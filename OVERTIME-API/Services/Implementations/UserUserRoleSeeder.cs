using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy User_UserRoles table exists
/// in the dev Postgres database and is populated from the supplied spreadsheet.
/// In production (SQL Server) this seeder is a no-op — the real table is
/// owned by Platinum Payroll.
/// </summary>
public class UserUserRoleSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<UserUserRoleSeeder> _log;

    public UserUserRoleSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<UserUserRoleSeeder> log)
    {
        _db = db; _env = env; _log = log;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("UserUserRoleSeeder skipped (env={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }
        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (!providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation("UserUserRoleSeeder skipped (provider={Provider}); legacy table managed by Platinum Payroll.", providerName);
            return;
        }

        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""User_UserRoles"" (
                ""UserID""              integer NOT NULL,
                ""RoleID""              integer NOT NULL,
                ""DelegatedByUserID""   integer,
                ""DelegationStart""     timestamp,
                ""DelegationExpiry""    timestamp,
                PRIMARY KEY (""UserID"", ""RoleID"")
            );
            CREATE INDEX IF NOT EXISTS ix_user_user_roles_user
                ON ""User_UserRoles"" (""UserID"");", ct);

        var existing = await _db.Set<UserUserRole>().CountAsync(ct);
        if (existing == _seedRows.Count)
        {
            _log.LogInformation("User_UserRoles already fully populated ({Count} rows); skipping seed.", existing);
            return;
        }
        if (existing > 0)
        {
            _log.LogWarning("User_UserRoles has {Existing} rows but seed file has {Expected}; rebuilding.",
                existing, _seedRows.Count);
            await _db.Database.ExecuteSqlRawAsync(@"TRUNCATE TABLE ""User_UserRoles"";", ct);
        }

        _log.LogInformation("Seeding User_UserRoles with {Count} rows...", _seedRows.Count);
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            await _db.Set<UserUserRole>().AddRangeAsync(_seedRows, ct);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            _log.LogInformation("User_UserRoles seed complete ({Count} rows).", _seedRows.Count);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    private static readonly List<UserUserRole> _seedRows = new()
    {
        new() { UserId = 4266, RoleId = 2071 },
        new() { UserId = 4266, RoleId = 2103 },
        new() { UserId = 4268, RoleId = 37   },
        new() { UserId = 4273, RoleId = 14   },
        new() { UserId = 4273, RoleId = 2071 },
        new() { UserId = 4274, RoleId = 2071 },
        new() { UserId = 4274, RoleId = 2072 },
        new() { UserId = 4274, RoleId = 2202 },
        new() { UserId = 4292, RoleId = 24   },
        new() { UserId = 4292, RoleId = 1052 },
        new() { UserId = 4292, RoleId = 1053 },
        new() { UserId = 4292, RoleId = 2071 },
        new() { UserId = 4302, RoleId = 2071 },
        new() { UserId = 4302, RoleId = 2128 },
        new() { UserId = 4304, RoleId = 2125 },
        new() { UserId = 4305, RoleId = 2071 },
        new() { UserId = 4305, RoleId = 2126 },
        new() { UserId = 4305, RoleId = 2128 },
        new() { UserId = 4527, RoleId = 2125 },
    };
}
