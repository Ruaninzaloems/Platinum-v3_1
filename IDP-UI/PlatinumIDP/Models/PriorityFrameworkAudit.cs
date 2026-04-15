using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class PriorityFrameworkAudit
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int FrameworkId { get; set; }

    [Required]
    [MaxLength(100)]
    public string ChangeType { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? FieldName { get; set; }

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public int? ChangedBy { get; set; }

    public DateTime ChangedDate { get; set; } = DateTime.UtcNow;

    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("FrameworkId")]
    public PriorityFramework? Framework { get; set; }
}
