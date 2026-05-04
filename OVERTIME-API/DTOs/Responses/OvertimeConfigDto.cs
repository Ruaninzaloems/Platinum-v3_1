namespace PlatinumOvertime_API.DTOs.Responses;

public class OvertimeConfigDto
{
    public Guid Id { get; set; }
    public bool AllowOvertimeMultipleApproval { get; set; }
    public DateTime? StartDate { get; set; }
    public int CountingPeriodStartDay { get; set; }
    public int CountingPeriodEndDay { get; set; }
    public decimal MaximumMonthlyOvertimeHours { get; set; }
    public decimal ExceptionalMaximumOvertimeHours { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
