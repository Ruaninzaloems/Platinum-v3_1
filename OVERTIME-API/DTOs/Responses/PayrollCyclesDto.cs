namespace PlatinumOvertime_API.DTOs.Responses;

/// <summary>
/// One row from the "current payroll cycles" query — mirrors the
/// Payroll_GetPayrollCycleDetailsStatus stored-procedure output.
/// </summary>
public class PayrollCycleStatusDto
{
    public string Payroll   { get; init; } = "";
    public string CycleType { get; init; } = "";
    public string Period    { get; init; } = "";
    /// <summary>Open | Approved | LockedDown | Processed</summary>
    public string Status    { get; init; } = "";
}

/// <summary>
/// Response envelope for GET /api/dashboard/payroll-cycles.
/// </summary>
public class PayrollCyclesResponseDto
{
    public string TaxYear { get; init; } = "";
    public List<PayrollCycleStatusDto> Cycles { get; init; } = new();
}
