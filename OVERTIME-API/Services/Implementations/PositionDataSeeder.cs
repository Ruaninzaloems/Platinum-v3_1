using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy Payroll_Position table exists
/// in the dev Postgres database and is populated with the 4,895-row dataset
/// supplied by the customer. In production (SQL Server) this seeder is a
/// no-op because the real Payroll_Position table is owned by Platinum Payroll
/// and is already populated.
/// </summary>
public class PositionDataSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<PositionDataSeeder> _log;

    public PositionDataSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<PositionDataSeeder> log)
    {
        _db = db;
        _env = env;
        _log = log;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        // Hard guard: never seed outside Development. Even if someone points a
        // dev Postgres connection at a non-dev environment, we refuse to write.
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("PositionDataSeeder skipped (environment={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }

        var providerName = _db.Database.ProviderName ?? string.Empty;
        var isPostgres = providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase);
        if (!isPostgres)
        {
            _log.LogInformation("PositionDataSeeder skipped (provider={Provider}); legacy table is managed by Platinum Payroll.", providerName);
            return;
        }

        // ExcludeFromMigrations means we own table creation here for dev only.
        // Column names match the legacy production SQL Server schema exactly so
        // queries written against either provider behave identically.
        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Payroll_Position"" (
                ""Position_ID""   integer PRIMARY KEY,
                ""PositionDesc""  varchar(500),
                ""PositionCode""  varchar(64),
                ""DepartmentID""  integer,
                ""DivisionID""    integer,
                ""JobProfileID""  integer,
                ""Status""        integer,
                ""Enabled""       integer,
                ""ParentID""      integer,
                ""EmployeeID""    varchar(64),
                ""HOD""           integer,
                ""HierarchyNo""   integer,
                ""UniqueId""      varchar(64)
            );", ct);

        var path = Path.Combine(_env.ContentRootPath, "Data", "SeedData", "payroll_positions.json");
        if (!File.Exists(path))
        {
            _log.LogWarning("Payroll_Position seed file not found at {Path}; nothing seeded.", path);
            return;
        }

        await using var fs = File.OpenRead(path);
        var rows = await JsonSerializer.DeserializeAsync<List<PayrollPosition>>(fs,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct) ?? new List<PayrollPosition>();

        if (rows.Count == 0)
        {
            _log.LogWarning("Payroll_Position seed file at {Path} contained no rows.", path);
            return;
        }

        // Idempotency: only skip when the existing row count matches the seed
        // file exactly. A partial seed from a previous failed startup will
        // therefore re-run instead of being silently accepted.
        var existingCount = await _db.Set<PayrollPosition>().CountAsync(ct);
        if (existingCount == rows.Count)
        {
            _log.LogInformation("Payroll_Position already fully populated ({Count} rows); skipping seed.", existingCount);
            return;
        }
        if (existingCount > 0)
        {
            _log.LogWarning("Payroll_Position has {Existing} rows but seed file has {Expected}; rebuilding.",
                existingCount, rows.Count);
            await _db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Payroll_Position\";", ct);
        }

        _log.LogInformation("Seeding Payroll_Position with {Count} rows...", rows.Count);

        // Wrap the whole seed in a single transaction so any failure rolls
        // back and the next startup will retry from a clean slate.
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            const int batchSize = 500;
            for (var i = 0; i < rows.Count; i += batchSize)
            {
                var batch = rows.Skip(i).Take(batchSize).ToList();
                await _db.Set<PayrollPosition>().AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
                _db.ChangeTracker.Clear();
            }

            // Integrity check before commit.
            var finalCount = await _db.Set<PayrollPosition>().CountAsync(ct);
            if (finalCount != rows.Count)
            {
                throw new InvalidOperationException(
                    $"Payroll_Position seed integrity check failed: inserted {finalCount}, expected {rows.Count}.");
            }

            await tx.CommitAsync(ct);
            _log.LogInformation("Payroll_Position seed complete ({Count} rows).", rows.Count);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
