using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PlatinumOvertime_API.Data.Migrations.SqlServer
{
    /// <inheritdoc />
    public partial class AddOvertimeCaptureFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Amount",
                table: "OvertimeTransaction",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ApproverEmployeeId",
                table: "OvertimeTransaction",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApproverEmployeeName",
                table: "OvertimeTransaction",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentAssigneeUserId",
                table: "OvertimeTransaction",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExcessApproverEmployeeId",
                table: "OvertimeTransaction",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExcessApproverEmployeeName",
                table: "OvertimeTransaction",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FormulaSnapshot",
                table: "OvertimeTransaction",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "HoursAlreadyCapturedThisMonth",
                table: "OvertimeTransaction",
                type: "decimal(8,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsExcess",
                table: "OvertimeTransaction",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PayrollApproverEmployeeId",
                table: "OvertimeTransaction",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayrollApproverEmployeeName",
                table: "OvertimeTransaction",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayrollCapturerEmployeeId",
                table: "OvertimeTransaction",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayrollCapturerEmployeeName",
                table: "OvertimeTransaction",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecommenderEmployeeId",
                table: "OvertimeTransaction",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecommenderEmployeeName",
                table: "OvertimeTransaction",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SalaryHeadId",
                table: "OvertimeTransaction",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SalaryHeadName",
                table: "OvertimeTransaction",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeTransaction_CurrentAssigneeUserId",
                table: "OvertimeTransaction",
                column: "CurrentAssigneeUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OvertimeTransaction_CurrentAssigneeUserId",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "Amount",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "ApproverEmployeeId",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "ApproverEmployeeName",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "CurrentAssigneeUserId",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "ExcessApproverEmployeeId",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "ExcessApproverEmployeeName",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "FormulaSnapshot",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "HoursAlreadyCapturedThisMonth",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "IsExcess",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "PayrollApproverEmployeeId",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "PayrollApproverEmployeeName",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "PayrollCapturerEmployeeId",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "PayrollCapturerEmployeeName",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "RecommenderEmployeeId",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "RecommenderEmployeeName",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "SalaryHeadId",
                table: "OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "SalaryHeadName",
                table: "OvertimeTransaction");
        }
    }
}
