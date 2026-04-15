using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("Sys_WorkFlow")]
public class SysWorkFlow
{
    [Key]
    [Column("WorkFlow_ID")]
    public int WorkFlowId { get; set; }

    [Column("PageName")]
    public string PageName { get; set; } = "";

    [Column("Area")]
    public string Area { get; set; } = "";

    [Column("MaxSections")]
    public int MaxSections { get; set; }

    [Column("AreaTypeID")]
    public int? AreaTypeId { get; set; }

    [Column("ModuleID")]
    public int ModuleId { get; set; }

    public virtual ICollection<SysWorkFlowSection> Sections { get; set; } = new List<SysWorkFlowSection>();
}

[Table("Sys_WorkFlowSection")]
public class SysWorkFlowSection
{
    [Key]
    [Column("WorkFlowSection_ID")]
    public int WorkFlowSectionId { get; set; }

    [Column("WorkFlowID")]
    public int WorkFlowId { get; set; }

    [Column("SectionHeader")]
    public string SectionHeader { get; set; } = "";

    [Column("SectionID")]
    public string SectionId { get; set; } = "";

    [Column("SectionOrder")]
    public int SectionOrder { get; set; }

    [Column("Required")]
    public bool Required { get; set; }

    [Column("PermissionDescription")]
    public string? PermissionDescription { get; set; }

    [ForeignKey("WorkFlowId")]
    public virtual SysWorkFlow? WorkFlow { get; set; }
}

[Table("Sys_WorkFlowSectionAudit")]
public class SysWorkFlowSectionAudit
{
    [Key]
    [Column("SectionAudit_ID")]
    public int SectionAuditId { get; set; }

    [Column("RecordID")]
    public int RecordId { get; set; }

    [Column("WorkFlowID")]
    public int WorkFlowId { get; set; }

    [Column("WorkFlowSectionID")]
    public string WorkFlowSectionId { get; set; } = "";

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("Completed")]
    public bool Completed { get; set; }
}

[Table("Sys_Permission")]
public class SysPermission
{
    [Key]
    [Column("Permission_ID")]
    public int PermissionId { get; set; }

    [Column("ModuleID")]
    public int ModuleId { get; set; }

    [Column("ModuleHeader")]
    public bool ModuleHeader { get; set; }

    [Column("LevelDesc")]
    public string LevelDesc { get; set; } = "";

    [Column("PageName")]
    public string PageName { get; set; } = "";

    [Column("PermissionName")]
    public string PermissionName { get; set; } = "";

    [Column("PermissionDesc")]
    public string PermissionDesc { get; set; } = "";

    [Column("DisplayOrder")]
    public int DisplayOrder { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("DeveloperWhoCaptured")]
    public string DeveloperWhoCaptured { get; set; } = "";

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("DeveloperWhoModified")]
    public string? DeveloperWhoModified { get; set; }

    [Column("TypeDesc")]
    public string? TypeDesc { get; set; }
}

[Table("Sys_RoleName")]
public class SysRoleName
{
    [Key]
    [Column("Role_ID")]
    public int RoleId { get; set; }

    [Column("RoleDesc")]
    public string RoleDesc { get; set; } = "";

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }
}

[Table("Sys_RolePermission")]
public class SysRolePermission
{
    [Column("PermissionID")]
    public int PermissionId { get; set; }

    [Column("RoleID")]
    public int RoleId { get; set; }
}

[Table("Sys_RolePermissionSection")]
public class SysRolePermissionSection
{
    [Column("RoleID")]
    public int RoleId { get; set; }

    [Column("WorkFlowSectionID")]
    public int WorkFlowSectionId { get; set; }
}

[Table("SCM_ContractApproval")]
public class ContractApproval
{
    [Key]
    [Column("ContractApproval_ID")]
    public int ContractApprovalId { get; set; }

    [Column("ApproveLevel")]
    public int ApproveLevel { get; set; }

    [Column("ApproveUser")]
    public int ApproveUser { get; set; }

    [Column("ApproveDate")]
    public DateTime ApproveDate { get; set; }

    [Column("ApproveComment")]
    public string? ApproveComment { get; set; }

    [Column("ContractID")]
    public int ContractId { get; set; }

    [Column("IsApproved")]
    public bool IsApproved { get; set; }
}

[Table("SCM_Delegation")]
public class Delegation
{
    [Key]
    [Column("Delegation_ID")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int DelegationId { get; set; }

    [Column("DelegatorUserId")]
    public int DelegatorUserId { get; set; }

    [Column("DelegateeUserId")]
    public int DelegateeUserId { get; set; }

    [Column("DelegationType")]
    public string DelegationType { get; set; } = "Financial";

    [Column("Status")]
    public string Status { get; set; } = "Active";

    [Column("FromDate")]
    public DateTime FromDate { get; set; }

    [Column("ToDate")]
    public DateTime ToDate { get; set; }

    [Column("ApprovalLimit")]
    public decimal ApprovalLimit { get; set; }

    [Column("Reason")]
    public string? Reason { get; set; }

    [Column("RevokedReason")]
    public string? RevokedReason { get; set; }

    [Column("RevokedDate")]
    public DateTime? RevokedDate { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }
}

[Table("SCM_DelegationThreshold")]
public class DelegationThreshold
{
    [Key]
    [Column("Threshold_ID")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ThresholdId { get; set; }

    [Column("RoleId")]
    public int RoleId { get; set; }

    [Column("ThresholdType")]
    public string ThresholdType { get; set; } = "";

    [Column("MinAmount")]
    public decimal MinAmount { get; set; }

    [Column("MaxAmount")]
    public decimal MaxAmount { get; set; }

    [Column("RequiresAdditionalApproval")]
    public bool RequiresAdditionalApproval { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; } = true;

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }
}

[Table("SCM_SegregationRule")]
public class SegregationRule
{
    [Key]
    [Column("Rule_ID")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int RuleId { get; set; }

    [Column("EntityType")]
    public string EntityType { get; set; } = "";

    [Column("RestrictedAction1")]
    public string RestrictedAction1 { get; set; } = "";

    [Column("RestrictedAction2")]
    public string RestrictedAction2 { get; set; } = "";

    [Column("Description")]
    public string? Description { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; } = true;

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }
}
