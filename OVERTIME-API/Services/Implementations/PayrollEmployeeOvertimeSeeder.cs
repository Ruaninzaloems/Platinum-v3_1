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

        // ---------------------------------------------------------------------------
        // 1. Ensure table exists (no indexes here — column renames must run first
        //    because the table might already exist with old column names).
        // ---------------------------------------------------------------------------
        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Payroll_EmployeeOvertime"" (
                ""EmployeeOverTime_ID""      serial PRIMARY KEY,
                ""EmployeeID""              integer NOT NULL,
                ""OverTimeDate""            timestamp NOT NULL,
                ""OverTimeHour""            numeric(18,2) NOT NULL DEFAULT 0,
                ""OverTimeFlag""            boolean NOT NULL DEFAULT false,
                ""FinancialYear""           varchar(10) NOT NULL DEFAULT '',
                ""Enabled""                 boolean NOT NULL DEFAULT true,
                ""CapturerID""              integer NOT NULL,
                ""DateCaptured""            timestamp NOT NULL,
                ""ModifierID""             integer,
                ""DateModified""            timestamp,
                ""MOCID""                   integer,
                ""EarDedTypeID""            integer,
                ""PeriodID""                integer,
                ""TaxYear""                 varchar(10),
                ""IsApprovalRequired""      boolean,
                ""IsApproved""              boolean,
                ""RejectedReason""          varchar(2000),
                ""ApprovedOrRejectedBy""    integer,
                ""ApprovedOrRejectedDate""  timestamp,
                ""CostDesc""                varchar(50),
                ""TotalAmount""             numeric(18,2),
                ""SupportingDocsID""        integer,
                ""IsCorrection""            boolean,
                ""LinkID""                  integer,
                ""MOC_Value""               numeric(18,2),
                ""Rate""                    numeric(18,2),
                ""SalaryHeadID""            integer,
                ""IsBulk""                  boolean,
                ""ProcessedOnPeriodID""     integer,
                ""Processed""               boolean,
                ""ExcludeFromPayment""      boolean,
                ""TerminationEscalated""    boolean NOT NULL DEFAULT false,
                ""EscalatedDate""           timestamp,
                ""CapturedDuringPeriodID""  integer
            );", ct);

        // ---------------------------------------------------------------------------
        // 2. Migrate existing dev tables that were created before the column-name
        //    alignment. These renames are idempotent — they only run when the old
        //    column name still exists. Must run BEFORE the CREATE INDEX calls below.
        //      Employee_ID  → EmployeeID  (SQL Server has no underscore)
        //      MOCValue     → MOC_Value   (SQL Server uses underscore)
        // ---------------------------------------------------------------------------
        await _db.Database.ExecuteSqlRawAsync(@"
            DO $$ BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'Payroll_EmployeeOvertime'
                      AND column_name = 'Employee_ID'
                ) THEN
                    ALTER TABLE ""Payroll_EmployeeOvertime""
                        RENAME COLUMN ""Employee_ID"" TO ""EmployeeID"";
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'Payroll_EmployeeOvertime'
                      AND column_name = 'MOCValue'
                ) THEN
                    ALTER TABLE ""Payroll_EmployeeOvertime""
                        RENAME COLUMN ""MOCValue"" TO ""MOC_Value"";
                END IF;
            END $$;", ct);

        // ---------------------------------------------------------------------------
        // 3. Create indexes — runs after renames so column names are final.
        // ---------------------------------------------------------------------------
        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE INDEX IF NOT EXISTS ix_payroll_emp_ot_employee
                ON ""Payroll_EmployeeOvertime"" (""EmployeeID"");
            CREATE INDEX IF NOT EXISTS ix_payroll_emp_ot_period
                ON ""Payroll_EmployeeOvertime"" (""PeriodID"");", ct);

        _log.LogInformation("Payroll_EmployeeOvertime table ensured (dev Postgres).");
    }
}
