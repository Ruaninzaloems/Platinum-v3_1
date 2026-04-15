namespace PlatinumBudget.Api.Models;

public class BudgetApproval
{
    public int Id { get; set; }
    public ApprovalEntityType EntityType { get; set; }
    public int EntityId { get; set; }
    public int? BudgetVersionId { get; set; }
    public int Step { get; set; }
    public ApprovalDecision Decision { get; set; }
    public string? Comment { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public BudgetVersion? BudgetVersion { get; set; }
}
