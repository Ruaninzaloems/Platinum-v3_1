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
            migrationBuilder.DropColumn(
                name: "CycleId",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "CycleName",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "PeriodId",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "PeriodName",
                table: "OvertimeTransaction");
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
