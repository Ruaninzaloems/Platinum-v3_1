namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Payroll_CyclePeriodDetails table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// One row per payroll cycle period (a month within a tax year for a given
/// cycle, e.g. Monthly Salary March 2026). Carries lockdown/approval/final-run
/// audit columns. The overtime module reads the active period to bind
/// captured overtime to the correct payroll run.
/// </summary>
public class PayrollCyclePeriodDetails
{
    public int PeriodId { get; set; }
    public int? PeriodInTaxYear { get; set; }
    public string? ProcessingMonth { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? PeriodStartDate { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? PeriodEndDate { get; set; }

    public bool? Processed { get; set; }
    public int? MunicipalityId { get; set; }
    public string? FinancialYear { get; set; }
    public bool? Enabled { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? DateCaptured { get; set; }

    public int? CapturerId { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? DateModified { get; set; }

    public int? ModifierId { get; set; }
    public int? CycleId { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? ProcessedDate { get; set; }

    public string? PayrollEFTFileName { get; set; }
    public int? CycleModeId { get; set; }
    public bool? LockedDown { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? LockDownDate { get; set; }

    public int? LockedDownBy { get; set; }
    public int? LockdownCancelledBy { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? ApprovedDate { get; set; }

    public int? ApprovedBy { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? FinalRunDate { get; set; }

    public int? FinalRunExecutedBy { get; set; }
    public string? Reason { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? LockDownCancelledDate { get; set; }

    public int? ApprovedStatus { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? TrialRunDate { get; set; }

    public int? TrialRunBy { get; set; }
    public string? TaxYear { get; set; }
    public int? AdhocTypeId { get; set; }
    public int? AdhocTerminationTypeId { get; set; }
}
