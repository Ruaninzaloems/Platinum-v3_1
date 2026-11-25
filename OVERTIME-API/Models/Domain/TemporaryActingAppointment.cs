namespace PlatinumOvertime_API.Models.Domain;

public class TemporaryActingAppointment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid PositionApprovalConfigId { get; set; }
    public PositionApprovalConfig? PositionApprovalConfig { get; set; }

    /// <summary>Acting employee from external Platinum.</summary>
    public string ActingEmployeeId { get; set; } = string.Empty;
    public string ActingEmployeeName { get; set; } = string.Empty;

    /// <summary>Position the employee is acting INTO.</summary>
    public string ActingInPositionId { get; set; } = string.Empty;
    public string ActingInPositionDescription { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
