namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Const_MOC table — Method-of-Calculation
/// header. Each MOC binds a SalaryHead to one or more MOCDetail rows whose
/// Formula expression is evaluated to produce the overtime amount.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// Production SQL Server column types (verified 2026-05-11):
///   MOC_ID int, SalaryHeadID int, Enabled bit,
///   StartDate datetime, EndDate datetime.
/// </summary>
public class ConstMOC
{
    public int MOCId { get; set; }
    public int SalaryHeadId { get; set; }
    public bool? Enabled { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
