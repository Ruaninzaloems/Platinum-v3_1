using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumIDP.Models;

public class IdpCycle
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int StartYear { get; set; }

    [Required]
    public int EndYear { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";

    public int RevisionNumber { get; set; } = 1;

    [MaxLength(300)]
    public string MunicipalityName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsLocked { get; set; } = false;

    
    public int? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    public int? ModifiedBy { get; set; }
    public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
    public int VersionNo { get; set; } = 1;

    public ICollection<IdpProcessPhase> Phases { get; set; } = new List<IdpProcessPhase>();
    public ICollection<IdpStrategicObjective> Objectives { get; set; } = new List<IdpStrategicObjective>();
    public ICollection<IdpProject> Projects { get; set; } = new List<IdpProject>();
    public ICollection<IdpPublicComment> Comments { get; set; } = new List<IdpPublicComment>();
    public ICollection<IdpDocumentVersion> DocumentVersions { get; set; } = new List<IdpDocumentVersion>();
    public ICollection<IdpSubmissionLog> Submissions { get; set; } = new List<IdpSubmissionLog>();
}
