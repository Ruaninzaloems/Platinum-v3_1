using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy Const_Cycle table exists in
/// the dev Postgres database and is populated from the supplied spreadsheet.
/// In production (SQL Server) this seeder is a no-op because the real table
/// is owned by Platinum Payroll.
/// </summary>
public class ConstCycleSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ConstCycleSeeder> _log;

    public ConstCycleSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<ConstCycleSeeder> log)
    {
        _db = db; _env = env; _log = log;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("ConstCycleSeeder skipped (env={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }
        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (!providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation("ConstCycleSeeder skipped (provider={Provider}); legacy table managed by Platinum Payroll.", providerName);
            return;
        }

        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Const_Cycle"" (
                ""Cycle_ID""           integer PRIMARY KEY,
                ""CycleDesc""          varchar(500),
                ""Enabled""            boolean,
                ""DateCaptured""       decimal(18,8),
                ""CapturerID""         integer,
                ""DateModified""       decimal(18,8),
                ""ModifierID""         integer,
                ""CycleTypeID""        integer,
                ""SkipInNewTaxYear""   boolean
            );", ct);

        var path = Path.Combine(_env.ContentRootPath, "Data", "SeedData", "const_cycle.json");
        if (!File.Exists(path))
        {
            _log.LogWarning("Const_Cycle seed file not found at {Path}; nothing seeded.", path);
            return;
        }

        await using var fs = File.OpenRead(path);
        var rows = await JsonSerializer.DeserializeAsync<List<ConstCycle>>(fs,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct) ?? new List<ConstCycle>();
        if (rows.Count == 0)
        {
            _log.LogWarning("Const_Cycle seed file at {Path} contained no rows.", path);
            return;
        }

        var existing = await _db.Set<ConstCycle>().CountAsync(ct);
        if (existing == rows.Count)
        {
            _log.LogInformation("Const_Cycle already fully populated ({Count} rows); skipping seed.", existing);
            return;
        }
        if (existing > 0)
        {
            _log.LogWarning("Const_Cycle has {Existing} rows but seed file has {Expected}; rebuilding.",
                existing, rows.Count);
            await _db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Const_Cycle\";", ct);
        }

        _log.LogInformation("Seeding Const_Cycle with {Count} rows...", rows.Count);
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            const int batchSize = 500;
            for (var i = 0; i < rows.Count; i += batchSize)
            {
                var batch = rows.Skip(i).Take(batchSize).ToList();
                await _db.Set<ConstCycle>().AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
                _db.ChangeTracker.Clear();
            }

            var final = await _db.Set<ConstCycle>().CountAsync(ct);
            if (final != rows.Count)
                throw new InvalidOperationException(
                    $"Const_Cycle seed integrity check failed: inserted {final}, expected {rows.Count}.");
            await tx.CommitAsync(ct);
            _log.LogInformation("Const_Cycle seed complete ({Count} rows).", rows.Count);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
