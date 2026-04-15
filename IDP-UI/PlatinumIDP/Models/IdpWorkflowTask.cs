using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class IdpWorkflowTask
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int CycleId { get; set; }

    public int? DocumentVersionId { get; set; }

    [Required]
    [MaxLength(100)]
    public string TaskType { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? AssignedRole { get; set; }

    [MaxLength(200)]
    public string? AssignedTo { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Pending";

    public string? Comments { get; set; }

    public int Sequence { get; set; }

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? CompletedBy { get; set; }
    public DateTime? CompletedDate { get; set; }
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("DocumentVersionId")]
    public IdpDocumentVersion? DocumentVersion { get; set; }
}
