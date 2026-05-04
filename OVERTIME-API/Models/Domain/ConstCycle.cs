namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Const_Cycle table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// One row per payroll cycle (Monthly Salary, Councillors, Ad-hoc Termination,
/// etc.). The overtime module reads cycle metadata when binding overtime
/// transactions to a payroll period.
/// </summary>
public class ConstCycle
{
    public int CycleId { get; set; }
    public string? CycleDesc { get; set; }
    public bool? Enabled { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? DateCaptured { get; set; }

    public int? CapturerId { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? DateModified { get; set; }

    public int? ModifierId { get; set; }
    public int? CycleTypeId { get; set; }
    public bool? SkipInNewTaxYear { get; set; }
}
