using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy <c>Payroll_EmployeeOvertime</c>
/// table exists in the dev Postgres database (empty — rows are created by the
/// "Send to Payroll" action). In production (SQL Server) the table is owned by
/// Platinum Payroll; this seeder is a no-op there.
/// </summary>
public class PayrollEmployeeOvertimeSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<PayrollEmployeeOvertimeSeeder> _log;

    public PayrollEmployeeOvertimeSeeder(
        OvertimeDbContext db,
        IWebHostEnvironment env,
        ILogger<PayrollEmployeeOvertimeSeeder> log)
    {
        _db = db; _env = env; _log = log;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation(
                "PayrollEmployeeOvertimeSeeder skipped (env={Env}); table managed by Platinum Payroll.",
                _env.EnvironmentName);
            return;
        }

        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (!providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation(
                "PayrollEmployeeOvertimeSeeder skipped (provider={Provider}); table managed by Platinum Payroll.",
                providerName);
            return;
        }

        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Payroll_EmployeeOvertime"" (
                ""EmployeeOverTime_ID""      serial PRIMARY KEY,
                ""Employee_ID""             integer NOT NULL,
                ""OverTimeDate""            timestamp NOT NULL,
                ""OverTimeHour""            numeric(18,4) NOT NULL DEFAULT 0,
                ""OverTimeFlag""            boolean NOT NULL DEFAULT false,
                ""FinancialYear""           varchar(32),
                ""Enabled""                 boolean NOT NULL DEFAULT true,
                ""CapturerID""              integer NOT NULL,
                ""DateCaptured""            timestamp NOT NULL,
                ""ModifierID""             integer,
                ""DateModified""            timestamp,
                ""MOCID""                   integer,
                ""EarDedTypeID""            integer,
                ""PeriodID""                integer,
                ""TaxYear""                 varchar(32),
                ""IsApprovalRequired""      boolean,
                ""IsApproved""              boolean,
                ""RejectedReason""          varchar(2000),
                ""ApprovedOrRejectedBy""    integer,
                ""ApprovedOrRejectedDate""  timestamp,
                ""CostDesc""                varchar(500),
                ""TotalAmount""             numeric(18,2),
                ""SupportingDocsID""        integer,
                ""IsCorrection""            boolean,
                ""LinkID""                  integer,
                ""MOCValue""                numeric(18,4),
                ""Rate""                    numeric(18,4),
                ""SalaryHeadID""            integer,
                ""IsBulk""                  boolean,
                ""ProcessedOnPeriodID""     integer,
                ""Processed""               boolean,
                ""ExcludeFromPayment""      boolean,
                ""TerminationEscalated""    boolean NOT NULL DEFAULT false,
                ""EscalatedDate""           timestamp,
                ""CapturedDuringPeriodID""  integer
            );
            CREATE INDEX IF NOT EXISTS ix_payroll_emp_ot_employee
                ON ""Payroll_EmployeeOvertime"" (""Employee_ID"");
            CREATE INDEX IF NOT EXISTS ix_payroll_emp_ot_period
                ON ""Payroll_EmployeeOvertime"" (""PeriodID"");", ct);

        _log.LogInformation("Payroll_EmployeeOvertime table ensured (dev Postgres).");
    }
}
