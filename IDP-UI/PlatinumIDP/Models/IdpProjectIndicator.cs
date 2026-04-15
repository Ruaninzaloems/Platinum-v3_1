using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class IdpProjectIndicator
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int ProjectId { get; set; }

    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Baseline { get; set; }

    [MaxLength(200)]
    public string? TargetY1 { get; set; }

    [MaxLength(200)]
    public string? TargetY2 { get; set; }

    [MaxLength(200)]
    public string? TargetY3 { get; set; }

    [MaxLength(200)]
    public string? TargetY4 { get; set; }

    [MaxLength(200)]
    public string? TargetY5 { get; set; }

    [MaxLength(200)]
    public string? ResponsibleOfficial { get; set; }

    public string? EvidenceLink { get; set; }

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Active";

    [ForeignKey("ProjectId")]
    public IdpProject? Project { get; set; }
}
