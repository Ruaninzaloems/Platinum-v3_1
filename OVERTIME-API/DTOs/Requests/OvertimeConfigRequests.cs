namespace PlatinumOvertime_API.DTOs.Requests;

public class UpdateOvertimeConfigRequest
{
    public bool AllowOvertimeMultipleApproval { get; set; }
    public DateTime? StartDate { get; set; }
    public int CountingPeriodStartDay { get; set; }
    public int CountingPeriodEndDay { get; set; }
    public decimal MaximumMonthlyOvertimeHours { get; set; }
    public decimal ExceptionalMaximumOvertimeHours { get; set; }
}
