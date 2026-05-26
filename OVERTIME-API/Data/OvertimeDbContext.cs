using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Data;

public class OvertimeDbContext : DbContext
{
    // Non-generic options accepted so derived per-provider contexts
    // (OvertimeDbContextPostgres / OvertimeDbContextSqlServer) can pass their
    // own DbContextOptions<TSelf> here without type juggling.
    protected OvertimeDbContext(DbContextOptions options) : base(options) { }

    public DbSet<OvertimeConfig> OvertimeConfig => Set<OvertimeConfig>();
    public DbSet<PositionApprovalConfig> PositionApprovalConfigs => Set<PositionApprovalConfig>();
    public DbSet<PositionReportingRelationship> PositionReportingRelationships => Set<PositionReportingRelationship>();
    public DbSet<TemporaryActingAppointment> TemporaryActingAppointments => Set<TemporaryActingAppointment>();
    public DbSet<OvertimeTransaction> OvertimeTransactions => Set<OvertimeTransaction>();
    public DbSet<OvertimeTransactionDocument> OvertimeTransactionDocuments => Set<OvertimeTransactionDocument>();
    public DbSet<OvertimeWorkflowState> OvertimeWorkflowStates => Set<OvertimeWorkflowState>();
    public DbSet<OvertimeAuditTrail> OvertimeAuditTrails => Set<OvertimeAuditTrail>();

    /// <summary>
    /// Read-only projection of the legacy Payroll_Position table.
    /// Excluded from migrations: in production it is owned by the Platinum
    /// Payroll system; in development PositionDataSeeder creates and seeds it.
    /// </summary>
    public DbSet<PayrollPosition> PayrollPositions => Set<PayrollPosition>();

    /// <summary>
    /// Read-only projection of the legacy Payroll_Employee table.
    /// Excluded from migrations: in production it is owned by the Platinum
    /// Payroll system; in development EmployeeDataSeeder creates and seeds it.
    /// </summary>
    public DbSet<PayrollEmployee> PayrollEmployees => Set<PayrollEmployee>();

    /// <summary>Read-only projection of legacy Payroll_SalaryHead.</summary>
    public DbSet<PayrollSalaryHead> PayrollSalaryHeads => Set<PayrollSalaryHead>();

    /// <summary>Read-only projection of legacy Payroll_IRP5Code.</summary>
    public DbSet<PayrollIRP5Code> PayrollIRP5Codes => Set<PayrollIRP5Code>();

    /// <summary>Read-only projection of legacy Payroll_EmployeePayrollDefinition.</summary>
    public DbSet<PayrollEmployeePayrollDefinition> PayrollEmployeePayrollDefinitions =>
        Set<PayrollEmployeePayrollDefinition>();

    /// <summary>Read-only projection of legacy Const_MOC.</summary>
    public DbSet<ConstMOC> ConstMOCs => Set<ConstMOC>();

    /// <summary>Read-only projection of legacy Const_MOCDetail.</summary>
    public DbSet<ConstMOCDetail> ConstMOCDetails => Set<ConstMOCDetail>();

    /// <summary>Read-only projection of legacy AAAA_ConfigSettings.</summary>
    public DbSet<AAAAConfigSettings> AAAAConfigSettings => Set<AAAAConfigSettings>();

    /// <summary>Read-only projection of legacy Const_Cycle.</summary>
    public DbSet<ConstCycle> ConstCycles => Set<ConstCycle>();

    /// <summary>Read-only projection of legacy Const_Department.</summary>
    public DbSet<ConstDepartment> ConstDepartments => Set<ConstDepartment>();

    /// <summary>Read-only projection of legacy Const_Division.</summary>
    public DbSet<ConstDivision> ConstDivisions => Set<ConstDivision>();

    /// <summary>Read-only projection of legacy Payroll_CyclePeriodDetails.</summary>
    public DbSet<PayrollCyclePeriodDetails> PayrollCyclePeriodDetails =>
        Set<PayrollCyclePeriodDetails>();

    /// <summary>
    /// Write target for the "Send to Payroll" action. Excluded from migrations;
    /// in production owned by Platinum Payroll, in dev created by
    /// PayrollEmployeeOvertimeSeeder.
    /// </summary>
    public DbSet<PayrollEmployeeOvertime> PayrollEmployeeOvertimes =>
        Set<PayrollEmployeeOvertime>();

