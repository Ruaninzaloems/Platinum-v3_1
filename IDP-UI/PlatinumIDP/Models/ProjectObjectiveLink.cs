using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class ProjectObjectiveLink
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int ProjectId { get; set; }

    [Required]
    public int ObjectiveId { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal Percentage { get; set; } = 0;

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    [ForeignKey("ProjectId")]
    public IdpProject? Project { get; set; }

    [ForeignKey("ObjectiveId")]
    public IdpStrategicObjective? Objective { get; set; }
}
