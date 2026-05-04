namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Const_Division table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// Hierarchical organisational sub-unit beneath a department. Carries
/// effective-dated start/end dates, an optional parent division, and a
/// manager position pointer. The overtime module reads divisions to
/// display employees grouped beneath their department.
/// </summary>
public class ConstDivision
{
    public int DivisionId { get; set; }
    public string? DivisionDesc { get; set; }
    public string? DivisionCode { get; set; }
    public int? DepartmentId { get; set; }
    public int? DivisionParentId { get; set; }
    public bool? Enabled { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? DateCaptured { get; set; }

    public int? CapturerId { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? DateModified { get; set; }

    public int? ModifierId { get; set; }
    public int? SCOAFunctionId { get; set; }
    public int? HRPayrollSCOAFundId { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? StartDate { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? EndDate { get; set; }

    public int? RegionId { get; set; }
    public int? ProjectId { get; set; }
    public int? ManagerPositionId { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? ManagerStartDate { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? ManagerEndDate { get; set; }

    public int? ConditionOfServiceId { get; set; }
    public int? DirectorateLevel { get; set; }
    public string? FinYear { get; set; }
}
