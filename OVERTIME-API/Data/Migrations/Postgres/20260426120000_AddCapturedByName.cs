using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PlatinumOvertime_API.Data.Migrations.Postgres
{
    /// <inheritdoc />
    public partial class AddCapturedByName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CapturedByName",
                table: "OvertimeTransaction",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CapturedByName",
                table: "OvertimeTransaction");
        }
    }
}
