using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PlatinumOvertime_API.Data;

#nullable disable

namespace PlatinumOvertime_API.Data.Migrations.Postgres
{
    [DbContext(typeof(OvertimeDbContextPostgres))]
    [Migration("20260428130000_RenameTablesWithPayrollPrefix")]
    public class RenameTablesWithPayrollPrefix : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "OvertimeAuditTrail",
                newName: "Payroll_OvertimeAuditTrail");

            migrationBuilder.RenameTable(
                name: "OvertimeWorkflowState",
                newName: "Payroll_OvertimeWorkflowState");

            migrationBuilder.RenameTable(
                name: "OvertimeTransactionDocument",
                newName: "Payroll_OvertimeTransactionDocument");

            migrationBuilder.RenameTable(
                name: "OvertimeTransaction",
                newName: "Payroll_OvertimeTransaction");

            migrationBuilder.RenameTable(
                name: "TemporaryActingAppointment",
                newName: "Payroll_TemporaryActingAppointment");

            migrationBuilder.RenameTable(
                name: "PositionReportingRelationship",
                newName: "Payroll_PositionReportingRelationship");

            migrationBuilder.RenameTable(
                name: "PositionApprovalConfig",
                newName: "Payroll_PositionApprovalConfig");

            migrationBuilder.RenameTable(
                name: "OvertimeConfig",
                newName: "Payroll_OvertimeConfig");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "Payroll_OvertimeAuditTrail",
                newName: "OvertimeAuditTrail");

            migrationBuilder.RenameTable(
                name: "Payroll_OvertimeWorkflowState",
                newName: "OvertimeWorkflowState");

            migrationBuilder.RenameTable(
                name: "Payroll_OvertimeTransactionDocument",
                newName: "OvertimeTransactionDocument");

            migrationBuilder.RenameTable(
                name: "Payroll_OvertimeTransaction",
                newName: "OvertimeTransaction");

            migrationBuilder.RenameTable(
                name: "Payroll_TemporaryActingAppointment",
                newName: "TemporaryActingAppointment");

            migrationBuilder.RenameTable(
                name: "Payroll_PositionReportingRelationship",
                newName: "PositionReportingRelationship");

            migrationBuilder.RenameTable(
                name: "Payroll_PositionApprovalConfig",
                newName: "PositionApprovalConfig");

            migrationBuilder.RenameTable(
                name: "Payroll_OvertimeConfig",
                newName: "OvertimeConfig");
        }
    }
}
