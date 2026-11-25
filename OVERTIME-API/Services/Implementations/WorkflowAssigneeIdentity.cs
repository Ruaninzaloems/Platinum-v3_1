using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Keeps workflow assignee identity matching consistent across queue visibility,
/// dashboard counts, and action authorization.
///
/// CurrentAssigneeUserId is normally a DevUser.UserId, but legacy rows can
/// contain DevUser.EmployeeId. Both values are valid for matching; new
/// workflow transitions still write the canonical UserId when it resolves.
/// </summary>
internal static class WorkflowAssigneeIdentity
{
    public static bool Matches(DevUser user, string? storedAssigneeId) =>
        !string.IsNullOrWhiteSpace(storedAssigneeId)
        && (string.Equals(storedAssigneeId, user.UserId, StringComparison.OrdinalIgnoreCase)
            || (!string.IsNullOrWhiteSpace(user.EmployeeId)
                && string.Equals(storedAssigneeId, user.EmployeeId, StringComparison.OrdinalIgnoreCase)));

    public static List<string> ForUser(DevUser user)
    {
        var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        Add(ids, user.UserId);
        Add(ids, user.EmployeeId);
        return ids.ToList();
    }

    public static List<string> ForUserAndActing(
        DevUser currentUser,
        IEnumerable<DevUser> allUsers,
        IEnumerable<PositionApprovalConfig> actingConfigs)
    {
        var ids = new HashSet<string>(ForUser(currentUser), StringComparer.OrdinalIgnoreCase);

        foreach (var primary in ActingPrimaryUsers(allUsers, actingConfigs))
        {
            Add(ids, primary.UserId);
            Add(ids, primary.EmployeeId);
        }

        return ids.ToList();
    }

    public static List<string> ActingIdentityValues(
        IEnumerable<DevUser> allUsers,
        IEnumerable<PositionApprovalConfig> actingConfigs)
    {
        var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var primary in ActingPrimaryUsers(allUsers, actingConfigs))
        {
            Add(ids, primary.UserId);
            Add(ids, primary.EmployeeId);
        }

        return ids.ToList();
    }

    private static IEnumerable<DevUser> ActingPrimaryUsers(
        IEnumerable<DevUser> allUsers,
        IEnumerable<PositionApprovalConfig> actingConfigs)
    {
        foreach (var config in actingConfigs)
        {
            var primary = allUsers.FirstOrDefault(u =>
                string.Equals(u.PositionId, config.PositionId, StringComparison.OrdinalIgnoreCase));
            if (primary is not null)
                yield return primary;
        }
    }

    private static void Add(HashSet<string> ids, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
            ids.Add(value);
    }
}