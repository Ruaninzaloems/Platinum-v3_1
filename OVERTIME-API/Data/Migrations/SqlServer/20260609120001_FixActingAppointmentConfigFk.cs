using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PlatinumOvertime_API.Data;

#nullable disable

namespace PlatinumOvertime_API.Data.Migrations.SqlServer
{
    [DbContext(typeof(OvertimeDbContextSqlServer))]
    [Migration("20260609120001_FixActingAppointmentConfigFk")]
    public partial class FixActingAppointmentConfigFk : Migration
    {
        /// <summary>
        /// Ensures every Payroll_TemporaryActingAppointment row's
        /// PositionApprovalConfigId FK points to the Payroll_PositionApprovalConfig
        /// row whose PositionId equals ActingInPositionId, then locks in the
        /// invariant with a composite UNIQUE + FOREIGN KEY constraint.
        ///
        /// Invariant:
        ///   appointment.PositionApprovalConfigId
        ///     → config.Id  WHERE  config.PositionId = appointment.ActingInPositionId
        ///
        /// Steps
        /// ─────
        /// 1. For any appointment whose ActingInPositionId has no matching config
        ///    yet, INSERT a placeholder config row (all flags false, empty desc).
        /// 2. UPDATE every appointment whose FK points to the wrong config.
        /// 3. Verify: hard-fail if any mismatch remains (e.g. NULL ActingInPositionId).
        /// 4. Add a composite UNIQUE key on PositionApprovalConfig(Id, PositionId).
        /// 5. Add a composite FOREIGN KEY enforcing the invariant at DB level,
        ///    using ON DELETE NO ACTION.  The existing single-column FK already
        ///    owns cascade delete; SQL Server rejects multiple cascade paths from
        ///    the same child table to the same parent ("Introducing FOREIGN KEY
        ///    constraint … may cause cycles or multiple cascade paths").
        ///    Both steps guard with IF NOT EXISTS for idempotency.
        /// </summary>
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Step 1: Create placeholder configs for orphan ActingInPositionId values ──
            migrationBuilder.Sql(@"
INSERT INTO Payroll_PositionApprovalConfig
       (Id, PositionId, PositionDescription,
        IsOvertimeRecommender, IsOvertimeApprover, IsDepartmentExcessOvertimeApprover,
        CreatedAt, UpdatedAt)
SELECT NEWID(),
       taa.ActingInPositionId,
       '',
       0,
       0,
       0,
       GETUTCDATE(),
       GETUTCDATE()
FROM   (
    SELECT DISTINCT taa.ActingInPositionId
    FROM   Payroll_TemporaryActingAppointment taa
    LEFT JOIN Payroll_PositionApprovalConfig pac
           ON  pac.PositionId = taa.ActingInPositionId
    WHERE  pac.Id IS NULL
      AND  taa.ActingInPositionId <> ''
) AS taa;
");

            // ── Step 2: Correct every FK that points at the wrong config ──────────────
            migrationBuilder.Sql(@"
UPDATE taa
SET    taa.PositionApprovalConfigId = pac.Id,
       taa.UpdatedAt = GETUTCDATE()
FROM   Payroll_TemporaryActingAppointment taa
INNER JOIN Payroll_PositionApprovalConfig pac
       ON  pac.PositionId = taa.ActingInPositionId
WHERE  taa.PositionApprovalConfigId <> pac.Id;
");

            // ── Step 3: Post-fix verification — hard-fail if any mismatch remains ─────
            migrationBuilder.Sql(@"
DECLARE @bad_count int;
SELECT @bad_count = COUNT(*)
FROM   Payroll_TemporaryActingAppointment taa
JOIN   Payroll_PositionApprovalConfig pac
       ON  pac.Id = taa.PositionApprovalConfigId
WHERE  pac.PositionId <> taa.ActingInPositionId;

IF @bad_count > 0
    THROW 50001,
        'FixActingAppointmentConfigFk: one or more rows in Payroll_TemporaryActingAppointment still have a mismatched PositionApprovalConfigId after remediation. Rows with NULL or empty ActingInPositionId must be fixed manually before this migration can complete.',
        1;
");

            // ── Step 4: Composite UNIQUE key on PositionApprovalConfig(Id, PositionId) ─
            // IF NOT EXISTS guard makes the step idempotent.
            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'AK_Payroll_PositionApprovalConfig_Id_PositionId'
      AND object_id = OBJECT_ID('Payroll_PositionApprovalConfig')
)
    CREATE UNIQUE INDEX AK_Payroll_PositionApprovalConfig_Id_PositionId
        ON Payroll_PositionApprovalConfig (Id, PositionId);
");

            // ── Step 5: Composite FK — database-enforced invariant ────────────────────
            // ON DELETE NO ACTION: the existing single-column FK
            //   (PositionApprovalConfigId → PositionApprovalConfig.Id)
            // already owns cascade delete for this child table.  SQL Server forbids
            // two cascade paths from the same child table to the same parent
            // ("Introducing FOREIGN KEY constraint … may cause cycles or multiple
            // cascade paths").  NO ACTION enforces the position-match invariant on
            // INSERT/UPDATE only; deletion is still cascaded via the original FK.
            // IF NOT EXISTS guard makes the step idempotent.
            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_TAA_ConfigId_ActingInPositionId'
)
    ALTER TABLE Payroll_TemporaryActingAppointment
        ADD CONSTRAINT FK_TAA_ConfigId_ActingInPositionId
        FOREIGN KEY (PositionApprovalConfigId, ActingInPositionId)
        REFERENCES Payroll_PositionApprovalConfig (Id, PositionId)
        ON DELETE NO ACTION;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
ALTER TABLE Payroll_TemporaryActingAppointment
    DROP CONSTRAINT IF EXISTS FK_TAA_ConfigId_ActingInPositionId;
");
            migrationBuilder.Sql(@"
DROP INDEX IF EXISTS AK_Payroll_PositionApprovalConfig_Id_PositionId
    ON Payroll_PositionApprovalConfig;
");
            // Placeholder config rows created in Up() are left in place — removing them
            // could cascade-delete appointments and is therefore unsafe to automate.
        }
    }
}
