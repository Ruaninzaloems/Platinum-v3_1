using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.SqlServer.Metadata;

#nullable disable

namespace PlatinumOvertime_API.Data.Migrations.SqlServer
{
    [Microsoft.EntityFrameworkCore.Infrastructure.DbContext(typeof(PlatinumOvertime_API.Data.OvertimeDbContextSqlServer))]
    [Microsoft.EntityFrameworkCore.Migrations.Migration("20260430120001_AddTransactionNo")]
    public partial class AddTransactionNo : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TransactionNo",
                table: "Payroll_OvertimeTransaction",
                type: "int",
                nullable: false)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.CreateIndex(
                name: "IX_Payroll_OvertimeTransaction_TransactionNo",
                table: "Payroll_OvertimeTransaction",
                column: "TransactionNo",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payroll_OvertimeTransaction_TransactionNo",
                table: "Payroll_OvertimeTransaction");

            migrationBuilder.DropColumn(
                name: "TransactionNo",
                table: "Payroll_OvertimeTransaction");
        }
    }
}
