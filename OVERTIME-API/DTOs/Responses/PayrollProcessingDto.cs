namespace PlatinumOvertime_API.DTOs.Responses;

/// <summary>
/// One row in the "Approved for Payment" grid on the Payroll Processing page.
/// </summary>
public class PayrollProcessingRowDto
{
    public Guid Id { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public int? LegacyEmployeeId { get; set; }
    public int? LegacyDepartmentId { get; set; }
    public string? LegacyDepartmentName { get; set; }
    public int? LegacyDivisionId { get; set; }
    public string? LegacyDivisionName { get; set; }
    public string? PositionId { get; set; }
    public string? PositionDescription { get; set; }
    public DateTime OvertimeDate { get; set; }
    public string SalaryHeadName { get; set; } = string.Empty;
    public int SalaryHeadId { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public decimal Hours { get; set; }
    public decimal Amount { get; set; }
    public string? RecommenderEmployeeName { get; set; }
    public string? ApproverEmployeeName { get; set; }
    public string? CapturedByName { get; set; }
    public bool IsExcess { get; set; }
    public int? PeriodId { get; set; }
    public string? PeriodName { get; set; }
    public int? CycleId { get; set; }
    public string? CycleName { get; set; }
    public int Status { get; set; }
    public string StatusLabel { get; set; } = string.Empty;
}

/// <summary>
/// Summary aggregate returned alongside the grid data so the UI footer
/// can show totals without re-aggregating client-side.
/// </summary>
public class PayrollProcessingSummaryDto
{
    public int TotalRows { get; set; }
    public decimal TotalHours { get; set; }
    public decimal TotalAmount { get; set; }
    public List<PayrollProcessingRowDto> Rows { get; set; } = new();
}
