namespace PlatinumOvertime_API.Services.Interfaces;

/// <summary>
/// Lightweight authentication shim for the dev environment. The real Platinum
/// SSO is replaced with an X-User-Id header that selects one of a small set
/// of in-memory test users (see DevUserDirectory). The same interface will be
/// implemented over Active Directory / OAuth in production without any
/// service-layer changes.
/// </summary>
public interface ICurrentUserService
{
    DevUser Current { get; }
    DevUser? FindByUserId(string userId);
    IReadOnlyList<DevUser> AllUsers { get; }
}

/// <summary>
/// In-memory test user. Roles are flagged independently because the spec
/// allows one person to wear several hats (e.g. Capturer + Recommender).
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
