using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class PriorityProjectScore
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int FrameworkId { get; set; }

    [Required]
    public int ProjectId { get; set; }

    [Required]
    public int CriteriaId { get; set; }

    public int? HumanScore { get; set; }

    public int? AiScore { get; set; }

    [Column(TypeName = "decimal(7,2)")]
    public decimal BlendedScore { get; set; } = 0m;

    public string? Comments { get; set; }

    
    public int? ScoredBy { get; set; }

    public DateTime? ScoredDate { get; set; }

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("FrameworkId")]
    public PriorityFramework? Framework { get; set; }

    [ForeignKey("ProjectId")]
    public IdpProject? Project { get; set; }

    [ForeignKey("CriteriaId")]
    public PriorityCriteria? Criteria { get; set; }
}
