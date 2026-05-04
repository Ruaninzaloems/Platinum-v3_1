using System.ComponentModel.DataAnnotations;

namespace PlatinumOvertime_API.DTOs.Requests;

/// <summary>
/// Body for <c>POST /api/payroll-processing/send-to-payroll</c>.
/// </summary>
public class SendToPayrollRequest
{
    [Required, MinLength(1)]
    public List<Guid> SelectedIds { get; set; } = new();

    [Required]
    public int PeriodId { get; set; }
}
