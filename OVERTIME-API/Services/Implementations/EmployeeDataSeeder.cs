using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy Payroll_Employee table exists
/// in the dev Postgres database and is populated with the 3,478-row dataset
/// supplied by the customer. In production (SQL Server) this seeder is a
/// no-op because the real Payroll_Employee table is owned by Platinum Payroll
/// and is already populated.
/// </summary>
public class EmployeeDataSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<EmployeeDataSeeder> _log;

    public EmployeeDataSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<EmployeeDataSeeder> log)
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
            _log.LogInformation("EmployeeDataSeeder skipped (environment={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }

        var providerName = _db.Database.ProviderName ?? string.Empty;
        var isPostgres = providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase);
        if (!isPostgres)
        {
            _log.LogInformation("EmployeeDataSeeder skipped (provider={Provider}); legacy table is managed by Platinum Payroll.", providerName);
            return;
        }

        // ExcludeFromMigrations means we own table creation here for dev only.
        // Column names match the legacy production SQL Server schema exactly so
        // queries written against either provider behave identically.
        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Payroll_Employee"" (
                ""Employee_ID""   integer PRIMARY KEY,
                ""EmpCode""       varchar(64),
                ""IdNo""          varchar(64),
                ""FirstName""     varchar(200),
                ""SecondName""    varchar(200),
                ""Surname""       varchar(200),
                ""KnownAsName""   varchar(200),
                ""EmailAddress""  varchar(320),
                ""PositionID""    integer,
                ""Enabled""       boolean,
                ""AllowOverTime"" boolean,
                ""JoiningDate""   timestamp,
                ""EndDate""       timestamp
            );
            -- Idempotent column adds: real production rows already carry
            -- these inputs to the overtime formulas. In dev we ALTER the
            -- existing dev table instead of rebuilding so the existing
            -- 3,478-row seed survives.
            ALTER TABLE ""Payroll_Employee"" ADD COLUMN IF NOT EXISTS ""PassportNumber"" varchar(64);
            ALTER TABLE ""Payroll_Employee"" ADD COLUMN IF NOT EXISTS ""PrevSalary""     decimal(18,2);
            ALTER TABLE ""Payroll_Employee"" ADD COLUMN IF NOT EXISTS ""WHPM_Monthly""   decimal(18,4);
            ALTER TABLE ""Payroll_Employee"" ADD COLUMN IF NOT EXISTS ""RPD_Other""      decimal(18,4);
            ALTER TABLE ""Payroll_Employee"" ADD COLUMN IF NOT EXISTS ""WHPD_Other""     decimal(18,4);
            ALTER TABLE ""Payroll_Employee"" ADD COLUMN IF NOT EXISTS ""CycleID""        integer;", ct);

        // Upgrade path: backfill the synthesized salary inputs for any rows
        // that already exist but predate the new columns. The same formula
        // runs in C# below for the fresh-insert path; keeping both paths in
        // lock-step means an existing dev DB doesn't need a wipe.
        await _db.Database.ExecuteSqlRawAsync(@"
            UPDATE ""Payroll_Employee"" SET
                ""PrevSalary""    = ROUND((7500 + ((ABS(""Employee_ID"") * 73) % 951) * 50)::numeric, 2),
                ""WHPM_Monthly""  = 160,
                ""WHPD_Other""    = 8,
                ""RPD_Other""     = ROUND(((7500 + ((ABS(""Employee_ID"") * 73) % 951) * 50)::numeric / 21)::numeric, 4),
                ""PassportNumber"" = CASE WHEN ABS(""Employee_ID"") % 20 = 0
                                         THEN 'P' || LPAD(""Employee_ID""::text, 7, '0')
                                         ELSE NULL END
            WHERE ""PrevSalary"" IS NULL;
            -- Default all employees to Cycle 1 (Monthly Salary) in dev.
            -- Production already carries the correct CycleID from Platinum Payroll.
            UPDATE ""Payroll_Employee"" SET ""CycleID"" = 1 WHERE ""CycleID"" IS NULL;", ct);

        var path = Path.Combine(_env.ContentRootPath, "Data", "SeedData", "payroll_employees.json");
        if (!File.Exists(path))
        {
            _log.LogWarning("Payroll_Employee seed file not found at {Path}; nothing seeded.", path);
            return;
        }

        await using var fs = File.OpenRead(path);
        var rows = await JsonSerializer.DeserializeAsync<List<PayrollEmployee>>(fs,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct) ?? new List<PayrollEmployee>();

        // Npgsql requires DateTime.Kind=Utc when writing to timestamptz.
        // Seed JSON dates are date-only strings (no zone), so deserialization
        // yields Kind=Unspecified — re-stamp them as UTC. SQL Server in prod
        // is unaffected (datetime2 ignores Kind).
        foreach (var r in rows)
        {
            if (r.JoiningDate.HasValue)
                r.JoiningDate = DateTime.SpecifyKind(r.JoiningDate.Value, DateTimeKind.Utc);
            if (r.EndDate.HasValue)
                r.EndDate = DateTime.SpecifyKind(r.EndDate.Value, DateTimeKind.Utc);

            // Synthesize plausible salary inputs so the formula evaluator has
            // something to work with in dev. Production carries these from
            // payroll, so this branch is dev-only.
            //
            // Spread monthly salary across R7,500..R55,000 deterministically
            // from EmployeeId so the same employee always gets the same value.
            // PrevSalary stored to cents; hours rates carry the standard
            // 160 hours/month / 8 hours/day used by Platinum Payroll.
            var bucket = (Math.Abs(r.EmployeeId) * 73 % 951);          // 0..950
            r.PrevSalary  = decimal.Round(7500m + bucket * 50m, 2);    // 7500..55000
            r.WhpmMonthly = 160m;
            r.WhpdOther   = 8m;
            r.RpdOther    = decimal.Round(r.PrevSalary.Value / 21m, 4); // ~22 working days
            // ~5% of dev rows use a passport rather than an SA ID number.
            if (Math.Abs(r.EmployeeId) % 20 == 0)
                r.PassportNumber = $"P{r.EmployeeId:D7}";
            // Default all dev employees to Cycle 1 (Monthly Salary).
            // Production carries the real CycleID from Platinum Payroll.
            r.CycleId ??= 1;
        }

        if (rows.Count == 0)
        {
            _log.LogWarning("Payroll_Employee seed file at {Path} contained no rows.", path);
            return;
        }

        // Idempotency: only skip when the existing row count matches the seed
        // file exactly. A partial seed from a previous failed startup will
        // therefore re-run instead of being silently accepted.
        var existingCount = await _db.Set<PayrollEmployee>().CountAsync(ct);
        if (existingCount == rows.Count)
        {
            _log.LogInformation("Payroll_Employee already fully populated ({Count} rows); skipping seed.", existingCount);
            return;
        }
        if (existingCount > 0)
        {
            _log.LogWarning("Payroll_Employee has {Existing} rows but seed file has {Expected}; rebuilding.",
                existingCount, rows.Count);
            await _db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Payroll_Employee\";", ct);
        }

        _log.LogInformation("Seeding Payroll_Employee with {Count} rows...", rows.Count);

        // Wrap the whole seed in a single transaction so any failure rolls
        // back and the next startup will retry from a clean slate.
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            const int batchSize = 500;
            for (var i = 0; i < rows.Count; i += batchSize)
            {
                var batch = rows.Skip(i).Take(batchSize).ToList();
                await _db.Set<PayrollEmployee>().AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
                _db.ChangeTracker.Clear();
            }

            // Integrity check before commit.
            var finalCount = await _db.Set<PayrollEmployee>().CountAsync(ct);
            if (finalCount != rows.Count)
            {
                throw new InvalidOperationException(
                    $"Payroll_Employee seed integrity check failed: inserted {finalCount}, expected {rows.Count}.");
            }

            await tx.CommitAsync(ct);
            _log.LogInformation("Payroll_Employee seed complete ({Count} rows).", rows.Count);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
