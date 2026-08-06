using System.ComponentModel.DataAnnotations;

namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// Singleton configuration row for the overtime module (Business Rule #1).
/// </summary>
public class OvertimeConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public bool AllowOvertimeMultipleApproval { get; set; }

    public DateTime? StartDate { get; set; }

    [Range(1, 31)]
    public int CountingPeriodStartDay { get; set; } = 1;

    [Range(1, 31)]
    public int CountingPeriodEndDay { get; set; } = 31;

    public decimal MaximumMonthlyOvertimeHours { get; set; } = 40m;

    public decimal ExceptionalMaximumOvertimeHours { get; set; } = 60m;

    /// <summary>
    /// Optional. When set, the employee currently holding this position acts as a
    /// system-wide master approver: they can recommend, approve, return, or reject
    /// any overtime transaction regardless of the normal approval chain.
    /// Stored as the string form of the Payroll_Position.Position_ID integer.
    /// </summary>
    public string? OverridePositionId { get; set; }

    /// <summary>Snapshot of the position description at the time it was saved.</summary>
    public string? OverridePositionDescription { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Sentinel value: always 'X'. A unique index on this column enforces the
    /// singleton row at the database level (Business Rule #1).
    /// </summary>
    public string SingletonLock { get; set; } = "X";
}
