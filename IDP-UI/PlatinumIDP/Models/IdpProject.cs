using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class IdpProject
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int CycleId { get; set; }

    public int? ObjectiveId { get; set; }

    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string Classification { get; set; } = "Operational";

    [Required]
    [MaxLength(200)]
    public string Department { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Ward { get; set; }

    [MaxLength(200)]
    public string? Region { get; set; }

    [Required]
    [MaxLength(50)]
    public string Priority { get; set; } = "Medium";

    public int PriorityRanking { get; set; } = 0;

    public int? OverrideRank { get; set; }

    [Column(TypeName = "decimal(15,2)")]
    public decimal? BudgetAmount { get; set; }

    [MaxLength(200)]
    public string? FundingSource { get; set; }

    public string? FundingSourceSummary { get; set; }

    [MaxLength(100)]
    public string? MscoaProjectSegment { get; set; }

    [MaxLength(100)]
    public string? MscoaFundSegment { get; set; }

    [MaxLength(100)]
    public string? MscoaRegionSegment { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Column(TypeName = "double precision")]
    public double? Latitude { get; set; }

    [Column(TypeName = "double precision")]
    public double? Longitude { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Planned";

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("CycleId")]
    public IdpCycle? Cycle { get; set; }

    [ForeignKey("ObjectiveId")]
    public IdpStrategicObjective? Objective { get; set; }

    public ICollection<IdpProjectIndicator> Indicators { get; set; } = new List<IdpProjectIndicator>();
    public ICollection<ProjectObjectiveLink> ObjectiveLinks { get; set; } = new List<ProjectObjectiveLink>();
}
