namespace PlatinumBudget.Api.Models;

public class Project
{
    public int Id { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IdpLink { get; set; }
    public string? IdpPriorityArea { get; set; }
    public string? IdpStrategicObjective { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Draft;
    public ProjectType Type { get; set; }
    public int? DepartmentId { get; set; }
    public string? Ward { get; set; }
    public string? GpsCoordinates { get; set; }
    public string? ProjectManager { get; set; }
    public string? ContractorName { get; set; }
    public string? ContractNumber { get; set; }
    public string? FundingSource { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal? TotalProjectCost { get; set; }
    public bool IsRegistered { get; set; } = false;

    public int? DefaultScoaItemId { get; set; }
    public int? DefaultScoaFundId { get; set; }
    public int? DefaultScoaFunctionId { get; set; }
    public int? DefaultScoaRegionId { get; set; }
    public int? DefaultScoaCostingId { get; set; }
    public int? DefaultScoaMscId { get; set; }

    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }

    public Department? Department { get; set; }
    public ICollection<BudgetString> BudgetStrings { get; set; } = new List<BudgetString>();
    public ICollection<ProjectBudgetLine> ProjectBudgetLines { get; set; } = new List<ProjectBudgetLine>();
}

public class ProjectBudgetLine
{
    public int Id { get; set; }
    public int ProjectId { get; set; }

    public int ScoaItemId { get; set; }
    public int ScoaFundId { get; set; }
    public int ScoaFunctionId { get; set; }
    public int ScoaRegionId { get; set; }
    public int ScoaCostingId { get; set; }
    public int? DepartmentId { get; set; }

    public decimal Year1Amount { get; set; }
    public decimal Year2Amount { get; set; }
    public decimal Year3Amount { get; set; }

    public decimal Month01 { get; set; }
    public decimal Month02 { get; set; }
    public decimal Month03 { get; set; }
    public decimal Month04 { get; set; }
    public decimal Month05 { get; set; }
    public decimal Month06 { get; set; }
    public decimal Month07 { get; set; }
    public decimal Month08 { get; set; }
    public decimal Month09 { get; set; }
    public decimal Month10 { get; set; }
    public decimal Month11 { get; set; }
    public decimal Month12 { get; set; }

    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }

    public Project Project { get; set; } = null!;
    public ScoaItem ScoaItem { get; set; } = null!;
    public ScoaFund ScoaFund { get; set; } = null!;
    public ScoaFunction ScoaFunction { get; set; } = null!;
    public ScoaRegion ScoaRegion { get; set; } = null!;
    public ScoaCosting ScoaCosting { get; set; } = null!;
    public Department? Department { get; set; }
}
