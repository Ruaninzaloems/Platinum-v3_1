namespace PlatinumOvertime_API.DTOs.Responses;

/// <summary>
/// A position row enriched with whether it has an approval configuration saved.
/// Used by the Position Approval Setup list view.
/// </summary>
public class PositionListItemDto
{
    public string Id { get; set; } = string.Empty;
    public string PositionCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string DivisionId { get; set; } = string.Empty;
    public string DivisionCode { get; set; } = string.Empty;
    public string DivisionName { get; set; } = string.Empty;
    public bool IsConfigured { get; set; }

    /// <summary>
    /// Employee currently assigned to this position (PositionId join on
    /// Payroll_Employee). Empty when the position has no incumbent.
    /// </summary>
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeFirstName { get; set; } = string.Empty;
    public string EmployeeSurname { get; set; } = string.Empty;

    /// <summary>
    /// Description of the immediate parent ("Reports To") position, derived
    /// from the most recent currently-effective PositionReportingRelationship
    /// for this position. Empty when the position has no reporting line set.
    /// </summary>
    public string ReportsToPositionDescription { get; set; } = string.Empty;
}

public class PositionsSummaryDto
{
    public int Total { get; set; }
    public int Configured { get; set; }
    public int NotConfigured { get; set; }
}
