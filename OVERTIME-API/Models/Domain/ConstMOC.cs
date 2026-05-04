namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Const_MOC table — Method-of-Calculation
/// header. Each MOC binds a SalaryHead to one or more MOCDetail rows whose
/// Formula expression is evaluated to produce the overtime amount.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
/// </summary>
public class ConstMOC
{
    public int MOCId { get; set; }
    public int SalaryHeadId { get; set; }
    public bool? Enabled { get; set; }
    public decimal? StartDate { get; set; }
    public decimal? EndDate { get; set; }
}
