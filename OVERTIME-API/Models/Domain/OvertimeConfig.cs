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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Sentinel value: always 'X'. A unique index on this column enforces the
    /// singleton row at the database level (Business Rule #1).
    /// </summary>
    public string SingletonLock { get; set; } = "X";
}
