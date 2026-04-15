using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class IdpCommentResponse
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int CommentId { get; set; }

    [Required]
    public string ResponseText { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ResponsibleOfficial { get; set; }

    public DateTime? ResponseDate { get; set; }

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("CommentId")]
    public IdpPublicComment? Comment { get; set; }
}
