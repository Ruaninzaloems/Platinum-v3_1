using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PlatinumOvertime_API.Data.Migrations.Postgres
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OvertimeAuditTrail",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EntityName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EntityId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PerformedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Details = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    PerformedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OvertimeAuditTrail", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OvertimeConfig",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AllowOvertimeMultipleApproval = table.Column<bool>(type: "boolean", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CountingPeriodStartDay = table.Column<int>(type: "integer", nullable: false),
                    CountingPeriodEndDay = table.Column<int>(type: "integer", nullable: false),
                    MaximumMonthlyOvertimeHours = table.Column<decimal>(type: "numeric(8,2)", nullable: false),
                    ExceptionalMaximumOvertimeHours = table.Column<decimal>(type: "numeric(8,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SingletonLock = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: false, defaultValue: "X")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OvertimeConfig", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OvertimeTransaction",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EmployeeName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    DepartmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    DepartmentName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    PositionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    OvertimeDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: true),
                    EndTime = table.Column<TimeSpan>(type: "interval", nullable: true),
                    Hours = table.Column<decimal>(type: "numeric(8,2)", nullable: false),
                    Reason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CapturedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OvertimeTransaction", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PositionApprovalConfig",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PositionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    PositionDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsOvertimeRecommender = table.Column<bool>(type: "boolean", nullable: false),
                    IsOvertimeApprover = table.Column<bool>(type: "boolean", nullable: false),
                    IsDepartmentExcessOvertimeApprover = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PositionApprovalConfig", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OvertimeTransactionDocument",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OvertimeTransactionId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    StoragePath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    UploadedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OvertimeTransactionDocument", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OvertimeTransactionDocument_OvertimeTransaction_OvertimeTra~",
                        column: x => x.OvertimeTransactionId,
                        principalTable: "OvertimeTransaction",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OvertimeWorkflowState",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OvertimeTransactionId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromStatus = table.Column<int>(type: "integer", nullable: false),
                    ToStatus = table.Column<int>(type: "integer", nullable: false),
                    ActionedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Comments = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ActionedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OvertimeWorkflowState", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OvertimeWorkflowState_OvertimeTransaction_OvertimeTransacti~",
                        column: x => x.OvertimeTransactionId,
                        principalTable: "OvertimeTransaction",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PositionReportingRelationship",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PositionApprovalConfigId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReportsToPositionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ReportsToPositionDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PositionReportingRelationship", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PositionReportingRelationship_PositionApprovalConfig_Positi~",
                        column: x => x.PositionApprovalConfigId,
                        principalTable: "PositionApprovalConfig",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TemporaryActingAppointment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PositionApprovalConfigId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActingEmployeeId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ActingEmployeeName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    ActingInPositionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ActingInPositionDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemporaryActingAppointment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TemporaryActingAppointment_PositionApprovalConfig_PositionA~",
                        column: x => x.PositionApprovalConfigId,
                        principalTable: "PositionApprovalConfig",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeAuditTrail_EntityName_EntityId",
                table: "OvertimeAuditTrail",
                columns: new[] { "EntityName", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeConfig_SingletonLock",
                table: "OvertimeConfig",
                column: "SingletonLock",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeTransaction_EmployeeId_OvertimeDate",
                table: "OvertimeTransaction",
                columns: new[] { "EmployeeId", "OvertimeDate" });

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeTransaction_Status",
                table: "OvertimeTransaction",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeTransactionDocument_OvertimeTransactionId",
                table: "OvertimeTransactionDocument",
                column: "OvertimeTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeWorkflowState_OvertimeTransactionId",
                table: "OvertimeWorkflowState",
                column: "OvertimeTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_PositionApprovalConfig_PositionId",
                table: "PositionApprovalConfig",
                column: "PositionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PositionReportingRelationship_PositionApprovalConfigId",
                table: "PositionReportingRelationship",
                column: "PositionApprovalConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_TemporaryActingAppointment_PositionApprovalConfigId",
                table: "TemporaryActingAppointment",
                column: "PositionApprovalConfigId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OvertimeAuditTrail");

            migrationBuilder.DropTable(
                name: "OvertimeConfig");

            migrationBuilder.DropTable(
                name: "OvertimeTransactionDocument");

            migrationBuilder.DropTable(
                name: "OvertimeWorkflowState");

            migrationBuilder.DropTable(
                name: "PositionReportingRelationship");

            migrationBuilder.DropTable(
                name: "TemporaryActingAppointment");

            migrationBuilder.DropTable(
                name: "OvertimeTransaction");

            migrationBuilder.DropTable(
                name: "PositionApprovalConfig");
        }
    }
}
