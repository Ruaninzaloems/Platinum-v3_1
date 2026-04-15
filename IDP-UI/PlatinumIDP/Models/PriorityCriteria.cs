using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class PriorityCriteria
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int FrameworkId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = "Strategic";

    [Column(TypeName = "decimal(5,2)")]
    public decimal Weight { get; set; } = 0m;

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; } = 0;

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("FrameworkId")]
    public PriorityFramework? Framework { get; set; }
}
