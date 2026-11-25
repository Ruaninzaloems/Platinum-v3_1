using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PlatinumOvertime_API.Data;

#nullable disable

namespace PlatinumOvertime_API.Data.Migrations.Postgres
{
    [DbContext(typeof(OvertimeDbContextPostgres))]
    [Migration("20260609120000_FixActingAppointmentConfigFk")]
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
        ///    This keeps the migration self-contained: positions that were configured
        ///    acting appointments without a backing approval config now have one and
        ///    can be fully configured through the Position Approval Setup page.
        /// 2. UPDATE every appointment whose FK points to the wrong config.
        /// 3. Verify: hard-fail the migration if any mismatch remains (guards against
        ///    data states not covered by steps 1-2, e.g. NULL ActingInPositionId).
        /// 4. Add a composite UNIQUE key on PositionApprovalConfig(Id, PositionId)
        ///    so the composite FK can reference it.
        /// 5. Add a composite FOREIGN KEY on
        ///    TemporaryActingAppointment(PositionApprovalConfigId, ActingInPositionId)
        ///    → PositionApprovalConfig(Id, PositionId) with ON DELETE NO ACTION.
        ///    The existing single-column FK already owns cascade delete; using
        ///    NO ACTION here avoids a duplicate cascade path (would be rejected on
        ///    SQL Server and is semantically redundant on Postgres).
        ///    Both steps guard with IF NOT EXISTS for idempotency.
        /// </summary>
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Step 1: Create placeholder configs for orphan ActingInPositionId values ──
            // Any appointment whose ActingInPositionId is not already a PositionId in
            // the config table gets a stub row with all approval flags = false.
            // The stub can be fully populated via Position Approval Setup; its existence
            // is necessary before we can attach a FK pointing at it.
            migrationBuilder.Sql(@"
INSERT INTO ""Payroll_PositionApprovalConfig""
       (""Id"", ""PositionId"", ""PositionDescription"",
        ""IsOvertimeRecommender"", ""IsOvertimeApprover"", ""IsDepartmentExcessOvertimeApprover"",
        ""CreatedAt"", ""UpdatedAt"")
SELECT gen_random_uuid(),
       taa.""ActingInPositionId"",
       '',
       false,
       false,
       false,
       (NOW() AT TIME ZONE 'UTC'),
       (NOW() AT TIME ZONE 'UTC')
FROM   ""Payroll_TemporaryActingAppointment"" taa
LEFT JOIN ""Payroll_PositionApprovalConfig"" pac
       ON  pac.""PositionId"" = taa.""ActingInPositionId""
WHERE  pac.""Id"" IS NULL
  AND  taa.""ActingInPositionId"" <> ''
GROUP BY taa.""ActingInPositionId"";
");

            // ── Step 2: Correct every FK that points at the wrong config ──────────────
            migrationBuilder.Sql(@"
UPDATE ""Payroll_TemporaryActingAppointment"" taa
SET    ""PositionApprovalConfigId"" = pac.""Id"",
       ""UpdatedAt"" = (NOW() AT TIME ZONE 'UTC')
FROM   ""Payroll_PositionApprovalConfig"" pac
WHERE  pac.""PositionId"" = taa.""ActingInPositionId""
  AND  taa.""PositionApprovalConfigId"" <> pac.""Id"";
");

            // ── Step 3: Post-fix verification — hard-fail if any mismatch remains ─────
            // This catches edge cases (NULL / empty ActingInPositionId) that steps 1-2
            // cannot remedy automatically. The migration must be clean before the schema
            // constraint is added, otherwise the ALTER TABLE below would also fail.
            migrationBuilder.Sql(@"
DO $$
DECLARE
    bad_count integer;
BEGIN
    SELECT COUNT(*) INTO bad_count
    FROM   ""Payroll_TemporaryActingAppointment"" taa
    JOIN   ""Payroll_PositionApprovalConfig"" pac
           ON  pac.""Id"" = taa.""PositionApprovalConfigId""
    WHERE  pac.""PositionId"" <> taa.""ActingInPositionId"";

    IF bad_count > 0 THEN
        RAISE EXCEPTION
            'FixActingAppointmentConfigFk: % row(s) in Payroll_TemporaryActingAppointment '
            'still have a mismatched PositionApprovalConfigId after remediation. '
            'These rows have a NULL or empty ActingInPositionId and must be fixed manually '
            'before this migration can complete.',
            bad_count;
    END IF;
END $$;
");

            // ── Step 4: Composite UNIQUE key on PositionApprovalConfig(Id, PositionId) ─
            // Required so the composite FK in step 5 has a valid principal key to target.
            // IF NOT EXISTS makes the step idempotent if the migration is re-run.
            migrationBuilder.Sql(@"
CREATE UNIQUE INDEX IF NOT EXISTS ""AK_Payroll_PositionApprovalConfig_Id_PositionId""
    ON ""Payroll_PositionApprovalConfig"" (""Id"", ""PositionId"");
");

            // ── Step 5: Composite FK — database-enforced invariant ────────────────────
            // ON DELETE NO ACTION: the existing single-column FK
            //   (PositionApprovalConfigId → PositionApprovalConfig.Id)
            // already owns cascade delete for this child table.  Adding a second
            // CASCADE from the same child table to the same parent would be rejected
            // by SQL Server ("multiple cascade paths") and is semantically redundant
            // on Postgres.  NO ACTION here means the DB enforces the position-match
            // invariant on INSERT/UPDATE only; deletion is still cascaded via the
            // original FK.
            // The DO $$ block makes the step idempotent.
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'FK_TAA_ConfigId_ActingInPositionId'
    ) THEN
        ALTER TABLE ""Payroll_TemporaryActingAppointment""
            ADD CONSTRAINT ""FK_TAA_ConfigId_ActingInPositionId""
            FOREIGN KEY (""PositionApprovalConfigId"", ""ActingInPositionId"")
            REFERENCES ""Payroll_PositionApprovalConfig"" (""Id"", ""PositionId"")
            ON DELETE NO ACTION;
    END IF;
END $$;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
ALTER TABLE ""Payroll_TemporaryActingAppointment""
    DROP CONSTRAINT IF EXISTS ""FK_TAA_ConfigId_ActingInPositionId"";
");
            migrationBuilder.Sql(@"
DROP INDEX IF EXISTS ""AK_Payroll_PositionApprovalConfig_Id_PositionId"";
");
            // Placeholder config rows created in Up() are left in place — removing them
            // could cascade-delete appointments and is therefore unsafe to automate.
        }
    }
}
