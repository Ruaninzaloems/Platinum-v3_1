namespace PlatinumOvertime_API.Models.Domain;

public class PositionReportingRelationship
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid PositionApprovalConfigId { get; set; }
    public PositionApprovalConfig? PositionApprovalConfig { get; set; }

    /// <summary>The reporting/parent position from external Platinum.</summary>
    public string ReportsToPositionId { get; set; } = string.Empty;
    public string ReportsToPositionDescription { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
