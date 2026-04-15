namespace PlatinumBudget.Api.Models;

public class ValidationResult
{
    public int Id { get; set; }
    public Guid ValidationRunId { get; set; }
    public int BudgetVersionId { get; set; }
    public int? BudgetStringId { get; set; }
    public ValidationStatus Status { get; set; }
    public string RuleCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? SuggestedFix { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? UserId { get; set; }

    public BudgetVersion BudgetVersion { get; set; } = null!;
    public BudgetString? BudgetString { get; set; }
}
