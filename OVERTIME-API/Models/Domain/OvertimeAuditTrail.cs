namespace PlatinumOvertime_API.Models.Domain;

public class OvertimeAuditTrail
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? PerformedBy { get; set; }
    public string? Details { get; set; }
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
}
