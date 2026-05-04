namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// Maps to the legacy <c>Payroll_EmployeeOvertime</c> table in the Platinum Payroll
/// SQL Server database.  Excluded from EF migrations — in production the table is
/// owned by Platinum Payroll; in development a seeder creates it.
///
/// Column names match the production SQL Server schema exactly so the same EF
/// queries work unchanged on both providers.
/// </summary>
public class PayrollEmployeeOvertime
{
    public int EmployeeOverTimeId { get; set; }
    public int EmployeeId { get; set; }
    public DateTime OverTimeDate { get; set; }
    public decimal OverTimeHour { get; set; }
    public bool OverTimeFlag { get; set; }
    public string? FinancialYear { get; set; }
    public bool Enabled { get; set; }
    public int CapturerId { get; set; }
    public DateTime DateCaptured { get; set; }
    public int? ModifierId { get; set; }
    public DateTime? DateModified { get; set; }
    public int? MOCId { get; set; }
    public int? EarDedTypeId { get; set; }
    public int? PeriodId { get; set; }
    public string? TaxYear { get; set; }
    public bool? IsApprovalRequired { get; set; }
    public bool? IsApproved { get; set; }
    public string? RejectedReason { get; set; }
    public int? ApprovedOrRejectedBy { get; set; }
    public DateTime? ApprovedOrRejectedDate { get; set; }
    public string? CostDesc { get; set; }
    public decimal? TotalAmount { get; set; }
    public int? SupportingDocsId { get; set; }
    public bool? IsCorrection { get; set; }
    public int? LinkId { get; set; }
    public decimal? MOCValue { get; set; }
    public decimal? Rate { get; set; }
    public int? SalaryHeadId { get; set; }
    public bool? IsBulk { get; set; }
    public int? ProcessedOnPeriodId { get; set; }
    public bool? Processed { get; set; }
    public bool? ExcludeFromPayment { get; set; }
    public bool TerminationEscalated { get; set; }
    public DateTime? EscalatedDate { get; set; }
    public int? CapturedDuringPeriodId { get; set; }
}
