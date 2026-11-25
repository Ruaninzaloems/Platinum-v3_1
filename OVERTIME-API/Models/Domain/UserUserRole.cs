namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy User_UserRoles table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// Maps Platinum portal users to their assigned roles. Rows with a non-null
/// <see cref="DelegatedByUserId"/> represent temporarily delegated role
/// assignments with an optional effective-date window.
/// </summary>
public class UserUserRole
{
    public int UserId { get; set; }
    public int RoleId { get; set; }
    public int? DelegatedByUserId { get; set; }
    public DateTime? DelegationStart { get; set; }
    public DateTime? DelegationExpiry { get; set; }
}