    /// <summary>Read-only projection of legacy User_UserDetail.</summary>
    public DbSet<UserUserDetail> UserUserDetails => Set<UserUserDetail>();

    /// <summary>Read-only projection of legacy User_UserRoles.</summary>
    public DbSet<UserUserRole> UserUserRoles => Set<UserUserRole>();

    /// <summary>Read-only projection of legacy Sys_RolePermission.</summary>
    public DbSet<SysRolePermission> SysRolePermissions => Set<SysRolePermission>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Singleton config: enforce at most one row via unique index on a sentinel column
        b.Entity<OvertimeConfig>(e =>
        {
            e.ToTable("Payroll_OvertimeConfig");
            e.HasKey(x => x.Id);
            e.Property(x => x.MaximumMonthlyOvertimeHours).HasColumnType("decimal(8,2)");
            e.Property(x => x.ExceptionalMaximumOvertimeHours).HasColumnType("decimal(8,2)");
            e.Property(x => x.UpdatedBy).HasMaxLength(200);
            e.Property(x => x.SingletonLock).HasMaxLength(1).IsRequired().HasDefaultValue("X");
            // Database-level singleton enforcement (Business Rule #1): only one row can exist.
            e.HasIndex(x => x.SingletonLock).IsUnique();
        });

        b.Entity<PositionApprovalConfig>(e =>
        {
            e.ToTable("Payroll_PositionApprovalConfig");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.PositionId).IsUnique();
            e.Property(x => x.PositionId).HasMaxLength(64).IsRequired();
            e.Property(x => x.PositionDescription).HasMaxLength(500);
            e.Property(x => x.UpdatedBy).HasMaxLength(200);
        });

        b.Entity<PositionReportingRelationship>(e =>
        {
            e.ToTable("Payroll_PositionReportingRelationship");
            e.HasKey(x => x.Id);
            e.Property(x => x.ReportsToPositionId).HasMaxLength(64).IsRequired();
            e.Property(x => x.ReportsToPositionDescription).HasMaxLength(500);
            e.HasOne(x => x.PositionApprovalConfig)
                .WithMany(p => p.ReportingRelationships)
                .HasForeignKey(x => x.PositionApprovalConfigId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.PositionApprovalConfigId);
        });

        b.Entity<TemporaryActingAppointment>(e =>
        {
            e.ToTable("Payroll_TemporaryActingAppointment");
            e.HasKey(x => x.Id);
            e.Property(x => x.ActingEmployeeId).HasMaxLength(64).IsRequired();
            e.Property(x => x.ActingEmployeeName).HasMaxLength(300);
            e.Property(x => x.ActingInPositionId).HasMaxLength(64).IsRequired();
            e.Property(x => x.ActingInPositionDescription).HasMaxLength(500);
            e.HasOne(x => x.PositionApprovalConfig)
                .WithMany(p => p.ActingAppointments)
                .HasForeignKey(x => x.PositionApprovalConfigId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.PositionApprovalConfigId);
        });

        b.Entity<OvertimeTransaction>(e =>
        {
            e.ToTable("Payroll_OvertimeTransaction");
            e.HasKey(x => x.Id);
            e.Property(x => x.EmployeeId).HasMaxLength(64).IsRequired();
            e.Property(x => x.EmployeeName).HasMaxLength(300);
            e.Property(x => x.DepartmentId).HasMaxLength(64);
            e.Property(x => x.DepartmentName).HasMaxLength(300);
            e.Property(x => x.PositionId).HasMaxLength(64);
            e.Property(x => x.Hours).HasColumnType("decimal(8,2)");
            e.Property(x => x.Reason).HasMaxLength(2000);
            e.Property(x => x.CapturedBy).HasMaxLength(200);
            e.Property(x => x.CapturedByName).HasMaxLength(300);
            e.Property(x => x.SalaryHeadName).HasMaxLength(500);
            e.Property(x => x.FormulaSnapshot).HasMaxLength(2000);
            e.Property(x => x.Amount).HasColumnType("decimal(18,2)");
            e.Property(x => x.HoursAlreadyCapturedThisMonth).HasColumnType("decimal(8,2)");
            e.Property(x => x.RecommenderEmployeeId).HasMaxLength(64);
            e.Property(x => x.RecommenderEmployeeName).HasMaxLength(300);
            e.Property(x => x.ApproverEmployeeId).HasMaxLength(64);
            e.Property(x => x.ApproverEmployeeName).HasMaxLength(300);
            e.Property(x => x.ExcessApproverEmployeeId).HasMaxLength(64);
            e.Property(x => x.ExcessApproverEmployeeName).HasMaxLength(300);
            e.Property(x => x.PayrollCapturerEmployeeId).HasMaxLength(64);
            e.Property(x => x.PayrollCapturerEmployeeName).HasMaxLength(300);
            e.Property(x => x.PayrollApproverEmployeeId).HasMaxLength(64);
            e.Property(x => x.PayrollApproverEmployeeName).HasMaxLength(300);
            e.Property(x => x.CurrentAssigneeUserId).HasMaxLength(64);
            // Legacy payroll classification snapshots — see OvertimeTransaction.
            e.Property(x => x.LegacyDepartmentName).HasMaxLength(500);
            e.Property(x => x.LegacyDivisionName).HasMaxLength(500);
            e.Property(x => x.TransactionNo).ValueGeneratedOnAdd();
            e.HasIndex(x => x.TransactionNo).IsUnique();
            e.HasIndex(x => new { x.EmployeeId, x.OvertimeDate });
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.CurrentAssigneeUserId);
        });

        b.Entity<OvertimeTransactionDocument>(e =>
        {
            e.ToTable("Payroll_OvertimeTransactionDocument");
            e.HasKey(x => x.Id);
            e.Property(x => x.FileName).HasMaxLength(500);
            e.Property(x => x.ContentType).HasMaxLength(200);
            e.Property(x => x.StoragePath).HasMaxLength(1000);
            e.Property(x => x.UploadedBy).HasMaxLength(200);
            e.HasOne(x => x.OvertimeTransaction)
                .WithMany(t => t.Documents)
                .HasForeignKey(x => x.OvertimeTransactionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<OvertimeWorkflowState>(e =>
        {
            e.ToTable("Payroll_OvertimeWorkflowState");
            e.HasKey(x => x.Id);
            e.Property(x => x.ActionedBy).HasMaxLength(200);
            e.Property(x => x.Comments).HasMaxLength(2000);
            e.HasOne(x => x.OvertimeTransaction)
                .WithMany(t => t.WorkflowHistory)
                .HasForeignKey(x => x.OvertimeTransactionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<OvertimeAuditTrail>(e =>
        {
            e.ToTable("Payroll_OvertimeAuditTrail");
            e.HasKey(x => x.Id);
            e.Property(x => x.EntityName).HasMaxLength(200);
            e.Property(x => x.EntityId).HasMaxLength(64);
            e.Property(x => x.Action).HasMaxLength(100);
            e.Property(x => x.PerformedBy).HasMaxLength(200);
            e.Property(x => x.Details).HasMaxLength(4000);
            e.HasIndex(x => new { x.EntityName, x.EntityId });
        });

        // Legacy Payroll_Position — read-only, owned by Platinum Payroll.
        // ExcludeFromMigrations keeps EF migrations from trying to create or
        // drop it. In dev (Postgres) PositionDataSeeder creates + seeds it.
        // Column names match the legacy production SQL Server table EXACTLY
        // (Position_ID, DepartmentID, ...) so the same EF queries work
        // unchanged when pointed at the real Platinum database.
        b.Entity<PayrollPosition>(e =>
        {
            e.ToTable("Payroll_Position", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.PositionId);
            e.Property(x => x.PositionId).HasColumnName("Position_ID").ValueGeneratedNever();
            e.Property(x => x.PositionDesc).HasColumnName("PositionDesc").HasMaxLength(500);
            e.Property(x => x.PositionCode).HasColumnName("PositionCode").HasMaxLength(64);
            e.Property(x => x.DepartmentId).HasColumnName("DepartmentID");
            e.Property(x => x.DivisionId).HasColumnName("DivisionID");
            e.Property(x => x.JobProfileId).HasColumnName("JobProfileID");
            e.Property(x => x.Status).HasColumnName("Status");
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.Property(x => x.ParentId).HasColumnName("ParentID");
            e.Property(x => x.EmployeeId).HasColumnName("EmployeeID");
            e.Property(x => x.HOD).HasColumnName("HOD");
            e.Property(x => x.HierarchyNo).HasColumnName("HierarchyNo");
            e.Property(x => x.UniqueId).HasColumnName("UniqueId").HasMaxLength(64);
        });

        // Legacy Payroll_Employee — read-only, owned by Platinum Payroll.
        // ExcludeFromMigrations keeps EF migrations from trying to create or
        // drop it. In dev (Postgres) EmployeeDataSeeder creates + seeds it.
        // Column names match the legacy production SQL Server table EXACTLY
        // (Employee_ID, EmpCode, ...) so the same EF queries work unchanged
        // when pointed at the real Platinum database.
        b.Entity<PayrollEmployee>(e =>
        {
            e.ToTable("Payroll_Employee", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.EmployeeId);
            e.Property(x => x.EmployeeId).HasColumnName("Employee_ID").ValueGeneratedNever();
            e.Property(x => x.EmpCode).HasColumnName("EmpCode").HasMaxLength(64);
            e.Property(x => x.IdNo).HasColumnName("IdNo").HasMaxLength(64);
            e.Property(x => x.FirstName).HasColumnName("FirstName").HasMaxLength(200);
            e.Property(x => x.SecondName).HasColumnName("SecondName").HasMaxLength(200);
            e.Property(x => x.Surname).HasColumnName("Surname").HasMaxLength(200);
            e.Property(x => x.KnownAsName).HasColumnName("KnownAsName").HasMaxLength(200);
            e.Property(x => x.EmailAddress).HasColumnName("EmailAddress").HasMaxLength(320);
            e.Property(x => x.PositionId).HasColumnName("PositionID");
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.Property(x => x.AllowOverTime).HasColumnName("AllowOverTime");
            e.Property(x => x.JoiningDate).HasColumnName("JoiningDate");
            e.Property(x => x.EndDate).HasColumnName("EndDate");
            e.Property(x => x.PassportNumber).HasColumnName("PassportNumber").HasMaxLength(64);
            // The four overtime-formula inputs. Real Platinum stores these as
            // numeric/decimal; column names match production exactly.
            e.Property(x => x.PrevSalary).HasColumnName("PrevSalary").HasColumnType("decimal(18,2)");
            e.Property(x => x.WhpmMonthly).HasColumnName("WHPM_Monthly").HasColumnType("decimal(18,4)");
            e.Property(x => x.RpdOther).HasColumnName("RPD_Other").HasColumnType("decimal(18,4)");
            e.Property(x => x.WhpdOther).HasColumnName("WHPD_Other").HasColumnType("decimal(18,4)");
            e.Property(x => x.CycleId).HasColumnName("CycleID");
        });

        // Legacy Payroll_SalaryHead — read-only.
        b.Entity<PayrollSalaryHead>(e =>
        {
            e.ToTable("Payroll_SalaryHead", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.SalaryHeadId);
            e.Property(x => x.SalaryHeadId).HasColumnName("SalaryHead_ID").ValueGeneratedNever();
            e.Property(x => x.SalaryHeadName).HasColumnName("SalaryHeadName").HasMaxLength(500);
            e.Property(x => x.SalaryHeadTitle).HasColumnName("SalaryHeadTitle").HasMaxLength(500);
            e.Property(x => x.CalculationFlag).HasColumnName("CalculationFlag");
            e.Property(x => x.IRP5CodeId).HasColumnName("IRP5CodeId");
            e.Property(x => x.Enabled).HasColumnName("Enabled");
        });

        // Legacy Payroll_IRP5Code — read-only.
        b.Entity<PayrollIRP5Code>(e =>
        {
            e.ToTable("Payroll_IRP5Code", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.IRP5CodeId);
            e.Property(x => x.IRP5CodeId).HasColumnName("IRP5Code_ID").ValueGeneratedNever();
            e.Property(x => x.IRP5CodeDesc).HasColumnName("IRP5CodeDesc").HasMaxLength(500);
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.Property(x => x.IRP5Code).HasColumnName("IRP5Code");
            e.Property(x => x.TransactionTypeId).HasColumnName("TransactionTypeID");
        });

        // Legacy Payroll_EmployeePayrollDefinition — read-only.
        b.Entity<PayrollEmployeePayrollDefinition>(e =>
        {
            e.ToTable("Payroll_EmployeePayrollDefinition", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.EmployeePayrollDefinitionId);
            e.Property(x => x.EmployeePayrollDefinitionId).HasColumnName("EmployeePayrollDefinition_ID").ValueGeneratedNever();
            e.Property(x => x.PayrollSalaryHeadId).HasColumnName("PayrollSalaryHeadID");
            e.Property(x => x.EmployeeId).HasColumnName("EmployeeID");
            e.Property(x => x.Percentage).HasColumnName("Percentage").HasColumnType("decimal(8,4)");
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.HasIndex(x => new { x.EmployeeId, x.PayrollSalaryHeadId });
        });

        // Legacy Const_MOC — read-only.
        b.Entity<ConstMOC>(e =>
        {
            e.ToTable("Const_MOC", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.MOCId);
            e.Property(x => x.MOCId).HasColumnName("MOC_ID").ValueGeneratedNever();
            e.Property(x => x.SalaryHeadId).HasColumnName("SalaryHeadID");
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.Property(x => x.StartDate).HasColumnName("StartDate");
            e.Property(x => x.EndDate).HasColumnName("EndDate");
        });

        // Legacy Const_MOCDetail — read-only.
        b.Entity<ConstMOCDetail>(e =>
        {
            e.ToTable("Const_MOCDetail", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.MOCDetailId);
            e.Property(x => x.MOCDetailId).HasColumnName("MOCDetail_ID").ValueGeneratedNever();
            e.Property(x => x.MOCId).HasColumnName("MOCID");
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.Property(x => x.StartDate).HasColumnName("StartDate");
            e.Property(x => x.EndDate).HasColumnName("EndDate");
            e.Property(x => x.Formula).HasColumnName("Formula").HasMaxLength(2000);
        });

        // Legacy AAAA_ConfigSettings — read-only.
        b.Entity<AAAAConfigSettings>(e =>
        {
            e.ToTable("AAAA_ConfigSettings", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.ConfigSettId);
            e.Property(x => x.ConfigSettId).HasColumnName("ConfigSett_ID").ValueGeneratedNever();
            e.Property(x => x.KeyName).HasColumnName("KeyName").HasMaxLength(200);
            e.Property(x => x.KeyValue).HasColumnName("KeyValue").HasMaxLength(2000);
            e.Property(x => x.KeyDescription).HasColumnName("KeyDescription").HasMaxLength(2000);
            e.Property(x => x.Module).HasColumnName("Module").HasMaxLength(200);
            e.Property(x => x.DateCaptured).HasColumnName("DateCaptured");
            e.Property(x => x.CapturerId).HasColumnName("CapturerID");
            e.Property(x => x.PerMuniSetupRequirements).HasColumnName("perMuni_SetupRequirements");
        });

        // Legacy Const_Cycle — read-only.
        b.Entity<ConstCycle>(e =>
        {
            e.ToTable("Const_Cycle", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.CycleId);
            e.Property(x => x.CycleId).HasColumnName("Cycle_ID").ValueGeneratedNever();
            e.Property(x => x.CycleDesc).HasColumnName("CycleDesc").HasMaxLength(500);
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.Property(x => x.DateCaptured).HasColumnName("DateCaptured");
            e.Property(x => x.CapturerId).HasColumnName("CapturerID");
            e.Property(x => x.DateModified).HasColumnName("DateModified");
            e.Property(x => x.ModifierId).HasColumnName("ModifierID");
            e.Property(x => x.CycleTypeId).HasColumnName("CycleTypeID");
            e.Property(x => x.SkipInNewTaxYear).HasColumnName("SkipInNewTaxYear");
        });

        // Legacy Const_Department — read-only.
        b.Entity<ConstDepartment>(e =>
        {
            e.ToTable("Const_Department", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.DepartmentId);
            e.Property(x => x.DepartmentId).HasColumnName("Department_ID").ValueGeneratedNever();
            e.Property(x => x.DepartmentDesc).HasColumnName("DepartmentDesc").HasMaxLength(500);
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.Property(x => x.DateCaptured).HasColumnName("DateCaptured");
            e.Property(x => x.CapturerId).HasColumnName("CapturerID");
            e.Property(x => x.DateModified).HasColumnName("DateModified");
            e.Property(x => x.ModifierId).HasColumnName("ModifierID");
            e.Property(x => x.DepartmentCode).HasColumnName("DepartmentCode").HasMaxLength(64);
            e.Property(x => x.StartDate).HasColumnName("StartDate");
            e.Property(x => x.EndDate).HasColumnName("EndDate");
            e.Property(x => x.VatApportionment).HasColumnName("VatApportionment");
            e.Property(x => x.ManagerPositionId).HasColumnName("ManagerPositionID");
            e.Property(x => x.ManagerStartDate).HasColumnName("ManagerStartDate");
            e.Property(x => x.ManagerEndDate).HasColumnName("ManagerEndDate");
            e.Property(x => x.FinYear).HasColumnName("FinYear").HasMaxLength(32);
        });

        // Legacy Const_Division — read-only.
        b.Entity<ConstDivision>(e =>
        {
            e.ToTable("Const_Division", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.DivisionId);
            e.Property(x => x.DivisionId).HasColumnName("Division_ID").ValueGeneratedNever();
            e.Property(x => x.DivisionDesc).HasColumnName("DivisionDesc").HasMaxLength(500);
            e.Property(x => x.DivisionCode).HasColumnName("DivisionCode").HasMaxLength(64);
            e.Property(x => x.DepartmentId).HasColumnName("DepartmentID");
            e.Property(x => x.DivisionParentId).HasColumnName("DivisionParentID");
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.Property(x => x.DateCaptured).HasColumnName("DateCaptured");
            e.Property(x => x.CapturerId).HasColumnName("CapturerID");
            e.Property(x => x.DateModified).HasColumnName("DateModified");
            e.Property(x => x.ModifierId).HasColumnName("ModifierID");
            e.Property(x => x.SCOAFunctionId).HasColumnName("SCOAFunctionID");
            e.Property(x => x.HRPayrollSCOAFundId).HasColumnName("HRPayrollSCOAFundID");
            e.Property(x => x.StartDate).HasColumnName("StartDate");
            e.Property(x => x.EndDate).HasColumnName("EndDate");
            e.Property(x => x.RegionId).HasColumnName("RegionID");
            e.Property(x => x.ProjectId).HasColumnName("ProjectID");
            e.Property(x => x.ManagerPositionId).HasColumnName("ManagerPositionID");
            e.Property(x => x.ManagerStartDate).HasColumnName("ManagerStartDate");
            e.Property(x => x.ManagerEndDate).HasColumnName("ManagerEndDate");
            e.Property(x => x.ConditionOfServiceId).HasColumnName("ConditionOfServiceID");
            e.Property(x => x.DirectorateLevel).HasColumnName("DirectorateLevel");
            e.Property(x => x.FinYear).HasColumnName("FinYear").HasMaxLength(32);
            e.HasIndex(x => x.DepartmentId);
        });

        // Legacy Payroll_CyclePeriodDetails — read-only.
        b.Entity<PayrollCyclePeriodDetails>(e =>
        {
            e.ToTable("Payroll_CyclePeriodDetails", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.PeriodId);
            e.Property(x => x.PeriodId).HasColumnName("Period_ID").ValueGeneratedNever();
            e.Property(x => x.PeriodInTaxYear).HasColumnName("PeriodInTaxYear");
            e.Property(x => x.ProcessingMonth).HasColumnName("ProcessingMonth").HasMaxLength(64);
            e.Property(x => x.PeriodStartDate).HasColumnName("PeriodStartDate");
            e.Property(x => x.PeriodEndDate).HasColumnName("PeriodEndDate");
            e.Property(x => x.Processed).HasColumnName("Processed");
            e.Property(x => x.MunicipalityId).HasColumnName("MunicipalityID");
            e.Property(x => x.FinancialYear).HasColumnName("FinancialYear").HasMaxLength(32);
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.Property(x => x.DateCaptured).HasColumnName("DateCaptured");
            e.Property(x => x.CapturerId).HasColumnName("CapturerID");
            e.Property(x => x.DateModified).HasColumnName("DateModified");
            e.Property(x => x.ModifierId).HasColumnName("ModifierID");
            e.Property(x => x.CycleId).HasColumnName("CycleID");
            e.Property(x => x.ProcessedDate).HasColumnName("ProcessedDate");
            e.Property(x => x.PayrollEFTFileName).HasColumnName("PayrollEFTFileName").HasMaxLength(500);
            e.Property(x => x.CycleModeId).HasColumnName("CycleModeID");
            e.Property(x => x.LockedDown).HasColumnName("LockedDown");
            e.Property(x => x.LockDownDate).HasColumnName("LockDownDate");
            e.Property(x => x.LockedDownBy).HasColumnName("LockedDownBy");
            e.Property(x => x.LockdownCancelledBy).HasColumnName("LockdownCancelledBy");
            e.Property(x => x.ApprovedDate).HasColumnName("ApprovedDate");
            e.Property(x => x.ApprovedBy).HasColumnName("ApprovedBy");
            e.Property(x => x.FinalRunDate).HasColumnName("FinalRunDate");
            e.Property(x => x.FinalRunExecutedBy).HasColumnName("FinalRunExecutedBy");
            e.Property(x => x.Reason).HasColumnName("Reason").HasMaxLength(2000);
            e.Property(x => x.LockDownCancelledDate).HasColumnName("LockDownCancelledDate");
            e.Property(x => x.ApprovedStatus).HasColumnName("ApprovedStatus").HasMaxLength(64);
            e.Property(x => x.TrialRunDate).HasColumnName("TrialRunDate");
            e.Property(x => x.TrialRunBy).HasColumnName("TrialRunBy");
            e.Property(x => x.TaxYear).HasColumnName("TaxYear").HasMaxLength(32);
            e.Property(x => x.AdhocTypeId).HasColumnName("AdhocTypeID");
            e.Property(x => x.AdhocTerminationTypeId).HasColumnName("AdhocTerminationTypeID");
            e.HasIndex(x => x.CycleId);
        });

        // Legacy User_UserDetail — read-only.
        b.Entity<UserUserDetail>(e =>
        {
            e.ToTable("User_UserDetail", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.UserId);
            e.Property(x => x.UserId).HasColumnName("User_id").ValueGeneratedNever();
            e.Property(x => x.UserName).HasColumnName("UserName").HasMaxLength(200);
            e.Property(x => x.Password).HasColumnName("Password").HasMaxLength(500);
            e.Property(x => x.Company).HasColumnName("Company").HasMaxLength(500);
            e.Property(x => x.TelNo).HasColumnName("TelNo").HasMaxLength(64);
            e.Property(x => x.EMail).HasColumnName("eMail").HasMaxLength(320);
            e.Property(x => x.FirstName).HasColumnName("FirstName").HasMaxLength(200);
            e.Property(x => x.LastName).HasColumnName("LastName").HasMaxLength(200);
            e.Property(x => x.EmpId).HasColumnName("EmpID");
            e.Property(x => x.DepartmentId).HasColumnName("DepartmentID");
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.Property(x => x.TotalLogin).HasColumnName("TotalLogin");
            e.Property(x => x.LastLoginDate).HasColumnName("LastLoginDate");
            e.Property(x => x.SendSMS).HasColumnName("sendSMS");
            e.Property(x => x.SuperUser).HasColumnName("SuperUser");
            e.Property(x => x.DateCaptured).HasColumnName("DateCaptured");
            e.Property(x => x.CapturerId).HasColumnName("CapturerID");
            e.Property(x => x.PasswordNeverExpire).HasColumnName("PasswordNeverExpire");
            e.Property(x => x.PasswordLastChangedDate).HasColumnName("PasswordLastChangedDate");
            e.Property(x => x.ModifierId).HasColumnName("ModifierID");
            e.Property(x => x.DateModified).HasColumnName("DateModified");
            e.Property(x => x.TemporaryPassword).HasColumnName("TemporaryPassword");
            e.Property(x => x.CashFloat).HasColumnName("CashFloat").HasColumnType("decimal(18,2)");
            e.Property(x => x.StartDate).HasColumnName("StartDate");
            e.Property(x => x.EndDate).HasColumnName("EndDate");
            e.Property(x => x.HistoricUser).HasColumnName("HistoricUser");
            e.Property(x => x.TransactionPassword).HasColumnName("TransactionPassword").HasMaxLength(500);
            e.Property(x => x.SignatureFilePath).HasColumnName("SignatureFilePath").HasMaxLength(1000);
            e.Property(x => x.SignatureUploadedOn).HasColumnName("SignatureUploadedOn");
            e.Property(x => x.SignatureImage).HasColumnName("SignatureImage");
            e.Property(x => x.SignatureImageMimeType).HasColumnName("SignatureImageMimeType").HasMaxLength(100);
            e.HasIndex(x => x.EmpId);
        });

        // Legacy Sys_RolePermission — read-only.
        b.Entity<SysRolePermission>(e =>
        {
            e.ToTable("Sys_RolePermission", t => t.ExcludeFromMigrations());
            e.HasKey(x => new { x.PermissionId, x.RoleId });
            e.Property(x => x.PermissionId).HasColumnName("PermissionID").ValueGeneratedNever();
            e.Property(x => x.RoleId).HasColumnName("RoleID").ValueGeneratedNever();
            e.HasIndex(x => x.RoleId);
        });

        // Legacy User_UserRoles — read-only.
        b.Entity<UserUserRole>(e =>
        {
            e.ToTable("User_UserRoles", t => t.ExcludeFromMigrations());
            e.HasKey(x => new { x.UserId, x.RoleId });
            e.Property(x => x.UserId).HasColumnName("UserID").ValueGeneratedNever();
            e.Property(x => x.RoleId).HasColumnName("RoleID").ValueGeneratedNever();
            e.Property(x => x.DelegatedByUserId).HasColumnName("DelegatedByUserID");
            e.Property(x => x.DelegationStart).HasColumnName("DelegationStart");
            e.Property(x => x.DelegationExpiry).HasColumnName("DelegationExpiry");
            e.HasIndex(x => x.UserId);
        });

        // Payroll_EmployeeOvertime — write target for "Send to Payroll".
        // ExcludeFromMigrations: in production owned by Platinum Payroll;
        // in dev PayrollEmployeeOvertimeSeeder creates the table.
        b.Entity<PayrollEmployeeOvertime>(e =>
        {
            e.ToTable("Payroll_EmployeeOvertime", t => t.ExcludeFromMigrations());
            e.HasKey(x => x.EmployeeOverTimeId);
            e.Property(x => x.EmployeeOverTimeId).HasColumnName("EmployeeOverTime_ID")
                .ValueGeneratedOnAdd();
            e.Property(x => x.EmployeeId).HasColumnName("Employee_ID");
            e.Property(x => x.OverTimeDate).HasColumnName("OverTimeDate");
            e.Property(x => x.OverTimeHour).HasColumnName("OverTimeHour").HasColumnType("decimal(18,4)");
            e.Property(x => x.OverTimeFlag).HasColumnName("OverTimeFlag");
            e.Property(x => x.FinancialYear).HasColumnName("FinancialYear").HasMaxLength(32);
            e.Property(x => x.Enabled).HasColumnName("Enabled");
            e.Property(x => x.CapturerId).HasColumnName("CapturerID");
            e.Property(x => x.DateCaptured).HasColumnName("DateCaptured");
            e.Property(x => x.ModifierId).HasColumnName("ModifierID");
            e.Property(x => x.DateModified).HasColumnName("DateModified");
            e.Property(x => x.MOCId).HasColumnName("MOCID");
            e.Property(x => x.EarDedTypeId).HasColumnName("EarDedTypeID");
            e.Property(x => x.PeriodId).HasColumnName("PeriodID");
            e.Property(x => x.TaxYear).HasColumnName("TaxYear").HasMaxLength(32);
            e.Property(x => x.IsApprovalRequired).HasColumnName("IsApprovalRequired");
            e.Property(x => x.IsApproved).HasColumnName("IsApproved");
            e.Property(x => x.RejectedReason).HasColumnName("RejectedReason").HasMaxLength(2000);
            e.Property(x => x.ApprovedOrRejectedBy).HasColumnName("ApprovedOrRejectedBy");
            e.Property(x => x.ApprovedOrRejectedDate).HasColumnName("ApprovedOrRejectedDate");
            e.Property(x => x.CostDesc).HasColumnName("CostDesc").HasMaxLength(500);
            e.Property(x => x.TotalAmount).HasColumnName("TotalAmount").HasColumnType("decimal(18,2)");
            e.Property(x => x.SupportingDocsId).HasColumnName("SupportingDocsID");
            e.Property(x => x.IsCorrection).HasColumnName("IsCorrection");
            e.Property(x => x.LinkId).HasColumnName("LinkID");
            e.Property(x => x.MOCValue).HasColumnName("MOCValue").HasColumnType("decimal(18,4)");
            e.Property(x => x.Rate).HasColumnName("Rate").HasColumnType("decimal(18,4)");
            e.Property(x => x.SalaryHeadId).HasColumnName("SalaryHeadID");
            e.Property(x => x.IsBulk).HasColumnName("IsBulk");
            e.Property(x => x.ProcessedOnPeriodId).HasColumnName("ProcessedOnPeriodID");
            e.Property(x => x.Processed).HasColumnName("Processed");
            e.Property(x => x.ExcludeFromPayment).HasColumnName("ExcludeFromPayment");
            e.Property(x => x.TerminationEscalated).HasColumnName("TerminationEscalated");
            e.Property(x => x.EscalatedDate).HasColumnName("EscalatedDate");
            e.Property(x => x.CapturedDuringPeriodId).HasColumnName("CapturedDuringPeriodID");
            e.HasIndex(x => x.EmployeeId);
        });
    }
}
