namespace PlatinumOvertime_API.Configuration;

/// <summary>
/// Bound from appsettings: PlatinumIntegration section.
/// When BaseUrl is null/empty, the mock integration service is used.
/// </summary>
public class PlatinumIntegrationOptions
{
    public const string SectionName = "PlatinumIntegration";

    public string? BaseUrl { get; set; }
    public string? ApiKey { get; set; }
    public bool UseMock { get; set; } = true;

    /// <summary>
    /// Where to source the Position list from while the real Platinum API is unavailable.
    ///   "Mock" — small in-memory list (default, used by tests).
    ///   "Db"   — read from the legacy Payroll_Position table via EF
    ///             (seeded in dev, real table in prod).
    /// </summary>
    public string PositionsSource { get; set; } = "Mock";

    /// <summary>
    /// Where to source the Employee list from while the real Platinum API is unavailable.
    ///   "Mock" — small in-memory list (default, used by tests).
    ///   "Db"   — read from the legacy Payroll_Employee table via EF
    ///             (seeded in dev, real table in prod).
    /// </summary>
    public string EmployeesSource { get; set; } = "Mock";
}
