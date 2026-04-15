using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class IdpMilestone
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int PhaseId { get; set; }

    [Required]
    public int CycleId { get; set; }

    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [MaxLength(200)]
    public string? AssignedTo { get; set; }

    public DateTime? DueDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Not Started";

    public int Progress { get; set; }

    public bool IsMandatory { get; set; }

    public string? EvidenceUrl { get; set; }

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("PhaseId")]
    public IdpProcessPhase? Phase { get; set; }
}
