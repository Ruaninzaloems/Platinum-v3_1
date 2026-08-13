using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumBudget.Api.Models;

public class BudgetString
{
    public int Id { get; set; }
    public int BudgetVersionId { get; set; }
    public int? ProjectId { get; set; }
    public SourceModule SourceModule { get; set; } = SourceModule.Direct;

    public int ScoaItemId { get; set; }
    public int ScoaFundId { get; set; }
    public int ScoaFunctionId { get; set; }
    public int ScoaProjectId { get; set; }
    public int ScoaRegionId { get; set; }
    public int ScoaCostingId { get; set; }
    public int ScoaMscId { get; set; }

    public decimal Year1Amount { get; set; }
    public decimal Year2Amount { get; set; }
    public decimal Year3Amount { get; set; }

    [Column("M1")]  public decimal Month01 { get; set; }
    [Column("M2")]  public decimal Month02 { get; set; }
    [Column("M3")]  public decimal Month03 { get; set; }
    [Column("M4")]  public decimal Month04 { get; set; }
    [Column("M5")]  public decimal Month05 { get; set; }
    [Column("M6")]  public decimal Month06 { get; set; }
    [Column("M7")]  public decimal Month07 { get; set; }
    [Column("M8")]  public decimal Month08 { get; set; }
    [Column("M9")]  public decimal Month09 { get; set; }
    [Column("M10")] public decimal Month10 { get; set; }
    [Column("M11")] public decimal Month11 { get; set; }
    [Column("M12")] public decimal Month12 { get; set; }

    public string? OriginRefId { get; set; }
    public string? AssumptionsRef { get; set; }
    public string? Description { get; set; }
    public string? Hash { get; set; }

    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }

    public BudgetVersion BudgetVersion { get; set; } = null!;
    public Project? Project { get; set; }
    public ScoaItem ScoaItem { get; set; } = null!;
    public ScoaFund ScoaFund { get; set; } = null!;
    public ScoaFunction ScoaFunction { get; set; } = null!;
    public ScoaProject ScoaProjectNav { get; set; } = null!;
    public ScoaRegion ScoaRegion { get; set; } = null!;
    public ScoaCosting ScoaCosting { get; set; } = null!;
    public ScoaMsc ScoaMsc { get; set; } = null!;
    public ICollection<ValidationResult> ValidationResults { get; set; } = new List<ValidationResult>();
}
