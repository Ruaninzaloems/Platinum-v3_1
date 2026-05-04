namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// Per-position approval flags configured in the new
/// Position Approval Setup page (Business Rules #2-#4).
/// PositionId references the EXTERNAL Platinum positions API; not a FK in this DB.
/// </summary>
public class PositionApprovalConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string PositionId { get; set; } = string.Empty;

    public string PositionDescription { get; set; } = string.Empty;

    public bool IsOvertimeRecommender { get; set; }
    public bool IsOvertimeApprover { get; set; }
    public bool IsDepartmentExcessOvertimeApprover { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedBy { get; set; }

    public ICollection<PositionReportingRelationship> ReportingRelationships { get; set; } =
        new List<PositionReportingRelationship>();

    public ICollection<TemporaryActingAppointment> ActingAppointments { get; set; } =
        new List<TemporaryActingAppointment>();
}
