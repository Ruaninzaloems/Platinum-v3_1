namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Const_Cycle table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// One row per payroll cycle (Monthly Salary, Councillors, Ad-hoc Termination,
/// etc.). The overtime module reads cycle metadata when binding overtime
/// transactions to a payroll period.
///
/// Production SQL Server column types (verified 2026-05-11):
///   Cycle_ID int, CycleDesc varchar, Enabled bit,
///   DateCaptured datetime, CapturerID int,
///   DateModified datetime, ModifierID int,
///   CycleTypeID int, SkipInNewTaxYear bit.
/// </summary>
public class ConstCycle
{
    public int CycleId { get; set; }
    public string? CycleDesc { get; set; }
    public bool? Enabled { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerId { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierId { get; set; }
    public int? CycleTypeId { get; set; }
    public bool? SkipInNewTaxYear { get; set; }
}
