using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PlatinumOvertime_API.Data.Migrations.Postgres
{
    /// <inheritdoc />
    public partial class DropCyclePeriodColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='OvertimeTransaction' AND column_name='CycleId') THEN
                        ALTER TABLE "OvertimeTransaction" DROP COLUMN "CycleId";
                    END IF;
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='OvertimeTransaction' AND column_name='CycleName') THEN
                        ALTER TABLE "OvertimeTransaction" DROP COLUMN "CycleName";
                    END IF;
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='OvertimeTransaction' AND column_name='PeriodId') THEN
                        ALTER TABLE "OvertimeTransaction" DROP COLUMN "PeriodId";
                    END IF;
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='OvertimeTransaction' AND column_name='PeriodName') THEN
                        ALTER TABLE "OvertimeTransaction" DROP COLUMN "PeriodName";
                    END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CycleId",
                table: "OvertimeTransaction",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CycleName",
                table: "OvertimeTransaction",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PeriodId",
                table: "OvertimeTransaction",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PeriodName",
                table: "OvertimeTransaction",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }
    }
}
