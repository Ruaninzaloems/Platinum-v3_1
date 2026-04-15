using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class IdpSubmissionLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int CycleId { get; set; }

    public int? DocumentVersionId { get; set; }

    [Required]
    [MaxLength(100)]
    public string SubmissionType { get; set; } = "GoMuni";

    [MaxLength(200)]
    public string? ReferenceNumber { get; set; }

    public DateTime? SubmissionDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string ValidationStatus { get; set; } = "Pending";

    public string? ValidationFeedback { get; set; }

    public string? AdoptedIdpFileName { get; set; }

    public string? CouncilResolutionFileName { get; set; }

    public string? MinutesFileName { get; set; }

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";

    [ForeignKey("CycleId")]
    public IdpCycle? Cycle { get; set; }

    [ForeignKey("DocumentVersionId")]
    public IdpDocumentVersion? DocumentVersion { get; set; }
}
