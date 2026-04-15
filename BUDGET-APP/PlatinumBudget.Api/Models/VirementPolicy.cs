namespace PlatinumBudget.Api.Models;

public class VirementPolicy
{
    public int Id { get; set; }
    public int FinancialYearId { get; set; }
    public string PolicyVersion { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsLocked { get; set; }
    public string? LockedBy { get; set; }
    public DateTime? LockedOn { get; set; }
    public string CreatedBy { get; set; } = "System";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public FinancialYear FinancialYear { get; set; } = null!;
    public ICollection<VirementPolicyRule> Rules { get; set; } = new List<VirementPolicyRule>();
}

public class VirementPolicyRule
{
    public int Id { get; set; }
    public int VirementPolicyId { get; set; }
    public bool IsEnabled { get; set; } = true;
    public string Principle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ValidationRule { get; set; } = string.Empty;
    public string Severity { get; set; } = "Error";
    public string? SegmentType { get; set; }
    public string? FromSegmentFilter { get; set; }
    public string? ToSegmentFilter { get; set; }
    public decimal? ThresholdPercent { get; set; }
    public decimal? MaxAmount { get; set; }
    public bool RequiresCouncilApproval { get; set; }
    public int SortOrder { get; set; }

    public VirementPolicy Policy { get; set; } = null!;
}
