using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class PriorityFramework
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    public int Version { get; set; } = 1;

    public int? CycleId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";

    [Column(TypeName = "decimal(5,2)")]
    public decimal HumanWeight { get; set; } = 80m;

    [Column(TypeName = "decimal(5,2)")]
    public decimal AiWeight { get; set; } = 20m;

    [Required]
    [MaxLength(50)]
    public string AiMode { get; set; } = "Disabled";

    public int ScaleMin { get; set; } = 0;

    public int ScaleMax { get; set; } = 5;

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("CycleId")]
    public IdpCycle? Cycle { get; set; }

    public ICollection<PriorityCriteria> Criteria { get; set; } = new List<PriorityCriteria>();
    public ICollection<PriorityScoringScale> ScoringScales { get; set; } = new List<PriorityScoringScale>();
    public ICollection<PriorityProjectScore> ProjectScores { get; set; } = new List<PriorityProjectScore>();
    public ICollection<PriorityFrameworkAudit> AuditTrail { get; set; } = new List<PriorityFrameworkAudit>();
}
