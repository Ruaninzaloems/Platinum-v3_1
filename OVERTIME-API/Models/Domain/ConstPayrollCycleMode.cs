namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Const_Payroll_CycleMode_sys table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// Two known rows: 1 = Normal, 2 = Special.
///
/// Production SQL Server column types (from user-supplied DDL 2026-06-03):
///   CycleMode_ID int IDENTITY, CycleModeDesc nvarchar(200), Enabled int,
///   DateCaptured datetime, CapturerID int,
///   DateModified datetime NULL, ModifierID int NULL.
/// </summary>
public class ConstPayrollCycleMode
{
    public int CycleModeId    { get; set; }
    public string? CycleModeDesc { get; set; }
    public int? Enabled       { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerId    { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierId    { get; set; }
}
