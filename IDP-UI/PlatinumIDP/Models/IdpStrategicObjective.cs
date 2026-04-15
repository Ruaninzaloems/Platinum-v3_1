using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class IdpStrategicObjective
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int CycleId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public string? AlignmentTags { get; set; }

    public string? NdpAlignment { get; set; }

    public string? ProvincialAlignment { get; set; }

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Active";

    [ForeignKey("CycleId")]
    public IdpCycle? Cycle { get; set; }

    public ICollection<IdpProject> Projects { get; set; } = new List<IdpProject>();
}
