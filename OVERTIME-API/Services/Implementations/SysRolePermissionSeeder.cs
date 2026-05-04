using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy Sys_RolePermission table exists
/// in the dev Postgres database and is populated from the supplied spreadsheet
/// (2 896 rows exported to SeedData/Sys_RolePermission.json).
/// In production (SQL Server) this seeder is a no-op — the real table is
/// owned by Platinum Payroll.
/// </summary>
public class SysRolePermissionSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<SysRolePermissionSeeder> _log;
    private readonly IHostEnvironment _host;

    public SysRolePermissionSeeder(
        OvertimeDbContext db,
        IWebHostEnvironment env,
        ILogger<SysRolePermissionSeeder> log,
        IHostEnvironment host)
    {
        _db = db; _env = env; _log = log; _host = host;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("SysRolePermissionSeeder skipped (env={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }
        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (!providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation("SysRolePermissionSeeder skipped (provider={Provider}); legacy table managed by Platinum Payroll.", providerName);
            return;
        }

        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Sys_RolePermission"" (
                ""PermissionID"" integer NOT NULL,
                ""RoleID""       integer NOT NULL,
                PRIMARY KEY (""PermissionID"", ""RoleID"")
            );
            CREATE INDEX IF NOT EXISTS ix_sys_role_permission_role
                ON ""Sys_RolePermission"" (""RoleID"");", ct);

        var rows = LoadSeedRows();
        var expected = rows.Count;
        var existing = await _db.Set<SysRolePermission>().CountAsync(ct);

        if (existing == expected)
        {
            _log.LogInformation("Sys_RolePermission already fully populated ({Count} rows); skipping seed.", existing);
            return;
        }
        if (existing > 0)
        {
            _log.LogWarning("Sys_RolePermission has {Existing} rows but seed file has {Expected}; rebuilding.",
                existing, expected);
            await _db.Database.ExecuteSqlRawAsync(@"TRUNCATE TABLE ""Sys_RolePermission"";", ct);
        }

        _log.LogInformation("Seeding Sys_RolePermission with {Count} rows...", expected);
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            const int batchSize = 500;
            for (int i = 0; i < rows.Count; i += batchSize)
            {
                var batch = rows.Skip(i).Take(batchSize).ToList();
                await _db.Set<SysRolePermission>().AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
            }
            await tx.CommitAsync(ct);
            _log.LogInformation("Sys_RolePermission seed complete ({Count} rows).", expected);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    private List<SysRolePermission> LoadSeedRows()
    {
        var seedFile = Path.Combine(_host.ContentRootPath, "SeedData", "Sys_RolePermission.json");
        if (!File.Exists(seedFile))
            throw new FileNotFoundException($"Seed data file not found: {seedFile}");

        var json = File.ReadAllText(seedFile);
        var pairs = JsonSerializer.Deserialize<int[][]>(json)
            ?? throw new InvalidDataException("Sys_RolePermission.json deserialized to null.");

        return pairs.Select(p => new SysRolePermission
        {
            PermissionId = p[0],
            RoleId = p[1]
        }).ToList();
    }
}
