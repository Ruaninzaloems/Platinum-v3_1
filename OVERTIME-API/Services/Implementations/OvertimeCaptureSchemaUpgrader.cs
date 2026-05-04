using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Adds the additional columns + indexes the overtime capture flow needs to
/// the Payroll_OvertimeTransaction table without authoring an EF migration.
///
/// We deliberately skip EF migrations for these columns because:
///   - the dotnet-ef CLI shipped with .NET 10 is not available in this env;
///   - the additions are pure ALTER TABLE ADD COLUMN IF NOT EXISTS, which is
///     safely idempotent on both Postgres and SQL Server.
///
/// In production the same DDL runs once at startup and is then a no-op on
/// subsequent runs. A future hardening pass should fold this into a real
/// migration once the CLI is available.
/// </summary>
public class OvertimeCaptureSchemaUpgrader
{
    private readonly OvertimeDbContext _db;
    private readonly ILogger<OvertimeCaptureSchemaUpgrader> _log;

    public OvertimeCaptureSchemaUpgrader(OvertimeDbContext db, ILogger<OvertimeCaptureSchemaUpgrader> log)
    { _db = db; _log = log; }

    public async Task UpgradeAsync(CancellationToken ct = default)
    {
        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
            await UpgradePostgresAsync(ct);
        else if (providerName.Contains("SqlServer", StringComparison.OrdinalIgnoreCase))
            await UpgradeSqlServerAsync(ct);
        else
            _log.LogWarning("OvertimeCaptureSchemaUpgrader: unknown provider {Provider}, skipping.", providerName);
    }

