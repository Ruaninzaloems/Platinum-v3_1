using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PlatinumOvertime_API.Data.Migrations.SqlServer
{
    /// <inheritdoc />
    public partial class AddWorkflowStateChainPositionNote : Migration
    {
        /// <summary>
        /// Adds ChainPositionNote to Payroll_OvertimeWorkflowState so that
        /// workflow history entries created by the master-approver override user
        /// carry a recognisable label ("Override Approver") instead of leaving
        /// the position column blank in the audit trail.
        /// </summary>
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChainPositionNote",
                table: "Payroll_OvertimeWorkflowState",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChainPositionNote",
                table: "Payroll_OvertimeWorkflowState");
        }
    }
}
