namespace PlatinumBudget.Api.Models;

public class BudgetVersion
{
    public int Id { get; set; }
    public int FinancialYearId { get; set; }
    public BudgetVersionType VersionType { get; set; }
    public string VersionName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public BudgetVersionStatus Status { get; set; } = BudgetVersionStatus.Draft;
    public int? ParentVersionId { get; set; }
    public DateTime? CouncilAdoptionDate { get; set; }
    public string? LgdrsSubmissionRef { get; set; }
    public string? LockedBy { get; set; }
    public DateTime? LockedOn { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }

    public FinancialYear FinancialYear { get; set; } = null!;
    public BudgetVersion? ParentVersion { get; set; }
    public ICollection<BudgetString> BudgetStrings { get; set; } = new List<BudgetString>();
    public ICollection<BudgetApproval> Approvals { get; set; } = new List<BudgetApproval>();
    public ICollection<ValidationResult> ValidationResults { get; set; } = new List<ValidationResult>();
    public ICollection<IntegrationDispatch> Dispatches { get; set; } = new List<IntegrationDispatch>();
}
