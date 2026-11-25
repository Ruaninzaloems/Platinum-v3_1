using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy Payroll_CyclePeriodDetails
/// table exists in the dev Postgres database and is populated from the
/// supplied spreadsheet. In production (SQL Server) this seeder is a no-op
/// because the real table is owned by Platinum Payroll. Run after
/// <see cref="ConstCycleSeeder"/> so CycleID references resolve.
///
/// All date columns are datetime in production. JSON seed export contains
/// OADate serial numbers; OADateJsonConverter handles conversion to DateTime.
/// ApprovedStatus is nvarchar in production (not int).
/// </summary>
public class PayrollCyclePeriodDetailsSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<PayrollCyclePeriodDetailsSeeder> _log;

    public PayrollCyclePeriodDetailsSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<PayrollCyclePeriodDetailsSeeder> log)
    {
        _db = db; _env = env; _log = log;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("PayrollCyclePeriodDetailsSeeder skipped (env={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }
        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (!providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation("PayrollCyclePeriodDetailsSeeder skipped (provider={Provider}); legacy table managed by Platinum Payroll.", providerName);
            return;
        }

        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Payroll_CyclePeriodDetails"" (
                ""Period_ID""                  integer PRIMARY KEY,
                ""PeriodInTaxYear""            integer,
                ""ProcessingMonth""            varchar(64),
                ""PeriodStartDate""            timestamp,
                ""PeriodEndDate""              timestamp,
                ""Processed""                  boolean,
                ""MunicipalityID""             integer,
                ""FinancialYear""              varchar(32),
                ""Enabled""                    boolean,
                ""DateCaptured""               timestamp,
                ""CapturerID""                 integer,
                ""DateModified""               timestamp,
                ""ModifierID""                 integer,
                ""CycleID""                    integer,
                ""ProcessedDate""              timestamp,
                ""PayrollEFTFileName""         varchar(500),
                ""CycleModeID""                integer,
                ""LockedDown""                 boolean,
                ""LockDownDate""               timestamp,
                ""LockedDownBy""               integer,
                ""LockdownCancelledBy""        integer,
                ""ApprovedDate""               timestamp,
                ""ApprovedBy""                 integer,
                ""FinalRunDate""               timestamp,
                ""FinalRunExecutedBy""         integer,
                ""Reason""                     varchar(2000),
                ""LockDownCancelledDate""      timestamp,
                ""ApprovedStatus""             varchar(64),
                ""TrialRunDate""               timestamp,
                ""TrialRunBy""                 integer,
                ""TaxYear""                    varchar(32),
                ""AdhocTypeID""                integer,
                ""AdhocTerminationTypeID""     integer
            );
            CREATE INDEX IF NOT EXISTS ix_payroll_cycle_period_cycle
                ON ""Payroll_CyclePeriodDetails"" (""CycleID"");", ct);

        // Migrate existing table if columns were previously created with wrong types.
        await _db.Database.ExecuteSqlRawAsync(@"
            DO $$ BEGIN
                IF (SELECT data_type FROM information_schema.columns
                    WHERE table_name='Payroll_CyclePeriodDetails' AND column_name='PeriodStartDate') = 'numeric' THEN
                    EXECUTE 'ALTER TABLE ""Payroll_CyclePeriodDetails"" ALTER COLUMN ""PeriodStartDate""       TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Payroll_CyclePeriodDetails"" ALTER COLUMN ""PeriodEndDate""         TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Payroll_CyclePeriodDetails"" ALTER COLUMN ""DateCaptured""          TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Payroll_CyclePeriodDetails"" ALTER COLUMN ""DateModified""          TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Payroll_CyclePeriodDetails"" ALTER COLUMN ""ProcessedDate""         TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Payroll_CyclePeriodDetails"" ALTER COLUMN ""LockDownDate""          TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Payroll_CyclePeriodDetails"" ALTER COLUMN ""ApprovedDate""          TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Payroll_CyclePeriodDetails"" ALTER COLUMN ""FinalRunDate""          TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Payroll_CyclePeriodDetails"" ALTER COLUMN ""LockDownCancelledDate"" TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Payroll_CyclePeriodDetails"" ALTER COLUMN ""TrialRunDate""          TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Payroll_CyclePeriodDetails"" ALTER COLUMN ""ApprovedStatus""        TYPE varchar(64) USING NULL';
                    EXECUTE 'TRUNCATE TABLE ""Payroll_CyclePeriodDetails""';
                END IF;
            END $$;", ct);

        var path = Path.Combine(_env.ContentRootPath, "Data", "SeedData", "payroll_cycle_period_details.json");
        if (!File.Exists(path))
        {
            _log.LogWarning("Payroll_CyclePeriodDetails seed file not found at {Path}; nothing seeded.", path);
            return;
        }

        var opts = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new OADateJsonConverter() }
        };

        await using var fs = File.OpenRead(path);
        var rows = await JsonSerializer.DeserializeAsync<List<PayrollCyclePeriodDetails>>(fs, opts, ct) ?? new List<PayrollCyclePeriodDetails>();
        if (rows.Count == 0)
        {
            _log.LogWarning("Payroll_CyclePeriodDetails seed file at {Path} contained no rows.", path);
            return;
        }

        var existing = await _db.Set<PayrollCyclePeriodDetails>().CountAsync(ct);
        if (existing == rows.Count)
        {
            _log.LogInformation("Payroll_CyclePeriodDetails already fully populated ({Count} rows); skipping seed.", existing);
            return;
        }
        if (existing > 0)
        {
            _log.LogWarning("Payroll_CyclePeriodDetails has {Existing} rows but seed file has {Expected}; rebuilding.",
                existing, rows.Count);
            await _db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Payroll_CyclePeriodDetails\";", ct);
        }

        _log.LogInformation("Seeding Payroll_CyclePeriodDetails with {Count} rows...", rows.Count);
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            const int batchSize = 500;
            for (var i = 0; i < rows.Count; i += batchSize)
            {
                var batch = rows.Skip(i).Take(batchSize).ToList();
                await _db.Set<PayrollCyclePeriodDetails>().AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
                _db.ChangeTracker.Clear();
            }

            var final = await _db.Set<PayrollCyclePeriodDetails>().CountAsync(ct);
            if (final != rows.Count)
                throw new InvalidOperationException(
                    $"Payroll_CyclePeriodDetails seed integrity check failed: inserted {final}, expected {rows.Count}.");
            await tx.CommitAsync(ct);
            _log.LogInformation("Payroll_CyclePeriodDetails seed complete ({Count} rows).", rows.Count);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
