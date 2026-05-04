namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Payroll_EmployeePayrollDefinition (EPD)
/// table. Each row says "Employee X is entitled to SalaryHead Y at Z%". The
/// overtime module reads this to know which overtime types each employee may
/// be paid against. Owned by Platinum Payroll in production; in dev only
/// rows whose SalaryHead is one of the overtime/back-pay heads are kept.
/// </summary>
public class PayrollEmployeePayrollDefinition
{
    public int EmployeePayrollDefinitionId { get; set; }
    public int PayrollSalaryHeadId { get; set; }
    public int EmployeeId { get; set; }
    public decimal? Percentage { get; set; }
    public bool? Enabled { get; set; }
}
