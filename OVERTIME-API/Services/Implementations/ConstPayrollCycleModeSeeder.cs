using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy Const_Payroll_CycleMode_sys
/// table exists in the dev Postgres database and contains the two known rows
/// (Normal, Special). In production (SQL Server) this seeder is a no-op
/// because the real table is owned by Platinum Payroll.
/// </summary>
public class ConstPayrollCycleModeSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ConstPayrollCycleModeSeeder> _log;

    public ConstPayrollCycleModeSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<ConstPayrollCycleModeSeeder> log)
    {
        _db = db; _env = env; _log = log;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("ConstPayrollCycleModeSeeder skipped (env={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }
        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (!providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation("ConstPayrollCycleModeSeeder skipped (provider={Provider}); legacy table managed by Platinum Payroll.", providerName);
            return;
        }

        // Create table idempotently.
        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Const_Payroll_CycleMode_sys"" (
                ""CycleMode_ID""    integer PRIMARY KEY,
                ""CycleModeDesc""   varchar(200) NOT NULL,
                ""Enabled""         integer NOT NULL,
                ""DateCaptured""    timestamp NOT NULL,
                ""CapturerID""      integer NOT NULL,
                ""DateModified""    timestamp,
                ""ModifierID""      integer
            );", ct);

        // Insert the two known rows idempotently.
        await _db.Database.ExecuteSqlRawAsync(@"
            INSERT INTO ""Const_Payroll_CycleMode_sys""
                (""CycleMode_ID"", ""CycleModeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
            VALUES
                (1, 'Normal',  1, '2016-04-09 00:00:00', 2),
                (2, 'Special', 1, '2016-04-09 00:00:00', 2)
            ON CONFLICT (""CycleMode_ID"") DO NOTHING;", ct);

        var count = await _db.Set<global::PlatinumOvertime_API.Models.Domain.ConstPayrollCycleMode>().CountAsync(ct);
        _log.LogInformation("Const_Payroll_CycleMode_sys seeded ({Count} rows).", count);
    }
}
