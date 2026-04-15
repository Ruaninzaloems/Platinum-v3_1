namespace PlatinumBudget.Api.Models;

public class IntegrationDispatch
{
    public int Id { get; set; }
    public int BudgetVersionId { get; set; }
    public string TargetModule { get; set; } = string.Empty;
    public DispatchStatus Status { get; set; } = DispatchStatus.Pending;
    public DateTime? LastAttemptOn { get; set; }
    public string? Error { get; set; }
    public DateTime? AcknowledgedOn { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public BudgetVersion BudgetVersion { get; set; } = null!;
}
