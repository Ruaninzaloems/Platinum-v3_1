namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Payroll_IRP5Code table.
/// Used to resolve the IRP5 code (e.g. 3607 = "Overtime") that classifies a
/// salary head. Owned by Platinum Payroll in production; created and seeded
/// in dev only (see SalaryHeadDataSeeder).
/// </summary>
public class PayrollIRP5Code
{
    public int IRP5CodeId { get; set; }
    public string? IRP5CodeDesc { get; set; }
    public bool? Enabled { get; set; }
    public int? IRP5Code { get; set; }
    public int? TransactionTypeId { get; set; }
}
