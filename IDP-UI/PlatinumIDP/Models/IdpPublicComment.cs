using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class IdpPublicComment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int CycleId { get; set; }

    [Required]
    [MaxLength(100)]
    public string SourceChannel { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Ward { get; set; }

    [MaxLength(200)]
    public string? Region { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    [Required]
    public string CommentText { get; set; } = string.Empty;

    public int? LinkedProjectId { get; set; }

    public int? LinkedObjectiveId { get; set; }

    [MaxLength(200)]
    public string? SubmitterName { get; set; }

    public DateTime? SubmissionDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Received";

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("CycleId")]
    public IdpCycle? Cycle { get; set; }

    public ICollection<IdpCommentResponse> Responses { get; set; } = new List<IdpCommentResponse>();
}
