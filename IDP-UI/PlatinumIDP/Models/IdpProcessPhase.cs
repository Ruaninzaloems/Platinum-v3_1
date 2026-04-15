using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class IdpProcessPhase
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int CycleId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int OrderIndex { get; set; }

    [MaxLength(200)]
    public string? Owner { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int Progress { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Not Started";

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("CycleId")]
    public IdpCycle? Cycle { get; set; }

    public ICollection<IdpMilestone> Milestones { get; set; } = new List<IdpMilestone>();
}
