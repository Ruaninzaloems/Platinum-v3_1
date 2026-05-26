namespace PlatinumOvertime_API.Services.Interfaces;

/// <summary>
/// Provides the identity of the currently authenticated user.
/// Implemented by <c>SessionCurrentUserService</c> (session-cookie auth)
/// and the legacy <c>DevCurrentUserService</c> (X-User-Id header shim).
/// </summary>
public interface ICurrentUserService
{
    /// <summary>True when the current request carries a valid authenticated session.</summary>
    bool IsAuthenticated { get; }

    DevUser Current { get; }
    DevUser? FindByUserId(string userId);
    IReadOnlyList<DevUser> AllUsers { get; }
}

/// <summary>
/// Resolved user profile. Role flags are derived from PositionApprovalConfig
/// and Sys_RolePermission; they drive both UI visibility and API authorisation.
/// </summary>
public class DevUser
{
    public string UserId { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string EmployeeId { get; init; } = string.Empty;
    public string EmployeeName { get; init; } = string.Empty;
    public string PositionId { get; init; } = string.Empty;
    public string PositionDescription { get; init; } = string.Empty;
    public bool IsCapturer { get; init; }
    public bool IsRecommender { get; init; }
    public bool IsApprover { get; init; }
    public bool IsExcessApprover { get; init; }
    public bool IsPayrollCapturer { get; init; }
    public bool IsPayrollApprover { get; init; }

    /// <summary>Holds Platinum permission 3200 (Configuration page).</summary>
    public bool CanAccessConfig { get; init; }
    /// <summary>Holds Platinum permission 3201 (Capture page).</summary>
    public bool CanAccessCapture { get; init; }
    /// <summary>Holds Platinum permission 3202 (Payroll Processing page).</summary>
    public bool CanAccessPayroll { get; init; }
    /// <summary>Holds Platinum permission 3203 (Enquiry page).</summary>
    public bool CanAccessEnquiry { get; init; }
}
