namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Sys_RolePermission table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// Maps Platinum system roles to their assigned permission IDs.
/// </summary>
public class SysRolePermission
{
    public int PermissionId { get; set; }
    public int RoleId { get; set; }
}
