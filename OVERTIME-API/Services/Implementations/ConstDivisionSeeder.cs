using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy Const_Division table exists
/// in the dev Postgres database and is populated from the supplied
/// spreadsheet. In production (SQL Server) this seeder is a no-op because
/// the real table is owned by Platinum Payroll. Run after
/// <see cref="ConstDepartmentSeeder"/> so DepartmentID references resolve.
///
/// All date columns are datetime in production. JSON seed export contains
/// OADate serial numbers; OADateJsonConverter handles conversion to DateTime.
/// DirectorateLevel is bit in production (not int).
/// </summary>
public class ConstDivisionSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ConstDivisionSeeder> _log;

    public ConstDivisionSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<ConstDivisionSeeder> log)
    {
        _db = db; _env = env; _log = log;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("ConstDivisionSeeder skipped (env={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }
        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (!providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation("ConstDivisionSeeder skipped (provider={Provider}); legacy table managed by Platinum Payroll.", providerName);
            return;
        }

        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Const_Division"" (
                ""Division_ID""             integer PRIMARY KEY,
                ""DivisionDesc""            varchar(500),
                ""DivisionCode""            varchar(64),
                ""DepartmentID""            integer,
                ""DivisionParentID""        integer,
                ""Enabled""                 boolean,
                ""DateCaptured""            timestamp,
                ""CapturerID""              integer,
                ""DateModified""            timestamp,
                ""ModifierID""              integer,
                ""SCOAFunctionID""          integer,
                ""HRPayrollSCOAFundID""     integer,
                ""StartDate""               timestamp,
                ""EndDate""                 timestamp,
                ""RegionID""                integer,
                ""ProjectID""               integer,
                ""ManagerPositionID""       integer,
                ""ManagerStartDate""        timestamp,
                ""ManagerEndDate""          timestamp,
                ""ConditionOfServiceID""    integer,
                ""DirectorateLevel""        boolean,
                ""FinYear""                 varchar(32)
            );
            CREATE INDEX IF NOT EXISTS ix_const_division_dept
                ON ""Const_Division"" (""DepartmentID"");", ct);

        // Migrate existing table if columns were previously created with wrong types.
        await _db.Database.ExecuteSqlRawAsync(@"
            DO $$ BEGIN
                IF (SELECT data_type FROM information_schema.columns
                    WHERE table_name='Const_Division' AND column_name='DateCaptured') = 'numeric' THEN
                    EXECUTE 'ALTER TABLE ""Const_Division"" ALTER COLUMN ""DateCaptured""    TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Const_Division"" ALTER COLUMN ""DateModified""    TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Const_Division"" ALTER COLUMN ""StartDate""       TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Const_Division"" ALTER COLUMN ""EndDate""         TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Const_Division"" ALTER COLUMN ""ManagerStartDate"" TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Const_Division"" ALTER COLUMN ""ManagerEndDate""  TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Const_Division"" ALTER COLUMN ""DirectorateLevel"" TYPE boolean USING NULL';
                    EXECUTE 'TRUNCATE TABLE ""Const_Division""';
                END IF;
            END $$;", ct);

        var path = Path.Combine(_env.ContentRootPath, "Data", "SeedData", "const_division.json");
        if (!File.Exists(path))
        {
            _log.LogWarning("Const_Division seed file not found at {Path}; nothing seeded.", path);
            return;
        }

        var opts = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new OADateJsonConverter() }
        };

        await using var fs = File.OpenRead(path);
        var rows = await JsonSerializer.DeserializeAsync<List<ConstDivision>>(fs, opts, ct) ?? new List<ConstDivision>();
        if (rows.Count == 0)
        {
            _log.LogWarning("Const_Division seed file at {Path} contained no rows.", path);
            return;
        }

        var existing = await _db.Set<ConstDivision>().CountAsync(ct);
        if (existing == rows.Count)
        {
            _log.LogInformation("Const_Division already fully populated ({Count} rows); skipping seed.", existing);
            return;
        }
        if (existing > 0)
        {
            _log.LogWarning("Const_Division has {Existing} rows but seed file has {Expected}; rebuilding.",
                existing, rows.Count);
            await _db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Const_Division\";", ct);
        }

        _log.LogInformation("Seeding Const_Division with {Count} rows...", rows.Count);
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            const int batchSize = 500;
            for (var i = 0; i < rows.Count; i += batchSize)
            {
                var batch = rows.Skip(i).Take(batchSize).ToList();
                await _db.Set<ConstDivision>().AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
                _db.ChangeTracker.Clear();
            }

            var final = await _db.Set<ConstDivision>().CountAsync(ct);
            if (final != rows.Count)
                throw new InvalidOperationException(
                    $"Const_Division seed integrity check failed: inserted {final}, expected {rows.Count}.");
            await tx.CommitAsync(ct);
            _log.LogInformation("Const_Division seed complete ({Count} rows).", rows.Count);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
