namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Const_Department table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// Top-level organisational unit. Each row carries effective-dated start
/// and end dates plus a manager position pointer. The overtime module
/// reads departments to display employees grouped by department.
///
/// Production SQL Server column types (verified 2026-05-11):
///   Department_ID int, DepartmentDesc varchar, Enabled bit,
///   DateCaptured datetime, CapturerID int, DateModified datetime,
///   ModifierID int, DepartmentCode varchar, StartDate datetime,
///   EndDate datetime, VatApportionment int, ManagerPositionID int,
///   ManagerStartDate datetime, ManagerEndDate datetime, FinYear varchar.
/// </summary>
public class ConstDepartment
{
    public int DepartmentId { get; set; }
    public string? DepartmentDesc { get; set; }
    public bool? Enabled { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerId { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierId { get; set; }
    public string? DepartmentCode { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? VatApportionment { get; set; }
    public int? ManagerPositionId { get; set; }
    public DateTime? ManagerStartDate { get; set; }
    public DateTime? ManagerEndDate { get; set; }
    public string? FinYear { get; set; }
}
