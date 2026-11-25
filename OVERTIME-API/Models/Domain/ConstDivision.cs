namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Const_Division table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// Hierarchical organisational sub-unit beneath a department. Carries
/// effective-dated start/end dates, an optional parent division, and a
/// manager position pointer. The overtime module reads divisions to
/// display employees grouped beneath their department.
///
/// Production SQL Server column types (verified 2026-05-11):
///   Division_ID int, DivisionDesc varchar, DivisionCode varchar,
///   DepartmentID int, DivisionParentID int, Enabled bit,
///   DateCaptured datetime, CapturerID int, DateModified datetime,
///   ModifierID int, SCOAFunctionID int, HRPayrollSCOAFundID int,
///   StartDate datetime, EndDate datetime, RegionID int, ProjectID int,
///   ManagerPositionID int, ManagerStartDate datetime, ManagerEndDate datetime,
///   ConditionOfServiceID int, DirectorateLevel bit, FinYear varchar.
/// </summary>
public class ConstDivision
{
    public int DivisionId { get; set; }
    public string? DivisionDesc { get; set; }
    public string? DivisionCode { get; set; }
    public int? DepartmentId { get; set; }
    public int? DivisionParentId { get; set; }
    public bool? Enabled { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerId { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierId { get; set; }
    public int? SCOAFunctionId { get; set; }
    public int? HRPayrollSCOAFundId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? RegionId { get; set; }
    public int? ProjectId { get; set; }
    public int? ManagerPositionId { get; set; }
    public DateTime? ManagerStartDate { get; set; }
    public DateTime? ManagerEndDate { get; set; }
    public int? ConditionOfServiceId { get; set; }
    public bool? DirectorateLevel { get; set; }
    public string? FinYear { get; set; }
}
