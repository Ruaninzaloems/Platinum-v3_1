namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Payroll_SalaryHead table.
/// Owned by Platinum Payroll in production; created and seeded in dev only
/// (see SalaryHeadDataSeeder). Only the columns the overtime module needs are
/// mapped — the real table has 21 columns.
/// </summary>
public class PayrollSalaryHead
{
    public int SalaryHeadId { get; set; }
    public string? SalaryHeadName { get; set; }
    public string? SalaryHeadTitle { get; set; }
    public int? CalculationFlag { get; set; }
    public int? IRP5CodeId { get; set; }
    public bool? Enabled { get; set; }
}
