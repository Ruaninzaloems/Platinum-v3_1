namespace PlatinumBudget.Api.Models;

public class CouncilBudgetApproval
{
    public int Id { get; set; }
    public string FinancialYear { get; set; } = string.Empty;
    public string ApprovalType { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public bool Approved { get; set; }
    public DateTime? CouncilApprovedDate { get; set; }
    public string? VersionName { get; set; }
    public string? Comments { get; set; }
    public DateTime SubmittedOn { get; set; } = DateTime.UtcNow;
    public string SubmittedBy { get; set; } = "System Admin";
}
