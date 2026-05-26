using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy AAAA_ConfigSettings table
/// exists in the dev Postgres database and is populated from the supplied
/// spreadsheet. In production (SQL Server) this seeder is a no-op because
/// the real table is owned by Platinum Payroll.
///
/// DateCaptured is datetime in production. JSON seed export contains OADate
/// serial numbers; OADateJsonConverter handles conversion to DateTime.
/// perMuni_SetupRequirements is bit in production (not int).
/// </summary>
public class AAAAConfigSettingsSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AAAAConfigSettingsSeeder> _log;

    public AAAAConfigSettingsSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<AAAAConfigSettingsSeeder> log)
    {
        _db = db; _env = env; _log = log;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("AAAAConfigSettingsSeeder skipped (env={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }
        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (!providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation("AAAAConfigSettingsSeeder skipped (provider={Provider}); legacy table managed by Platinum Payroll.", providerName);
            return;
        }

        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""AAAA_ConfigSettings"" (
                ""ConfigSett_ID""              integer PRIMARY KEY,
                ""KeyName""                    varchar(200),
                ""KeyValue""                   varchar(2000),
                ""KeyDescription""             varchar(2000),
                ""Module""                     varchar(200),
                ""DateCaptured""               timestamp,
                ""CapturerID""                 integer,
                ""perMuni_SetupRequirements""  boolean
            );", ct);

        // Migrate existing table if columns were previously created with wrong types.
        await _db.Database.ExecuteSqlRawAsync(@"
            DO $$ BEGIN
                IF (SELECT data_type FROM information_schema.columns
                    WHERE table_name='AAAA_ConfigSettings' AND column_name='DateCaptured') = 'numeric' THEN
                    EXECUTE 'ALTER TABLE ""AAAA_ConfigSettings"" ALTER COLUMN ""DateCaptured""             TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""AAAA_ConfigSettings"" ALTER COLUMN ""perMuni_SetupRequirements"" TYPE boolean USING NULL';
                    EXECUTE 'TRUNCATE TABLE ""AAAA_ConfigSettings""';
                END IF;
                IF (SELECT data_type FROM information_schema.columns
                    WHERE table_name='AAAA_ConfigSettings' AND column_name='perMuni_SetupRequirements') = 'integer' THEN
                    EXECUTE 'ALTER TABLE ""AAAA_ConfigSettings"" ALTER COLUMN ""perMuni_SetupRequirements"" TYPE boolean USING NULL';
                    EXECUTE 'TRUNCATE TABLE ""AAAA_ConfigSettings""';
                END IF;
            END $$;", ct);

        var path = Path.Combine(_env.ContentRootPath, "Data", "SeedData", "aaaa_config_settings.json");
        if (!File.Exists(path))
        {
            _log.LogWarning("AAAA_ConfigSettings seed file not found at {Path}; nothing seeded.", path);
            return;
        }

        var opts = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new OADateJsonConverter(), new NullableIntToBoolJsonConverter() }
        };

        await using var fs = File.OpenRead(path);
        var rows = await JsonSerializer.DeserializeAsync<List<AAAAConfigSettings>>(fs, opts, ct) ?? new List<AAAAConfigSettings>();
        if (rows.Count == 0)
        {
            _log.LogWarning("AAAA_ConfigSettings seed file at {Path} contained no rows.", path);
            return;
        }

        var existing = await _db.Set<AAAAConfigSettings>().CountAsync(ct);
        if (existing == rows.Count)
        {
            _log.LogInformation("AAAA_ConfigSettings already fully populated ({Count} rows); skipping seed.", existing);
            return;
        }
        if (existing > 0)
        {
            _log.LogWarning("AAAA_ConfigSettings has {Existing} rows but seed file has {Expected}; rebuilding.",
                existing, rows.Count);
            await _db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"AAAA_ConfigSettings\";", ct);
        }

        _log.LogInformation("Seeding AAAA_ConfigSettings with {Count} rows...", rows.Count);
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            const int batchSize = 500;
            for (var i = 0; i < rows.Count; i += batchSize)
            {
                var batch = rows.Skip(i).Take(batchSize).ToList();
                await _db.Set<AAAAConfigSettings>().AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
                _db.ChangeTracker.Clear();
            }

            var final = await _db.Set<AAAAConfigSettings>().CountAsync(ct);
            if (final != rows.Count)
                throw new InvalidOperationException(
                    $"AAAA_ConfigSettings seed integrity check failed: inserted {final}, expected {rows.Count}.");
            await tx.CommitAsync(ct);
            _log.LogInformation("AAAA_ConfigSettings seed complete ({Count} rows).", rows.Count);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
