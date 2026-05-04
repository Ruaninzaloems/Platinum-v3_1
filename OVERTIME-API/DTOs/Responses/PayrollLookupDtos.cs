namespace PlatinumOvertime_API.DTOs.Responses;

/// <summary>
/// Read-only projection of a Const_Department row, surfaced as a dropdown
/// option in the overtime capture form. Inactive rows are filtered out by
/// the lookup endpoint so the UI never has to know about <c>Enabled</c>.
/// </summary>
public class ConstDepartmentDto
{
    public int DepartmentId { get; set; }
    public string DepartmentDesc { get; set; } = string.Empty;
    public string? DepartmentCode { get; set; }
}

/// <summary>
/// Read-only projection of a Const_Division row. Includes the parent
/// DepartmentId so the capture form can keep the division dropdown in
/// sync with the department selection without an extra round-trip.
/// </summary>
public class ConstDivisionDto
{
    public int DivisionId { get; set; }
    public string DivisionDesc { get; set; } = string.Empty;
    public string? DivisionCode { get; set; }
    public int? DepartmentId { get; set; }
}

/// <summary>
/// Read-only projection of a Const_Cycle row. The cycle is the grouping
/// key for <see cref="PayrollCyclePeriodDto"/> so the period dropdown can
/// scope itself to the picked cycle.
/// </summary>
public class ConstCycleDto
{
    public int CycleId { get; set; }
    public string CycleDesc { get; set; } = string.Empty;
}

/// <summary>
/// Read-only projection of a Payroll_CyclePeriodDetails row. The
/// human-friendly <see cref="DisplayName"/> stitches together the
/// processing month and tax/financial year so the dropdown reads as
/// "March 2026/2027" without the UI having to know the underlying
/// columns.
/// </summary>
public class PayrollCyclePeriodDto
{
    public int PeriodId { get; set; }
    public int? PeriodInTaxYear { get; set; }
    public string? ProcessingMonth { get; set; }
    public string? FinancialYear { get; set; }
    public string? TaxYear { get; set; }
    public int? CycleId { get; set; }
    public int? CycleModeId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
}
