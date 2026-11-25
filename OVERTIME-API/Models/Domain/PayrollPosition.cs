namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Payroll_Position table.
/// This table is owned by the existing Platinum Payroll system and is NOT
/// managed by this module's migrations (see ExcludeFromMigrations in the
/// DbContext). In production (SQL Server) it already exists; in development
/// (Postgres) it is created and seeded at startup by PositionDataSeeder so
/// the same EF queries work end-to-end.
///
/// Only the columns required by the overtime module are mapped here; the real
/// legacy table has ~37 columns.
/// </summary>
public class PayrollPosition
{
    public int PositionId { get; set; }
    public string? PositionDesc { get; set; }
    public string? PositionCode { get; set; }
    public int? DepartmentId { get; set; }
    public int? DivisionId { get; set; }
    public int? JobProfileId { get; set; }
    public int? Status { get; set; }
    public bool? Enabled { get; set; }
    public int? ParentId { get; set; }
    public int? EmployeeId { get; set; }
    public int? HOD { get; set; }
    public string? HierarchyNo { get; set; }
    public string? UniqueId { get; set; }
}
