using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PlatinumOvertime_API.Data.Migrations.Postgres
{
    [Microsoft.EntityFrameworkCore.Infrastructure.DbContext(typeof(PlatinumOvertime_API.Data.OvertimeDbContextPostgres))]
    [Microsoft.EntityFrameworkCore.Migrations.Migration("20260430120000_AddTransactionNo")]
    public partial class AddTransactionNo : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TransactionNo",
                table: "Payroll_OvertimeTransaction",
                type: "integer",
                nullable: false)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

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
