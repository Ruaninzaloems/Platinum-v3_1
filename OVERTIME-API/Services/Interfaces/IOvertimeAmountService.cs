namespace PlatinumOvertime_API.Services.Interfaces;

/// <summary>
/// Resolves the active MOCDetail for a salary head and evaluates its
/// formula against an employee's payroll inputs to produce the rand amount
/// owed for an overtime transaction.
/// </summary>
public interface IOvertimeAmountService
{
    Task<OvertimeAmountResult> CalculateAsync(
        int employeeId, int salaryHeadId, decimal hours, CancellationToken ct = default);

    Task<List<OvertimeTypeOption>> GetOvertimeTypesForEmployeeAsync(
        int employeeId, CancellationToken ct = default);
}

public class OvertimeAmountResult
{
    public decimal Amount { get; set; }
    public string Formula { get; set; } = string.Empty;
    public string SalaryHeadName { get; set; } = string.Empty;
    public Dictionary<string, decimal> Inputs { get; set; } = new();
}

public class OvertimeTypeOption
{
    public int SalaryHeadId { get; set; }
    public string SalaryHeadName { get; set; } = string.Empty;
    public string SalaryHeadTitle { get; set; } = string.Empty;
    public int? IRP5Code { get; set; }
    public string? IRP5CodeDesc { get; set; }
    public string? Formula { get; set; }
}
