using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class IdpDocumentVersion
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int CycleId { get; set; }

    public int VersionNumber { get; set; } = 1;

    [Required]
    [MaxLength(50)]
    public string VersionType { get; set; } = "Draft";

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";

    public string? ContentJson { get; set; }

    public string? ResolutionNumber { get; set; }

    public DateTime? ResolutionDate { get; set; }

    public string? CouncilMeetingRef { get; set; }

    public bool IsLocked { get; set; } = false;

    public DateTime? LockedDate { get; set; }

    
    public int? LockedBy { get; set; }

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("CycleId")]
    public IdpCycle? Cycle { get; set; }

    public ICollection<IdpWorkflowTask> WorkflowTasks { get; set; } = new List<IdpWorkflowTask>();
}
