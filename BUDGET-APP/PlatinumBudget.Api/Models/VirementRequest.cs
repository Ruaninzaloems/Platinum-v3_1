namespace PlatinumBudget.Api.Models;

public class VirementRequest
{
    public int Id { get; set; }
    public string VirementNumber { get; set; } = string.Empty;
    public int BudgetVersionId { get; set; }
    public VirementStatus Status { get; set; } = VirementStatus.Draft;
    public string BudgetType { get; set; } = "Operational";
    public int CurrentApprovalLevel { get; set; }
    public bool RequiresCouncilApproval { get; set; }

    public int FromScoaItemId { get; set; }
    public int FromScoaFundId { get; set; }
    public int FromScoaFunctionId { get; set; }
    public int FromScoaProjectId { get; set; }
    public int FromScoaRegionId { get; set; }
    public int FromScoaCostingId { get; set; }
    public int FromScoaMscId { get; set; }

    public int ToScoaItemId { get; set; }
    public int ToScoaFundId { get; set; }
    public int ToScoaFunctionId { get; set; }
    public int ToScoaProjectId { get; set; }
    public int ToScoaRegionId { get; set; }
    public int ToScoaCostingId { get; set; }
    public int ToScoaMscId { get; set; }

    public decimal Amount { get; set; }
    public string Motivation { get; set; } = string.Empty;
    public string? PolicyReference { get; set; }
    public decimal? ThresholdPercentage { get; set; }
    public bool ThresholdExceeded { get; set; }

    public decimal FromOriginalBudget { get; set; }
    public decimal FromPriorVirements { get; set; }
    public decimal FromAdjustments { get; set; }
    public decimal FromCurrentBudget { get; set; }
    public decimal FromAvailableBudget { get; set; }

    public decimal ToOriginalBudget { get; set; }
    public decimal ToPriorVirements { get; set; }
    public decimal ToAdjustments { get; set; }
    public decimal ToCurrentBudget { get; set; }
    public decimal ToAvailableBudget { get; set; }

    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedOn { get; set; }
    public string? RejectedBy { get; set; }
    public DateTime? RejectedOn { get; set; }
    public string? RejectionReason { get; set; }

    public BudgetVersion BudgetVersion { get; set; } = null!;
    public ICollection<BudgetApproval> Approvals { get; set; } = new List<BudgetApproval>();
}
