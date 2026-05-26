using System.Text.Json;
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

        var path = Path.Combine(_env.ContentRootPath, "Data", "SeedData", "user_user_roles.json");
        if (!File.Exists(path))
        {
            _log.LogWarning("User_UserRoles seed file not found at {Path}; nothing seeded.", path);
            return;
        }

        await using var fs = File.OpenRead(path);
        var rows = await JsonSerializer.DeserializeAsync<List<UserUserRole>>(fs,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct) ?? new List<UserUserRole>();

        if (rows.Count == 0)
        {
            _log.LogWarning("User_UserRoles seed file at {Path} contained no rows.", path);
            return;
        }

        var existing = await _db.Set<UserUserRole>().CountAsync(ct);
        if (existing == rows.Count)
        {
            _log.LogInformation("User_UserRoles already fully populated ({Count} rows); skipping seed.", existing);
            return;
        }
        if (existing > 0)
        {
            _log.LogWarning("User_UserRoles has {Existing} rows but seed file has {Expected}; rebuilding.",
                existing, rows.Count);
            await _db.Database.ExecuteSqlRawAsync(@"TRUNCATE TABLE ""User_UserRoles"";", ct);
        }

        _log.LogInformation("Seeding User_UserRoles with {Count} rows...", rows.Count);
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            const int batchSize = 500;
            for (var i = 0; i < rows.Count; i += batchSize)
            {
                var batch = rows.Skip(i).Take(batchSize).ToList();
                await _db.Set<UserUserRole>().AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
                _db.ChangeTracker.Clear();
            }
            var final = await _db.Set<UserUserRole>().CountAsync(ct);
            if (final != rows.Count)
                throw new InvalidOperationException(
                    $"User_UserRoles seed integrity check failed: inserted {final}, expected {rows.Count}.");
            await tx.CommitAsync(ct);
            _log.LogInformation("User_UserRoles seed complete ({Count} rows).", rows.Count);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
