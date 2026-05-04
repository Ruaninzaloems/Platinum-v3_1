namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Const_Department table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// Top-level organisational unit. Each row carries effective-dated start
/// and end dates plus a manager position pointer. The overtime module
/// reads departments to display employees grouped by department.
/// </summary>
public class ConstDepartment
{
    public int DepartmentId { get; set; }
    public string? DepartmentDesc { get; set; }
    public bool? Enabled { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? DateCaptured { get; set; }

    public int? CapturerId { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? DateModified { get; set; }

    public int? ModifierId { get; set; }
    public string? DepartmentCode { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? StartDate { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? EndDate { get; set; }

    public decimal? VatApportionment { get; set; }
    public int? ManagerPositionId { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? ManagerStartDate { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? ManagerEndDate { get; set; }

    public string? FinYear { get; set; }
}