    private async Task UpgradePostgresAsync(CancellationToken ct)
    {
        await _db.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""SalaryHeadId""                       integer       NOT NULL DEFAULT 0;
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""SalaryHeadName""                     varchar(500)  NOT NULL DEFAULT '';
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""FormulaSnapshot""                    varchar(2000) NOT NULL DEFAULT '';
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""Amount""                             decimal(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""HoursAlreadyCapturedThisMonth""      decimal(8,2)  NOT NULL DEFAULT 0;
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""IsExcess""                           boolean       NOT NULL DEFAULT false;
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""IsExcessApproved""                   boolean       NOT NULL DEFAULT false;
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""IsPayrollCaptured""                  boolean       NOT NULL DEFAULT false;
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""RecommenderEmployeeId""              varchar(64);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""RecommenderEmployeeName""            varchar(300);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""ApproverEmployeeId""                 varchar(64);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""ApproverEmployeeName""               varchar(300);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""ExcessApproverEmployeeId""           varchar(64);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""ExcessApproverEmployeeName""         varchar(300);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""PayrollCapturerEmployeeId""          varchar(64);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""PayrollCapturerEmployeeName""        varchar(300);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""PayrollApproverEmployeeId""          varchar(64);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""PayrollApproverEmployeeName""        varchar(300);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""CurrentAssigneeUserId""              varchar(64);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""LegacyDepartmentId""                integer;
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""LegacyDepartmentName""              varchar(500);
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""LegacyDivisionId""                  integer;
            ALTER TABLE ""Payroll_OvertimeTransaction"" ADD COLUMN IF NOT EXISTS ""LegacyDivisionName""                varchar(500);
            CREATE INDEX IF NOT EXISTS ix_overtime_transaction_assignee
                ON ""Payroll_OvertimeTransaction"" (""CurrentAssigneeUserId"");", ct);
        _log.LogInformation("Payroll_OvertimeTransaction (Postgres) schema upgrade applied.");
    }

    private async Task UpgradeSqlServerAsync(CancellationToken ct)
    {
        await _db.Database.ExecuteSqlRawAsync(@"
            IF COL_LENGTH('Payroll_OvertimeTransaction','SalaryHeadId') IS NULL                  ALTER TABLE [Payroll_OvertimeTransaction] ADD [SalaryHeadId]                  INT            NOT NULL CONSTRAINT DF_OT_SalaryHeadId DEFAULT 0;
            IF COL_LENGTH('Payroll_OvertimeTransaction','SalaryHeadName') IS NULL                ALTER TABLE [Payroll_OvertimeTransaction] ADD [SalaryHeadName]                NVARCHAR(500)  NOT NULL CONSTRAINT DF_OT_SalaryHeadName DEFAULT '';
            IF COL_LENGTH('Payroll_OvertimeTransaction','FormulaSnapshot') IS NULL               ALTER TABLE [Payroll_OvertimeTransaction] ADD [FormulaSnapshot]               NVARCHAR(2000) NOT NULL CONSTRAINT DF_OT_FormulaSnapshot DEFAULT '';
            IF COL_LENGTH('Payroll_OvertimeTransaction','Amount') IS NULL                        ALTER TABLE [Payroll_OvertimeTransaction] ADD [Amount]                        DECIMAL(18,2)  NOT NULL CONSTRAINT DF_OT_Amount DEFAULT 0;
            IF COL_LENGTH('Payroll_OvertimeTransaction','HoursAlreadyCapturedThisMonth') IS NULL ALTER TABLE [Payroll_OvertimeTransaction] ADD [HoursAlreadyCapturedThisMonth] DECIMAL(8,2)   NOT NULL CONSTRAINT DF_OT_HoursAlready DEFAULT 0;
            IF COL_LENGTH('Payroll_OvertimeTransaction','IsExcess') IS NULL                      ALTER TABLE [Payroll_OvertimeTransaction] ADD [IsExcess]                      BIT            NOT NULL CONSTRAINT DF_OT_IsExcess DEFAULT 0;
            IF COL_LENGTH('Payroll_OvertimeTransaction','IsExcessApproved') IS NULL              ALTER TABLE [Payroll_OvertimeTransaction] ADD [IsExcessApproved]              BIT            NOT NULL CONSTRAINT DF_OT_IsExcessApproved DEFAULT 0;
            IF COL_LENGTH('Payroll_OvertimeTransaction','IsPayrollCaptured') IS NULL             ALTER TABLE [Payroll_OvertimeTransaction] ADD [IsPayrollCaptured]             BIT            NOT NULL CONSTRAINT DF_OT_IsPayrollCaptured DEFAULT 0;
            IF COL_LENGTH('Payroll_OvertimeTransaction','RecommenderEmployeeId') IS NULL         ALTER TABLE [Payroll_OvertimeTransaction] ADD [RecommenderEmployeeId]         NVARCHAR(64)   NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','RecommenderEmployeeName') IS NULL       ALTER TABLE [Payroll_OvertimeTransaction] ADD [RecommenderEmployeeName]       NVARCHAR(300)  NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','ApproverEmployeeId') IS NULL            ALTER TABLE [Payroll_OvertimeTransaction] ADD [ApproverEmployeeId]            NVARCHAR(64)   NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','ApproverEmployeeName') IS NULL          ALTER TABLE [Payroll_OvertimeTransaction] ADD [ApproverEmployeeName]          NVARCHAR(300)  NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','ExcessApproverEmployeeId') IS NULL      ALTER TABLE [Payroll_OvertimeTransaction] ADD [ExcessApproverEmployeeId]      NVARCHAR(64)   NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','ExcessApproverEmployeeName') IS NULL    ALTER TABLE [Payroll_OvertimeTransaction] ADD [ExcessApproverEmployeeName]    NVARCHAR(300)  NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','PayrollCapturerEmployeeId') IS NULL     ALTER TABLE [Payroll_OvertimeTransaction] ADD [PayrollCapturerEmployeeId]     NVARCHAR(64)   NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','PayrollCapturerEmployeeName') IS NULL   ALTER TABLE [Payroll_OvertimeTransaction] ADD [PayrollCapturerEmployeeName]   NVARCHAR(300)  NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','PayrollApproverEmployeeId') IS NULL     ALTER TABLE [Payroll_OvertimeTransaction] ADD [PayrollApproverEmployeeId]     NVARCHAR(64)   NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','PayrollApproverEmployeeName') IS NULL   ALTER TABLE [Payroll_OvertimeTransaction] ADD [PayrollApproverEmployeeName]   NVARCHAR(300)  NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','CurrentAssigneeUserId') IS NULL         ALTER TABLE [Payroll_OvertimeTransaction] ADD [CurrentAssigneeUserId]         NVARCHAR(64)   NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','LegacyDepartmentId') IS NULL            ALTER TABLE [Payroll_OvertimeTransaction] ADD [LegacyDepartmentId]            INT            NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','LegacyDepartmentName') IS NULL          ALTER TABLE [Payroll_OvertimeTransaction] ADD [LegacyDepartmentName]          NVARCHAR(500)  NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','LegacyDivisionId') IS NULL              ALTER TABLE [Payroll_OvertimeTransaction] ADD [LegacyDivisionId]              INT            NULL;
            IF COL_LENGTH('Payroll_OvertimeTransaction','LegacyDivisionName') IS NULL            ALTER TABLE [Payroll_OvertimeTransaction] ADD [LegacyDivisionName]            NVARCHAR(500)  NULL;
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Payroll_OvertimeTransaction_CurrentAssigneeUserId' AND object_id=OBJECT_ID('Payroll_OvertimeTransaction'))
                CREATE INDEX [IX_Payroll_OvertimeTransaction_CurrentAssigneeUserId] ON [Payroll_OvertimeTransaction] ([CurrentAssigneeUserId]);", ct);
        _log.LogInformation("Payroll_OvertimeTransaction (SqlServer) schema upgrade applied.");
    }
}
