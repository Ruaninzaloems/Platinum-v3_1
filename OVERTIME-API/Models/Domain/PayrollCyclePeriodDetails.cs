namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Payroll_CyclePeriodDetails table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// One row per payroll cycle period (a month within a tax year for a given
/// cycle, e.g. Monthly Salary March 2026). Carries lockdown/approval/final-run
/// audit columns. The overtime module reads the active period to bind
/// captured overtime to the correct payroll run.
///
/// Production SQL Server column types (verified 2026-05-11):
///   Period_ID int, PeriodInTaxYear int, ProcessingMonth nvarchar,
///   PeriodStartDate datetime, PeriodEndDate datetime, Processed bit,
///   MunicipalityID int, FinancialYear nvarchar, Enabled bit,
///   DateCaptured datetime, CapturerID int, DateModified datetime,
///   ModifierID int, CycleID int, ProcessedDate datetime,
///   PayrollEFTFileName nvarchar, CycleModeID int, LockedDown bit,
///   LockDownDate datetime, LockedDownBy int, LockdownCancelledBy int,
///   ApprovedDate datetime, ApprovedBy int, FinalRunDate datetime,
///   FinalRunExecutedBy int, Reason nvarchar, LockDownCancelledDate datetime,
///   ApprovedStatus nvarchar, TrialRunDate datetime, TrialRunBy int,
///   TaxYear nvarchar, AdhocTypeID tinyint, AdhocTerminationTypeID tinyint.
/// </summary>
public class PayrollCyclePeriodDetails
{
    public int PeriodId { get; set; }
    public int? PeriodInTaxYear { get; set; }
    public string? ProcessingMonth { get; set; }
    public DateTime? PeriodStartDate { get; set; }
    public DateTime? PeriodEndDate { get; set; }
    public bool? Processed { get; set; }
    public int? MunicipalityId { get; set; }
    public string? FinancialYear { get; set; }
    public bool? Enabled { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerId { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierId { get; set; }
    public int? CycleId { get; set; }
    public DateTime? ProcessedDate { get; set; }
    public string? PayrollEFTFileName { get; set; }
    public int? CycleModeId { get; set; }
    public bool? LockedDown { get; set; }
    public DateTime? LockDownDate { get; set; }
    public int? LockedDownBy { get; set; }
    public int? LockdownCancelledBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public int? ApprovedBy { get; set; }
    public DateTime? FinalRunDate { get; set; }
    public int? FinalRunExecutedBy { get; set; }
    public string? Reason { get; set; }
    public DateTime? LockDownCancelledDate { get; set; }
    public string? ApprovedStatus { get; set; }
    public DateTime? TrialRunDate { get; set; }
    public int? TrialRunBy { get; set; }
    public string? TaxYear { get; set; }
    public byte? AdhocTypeId { get; set; }
    public byte? AdhocTerminationTypeId { get; set; }
}
