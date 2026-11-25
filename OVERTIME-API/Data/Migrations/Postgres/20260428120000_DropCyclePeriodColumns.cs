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
            // Use IF EXISTS so this migration is safe whether the columns were ever
            // added (legacy DBs where they existed before this migration was created)
            // or were never present (fresh DBs replaying all migrations from scratch).
            migrationBuilder.Sql(@"ALTER TABLE ""OvertimeTransaction"" DROP COLUMN IF EXISTS ""CycleId"";");
            migrationBuilder.Sql(@"ALTER TABLE ""OvertimeTransaction"" DROP COLUMN IF EXISTS ""CycleName"";");
            migrationBuilder.Sql(@"ALTER TABLE ""OvertimeTransaction"" DROP COLUMN IF EXISTS ""PeriodId"";");
            migrationBuilder.Sql(@"ALTER TABLE ""OvertimeTransaction"" DROP COLUMN IF EXISTS ""PeriodName"";");
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
