using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Reads the X-User-Id header and resolves it against DevUserDirectory.
/// Falls back to the directory's default user when the header is absent or
/// unknown so the API stays usable from Swagger without auth.
/// Registered as Scoped because it depends on IHttpContextAccessor.
/// </summary>
public class DevCurrentUserService : ICurrentUserService
{
    private const string HeaderName = "X-User-Id";

    private readonly IHttpContextAccessor _http;
    private readonly DevUserDirectory _directory;

    public DevCurrentUserService(IHttpContextAccessor http, DevUserDirectory directory)
    { _http = http; _directory = directory; }

    /// <summary>The dev shim is always "authenticated" (no session check needed).</summary>
    public bool IsAuthenticated => true;

    public DevUser Current
    {
        get
        {
            var userId = _http.HttpContext?.Request.Headers[HeaderName].ToString();
            if (!string.IsNullOrWhiteSpace(userId))
            {
                var user = _directory.FindByUserId(userId);
                if (user != null) return user;
            }
            return _directory.Default;
        }
    }

    public DevUser? FindByUserId(string userId) => _directory.FindByUserId(userId);
    public IReadOnlyList<DevUser> AllUsers => _directory.All;
}

/// <summary>
/// Dev "directory" of users that the X-User-Id shim can impersonate.
///
/// The list is materialised from the legacy User_UserDetail table joined to
/// Payroll_Employee + Payroll_Position so the dropdown shows the same human
/// names the rest of the Platinum suite shows. Role flags are derived from
/// PositionApprovalConfig (the per-position recommender / approver / excess
/// flags configured in the Position Approval Setup page) so switching to a
/// user immediately puts them in the workflow row they actually own in
/// production.
///
/// Registered as a Singleton so the directory is loaded once per process and
/// shared across requests; uses IServiceScopeFactory to open a short-lived
/// DbContext on first access. Call <see cref="Invalidate"/> after seeding or
/// config changes to force a refresh on the next read.
/// </summary>
public class DevUserDirectory
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly object _lock = new();
    private List<DevUser>? _cache;
    private Dictionary<string, DevUser>? _byUserId;
    private Dictionary<string, DevUser>? _byEmployeeId;

    public DevUserDirectory(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    /// <summary>
    /// Test-only constructor: skips the database load and serves the supplied
    /// list directly. <c>Load()</c> returns immediately because <c>_cache</c>
    /// is pre-populated, so <c>_scopeFactory</c> is never accessed.
    /// </summary>
    internal DevUserDirectory(IReadOnlyList<DevUser> testUsers)
    {
        _scopeFactory = null!;
        var list = testUsers.ToList();
        _byUserId = list.ToDictionary(u => u.UserId, StringComparer.OrdinalIgnoreCase);
        _byEmployeeId = list
            .GroupBy(u => u.EmployeeId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        Volatile.Write(ref _cache, list);
    }

    public IReadOnlyList<DevUser> All => Load();

    /// <summary>Default identity when the request carries no X-User-Id.</summary>
    public DevUser Default => Load().FirstOrDefault() ?? FallbackUser;

    /// <summary>
    /// Resolve a user by either their User_UserDetail.User_id ("4266") or the
    /// linked Payroll_Employee.Employee_ID ("1001"). The X-User-Id header is
    /// allowed to carry either, so internal code that snapshots EmployeeIds
    /// (e.g. workflow assignee fields) can round-trip through the shim.
    /// </summary>
    public DevUser? FindByUserId(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId)) return null;
        Load();
        // Snapshot the dictionaries locally so an Invalidate() in flight
        // can't null them out from under us between the two lookups.
        var byUserId = _byUserId;
        var byEmployeeId = _byEmployeeId;
        if (byUserId != null && byUserId.TryGetValue(userId, out var u)) return u;
        return byEmployeeId != null && byEmployeeId.TryGetValue(userId, out var u2) ? u2 : null;
    }

    /// <summary>Drop the cached snapshot so the next read re-queries the DB.</summary>
    public void Invalidate()
    {
        lock (_lock)
        {
            _cache = null;
            _byUserId = null;
            _byEmployeeId = null;
        }
    }

    private const int PermissionConfig = 3200;
    private const int PermissionCapture = 3201;
    private const int PermissionPayroll = 3202;
    private const int PermissionEnquiry = 3203;

    private List<DevUser> Load()
    {
        if (_cache != null) return _cache;
        lock (_lock)
        {
            if (_cache != null) return _cache;

            try
            {
                return LoadFromDb();
            }
            catch (Exception)
            {
                // DB tables are missing (e.g. dev seeders were skipped) — fall
                // back to a single hard-coded admin so /api/me and the
                // SessionAuthFilter still work without login.
                var fallback = new List<DevUser> { FallbackUser };
                _byUserId = fallback.ToDictionary(u => u.UserId, StringComparer.OrdinalIgnoreCase);
                _byEmployeeId = new Dictionary<string, DevUser>(StringComparer.OrdinalIgnoreCase);
                Volatile.Write(ref _cache, fallback);
                return fallback;
            }
        }
    }

    private List<DevUser> LoadFromDb()
    {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();

            // Per-position approval flags. PositionApprovalConfig.PositionId
            // is stored as a string (it references the external Platinum
            // positions API); keys are compared case-insensitively to match
            // the way the rest of the module does PositionId comparisons.
            var configs = db.Set<PositionApprovalConfig>().AsNoTracking()
                .ToDictionary(c => c.PositionId ?? string.Empty, c => c, StringComparer.OrdinalIgnoreCase);

            // Platinum page-access permissions: join User_UserRoles → Sys_RolePermission.
            // Result is a dictionary: UserId (int) → HashSet of PermissionIDs the user holds.
            // We only materialise the two permission IDs we care about so the
            // set stays small regardless of how many rows Sys_RolePermission has.
            var permRows = (
                from uur in db.Set<UserUserRole>().AsNoTracking()
                join srp in db.Set<SysRolePermission>().AsNoTracking()
                    on uur.RoleId equals srp.RoleId
                where srp.PermissionId == PermissionConfig
                   || srp.PermissionId == PermissionCapture
                   || srp.PermissionId == PermissionPayroll
                   || srp.PermissionId == PermissionEnquiry
                select new { uur.UserId, srp.PermissionId }
            ).ToList();

            // Determine whether each permission ID is actually present anywhere in
            // the seed data. If a permission is absent globally we fall back to
            // granting it to every dev user (keeps the feature testable without
            // requiring complete seed data). If the permission IS present we
            // enforce it strictly per-user so role separation can be tested.
            var hasConfigInSeed = permRows.Any(r => r.PermissionId == PermissionConfig);
            var hasCaptureInSeed = permRows.Any(r => r.PermissionId == PermissionCapture);
            var hasPayrollInSeed = permRows.Any(r => r.PermissionId == PermissionPayroll);
            var hasEnquiryInSeed = permRows.Any(r => r.PermissionId == PermissionEnquiry);

            var permsByUser = permRows
                .GroupBy(r => r.UserId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(r => r.PermissionId).ToHashSet());

            // Active, non-historic users that link to an enabled employee.
            // Done as two reads + an in-memory join to keep the SQL simple
            // (PositionApprovalConfig.PositionId is a string column whereas
            // Payroll_Position.PositionId is an int) and to avoid translating
            // ToString() calls in EF.
            var rows = (
                from u in db.Set<UserUserDetail>().AsNoTracking()
                where (u.Enabled ?? false) && (u.HistoricUser == null || u.HistoricUser == "") && u.EmpId != null
                join e in db.Set<PayrollEmployee>().AsNoTracking()
                    on u.EmpId equals e.EmployeeId
                where (e.Enabled ?? false)
                join p in db.Set<PayrollPosition>().AsNoTracking()
                    on e.PositionId equals p.PositionId into posJoin
                from p in posJoin.DefaultIfEmpty()
                orderby u.LastName, u.FirstName, u.UserName
                select new
                {
                    u.UserId,
                    u.FirstName,
                    u.LastName,
                    u.UserName,
                    EmpId = e.EmployeeId,
                    EmpFirst = e.FirstName,
                    EmpKnownAs = e.KnownAsName,
                    EmpSurname = e.Surname,
                    e.PositionId,
                    PositionDesc = p != null ? p.PositionDesc : null
                }).ToList();

            // ── Employee-linked users (have EmpId → Payroll_Employee row) ──────
            var employeeUsers = rows.Select(r =>
            {
                var positionId = r.PositionId?.ToString() ?? string.Empty;
                configs.TryGetValue(positionId, out var cfg);
                permsByUser.TryGetValue(r.UserId, out var perms);

                var firstName = !string.IsNullOrWhiteSpace(r.FirstName)
                    ? r.FirstName
                    : (r.EmpKnownAs ?? r.EmpFirst);
                var lastName = !string.IsNullOrWhiteSpace(r.LastName) ? r.LastName : r.EmpSurname;

                var displayName = JoinNonEmpty(firstName, lastName);
                if (string.IsNullOrWhiteSpace(displayName))
                    displayName = r.UserName ?? $"User {r.UserId}";

                var employeeName = JoinNonEmpty(r.EmpKnownAs ?? r.EmpFirst, r.EmpSurname);
                if (string.IsNullOrWhiteSpace(employeeName)) employeeName = displayName;

                return new DevUser
                {
                    UserId = r.UserId.ToString(),
                    DisplayName = displayName,
                    EmployeeId = r.EmpId.ToString(),
                    EmployeeName = employeeName,
                    PositionId = positionId,
                    PositionDescription = r.PositionDesc ?? string.Empty,

                    // In dev anyone can capture a row on behalf of an
                    // employee; the recommender / approver / excess flags
                    // are gated by the PositionApprovalConfig the customer
                    // wired up in the setup page.
                    IsCapturer = true,
                    IsRecommender = cfg?.IsOvertimeRecommender ?? false,
                    IsApprover = cfg?.IsOvertimeApprover ?? false,
                    IsExcessApprover = cfg?.IsDepartmentExcessOvertimeApprover ?? false,

                    // Payroll roles aren't modelled in PositionApprovalConfig
                    // yet, so leave them on for every dev user. This keeps
                    // the full Capture → Recommend → Approve → Payroll chain
                    // testable from any seeded persona without forcing the
                    // tester to remember which row owns payroll today.
                    IsPayrollCapturer = true,
                    IsPayrollApprover = true,

                    // Page-access: derived from User_UserRoles → Sys_RolePermission.
                    // For each permission: if any row exists in the seed we enforce
                    // it strictly per-user; if the permission is absent from the seed
                    // entirely we grant it unconditionally so the page stays testable
                    // without requiring complete seed data.
                    CanAccessConfig = hasConfigInSeed
                        ? (perms?.Contains(PermissionConfig) ?? false)
                        : true,
                    CanAccessCapture = hasCaptureInSeed
                        ? (perms?.Contains(PermissionCapture) ?? false)
                        : true,
                    CanAccessPayroll = hasPayrollInSeed
                        ? (perms?.Contains(PermissionPayroll) ?? false)
                        : true,
                    CanAccessEnquiry = hasEnquiryInSeed
                        ? (perms?.Contains(PermissionEnquiry) ?? false)
                        : true
                };
            }).ToList();

            // ── Non-employee portal users (no EmpId: Admin, Superdev, etc.) ─────
            // These accounts exist in User_UserDetail but have no Payroll_Employee
            // link. They must still appear in the directory so that a session
            // created for them by AuthController.Login can be resolved correctly.
            // Permissions come from SuperUser flag and/or their role rows.
            var nonEmpRows = db.Set<UserUserDetail>().AsNoTracking()
                .Where(u => (u.Enabled ?? false) && (u.HistoricUser == null || u.HistoricUser == "") && u.EmpId == null)
                .OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ThenBy(u => u.UserName)
                .Select(u => new
                {
                    u.UserId,
                    u.FirstName,
                    u.LastName,
                    u.UserName,
                    u.SuperUser
                })
                .ToList();

            var nonEmpUsers = nonEmpRows.Select(r =>
            {
                permsByUser.TryGetValue(r.UserId, out var perms);
                var isSu = r.SuperUser == true;
                var displayName = JoinNonEmpty(r.FirstName, r.LastName);
                if (string.IsNullOrWhiteSpace(displayName))
                    displayName = r.UserName ?? $"User {r.UserId}";

                return new DevUser
                {
                    UserId = r.UserId.ToString(),
                    DisplayName = displayName,
                    EmployeeId = string.Empty,
                    EmployeeName = displayName,
                    PositionId = string.Empty,
                    PositionDescription = string.Empty,
                    IsCapturer = isSu,
                    IsRecommender = isSu,
                    IsApprover = isSu,
                    IsExcessApprover = isSu,
                    IsPayrollCapturer = isSu,
                    IsPayrollApprover = isSu,
                    CanAccessConfig = hasConfigInSeed
                        ? (perms?.Contains(PermissionConfig) ?? isSu)
                        : true,
                    CanAccessCapture = hasCaptureInSeed
                        ? (perms?.Contains(PermissionCapture) ?? isSu)
                        : true,
                    CanAccessPayroll = hasPayrollInSeed
                        ? (perms?.Contains(PermissionPayroll) ?? isSu)
                        : true,
                    CanAccessEnquiry = hasEnquiryInSeed
                        ? (perms?.Contains(PermissionEnquiry) ?? isSu)
                        : true,
                };
            }).ToList();

            var users = employeeUsers.Concat(nonEmpUsers).ToList();

            // Publish dictionaries BEFORE _cache so the lock-free fast path
            // (`if (_cache != null) return _cache;`) never observes a non-null
            // _cache while _byUserId / _byEmployeeId are still null. Without
            // this ordering a concurrent first-load FindByUserId() could NRE
            // dereferencing the lookup tables.
            _byUserId = users.ToDictionary(u => u.UserId, StringComparer.OrdinalIgnoreCase);
            _byEmployeeId = users
                .GroupBy(u => u.EmployeeId, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
            Volatile.Write(ref _cache, users);
            return users;
    }

    private static string JoinNonEmpty(params string?[] parts) =>
        string.Join(" ", parts.Where(p => !string.IsNullOrWhiteSpace(p))).Trim();

    /// <summary>
    /// Last-resort identity returned when the DB lookup yields no rows (e.g.
    /// User_UserDetail wasn't seeded). Mirrors the pre-DB sentinel so the API
    /// keeps responding instead of throwing on /api/me.
    /// </summary>
    private static readonly DevUser FallbackUser = new()
    {
        UserId = "dev",
        DisplayName = "Dev User",
        EmployeeId = string.Empty,
        EmployeeName = "Dev User",
        PositionId = string.Empty,
        PositionDescription = string.Empty,
        IsCapturer = true,
        IsRecommender = true,
        IsApprover = true,
        IsExcessApprover = true,
        IsPayrollCapturer = true,
        IsPayrollApprover = true,
        CanAccessConfig = true,
        CanAccessCapture = true,
        CanAccessPayroll = true,
        CanAccessEnquiry = true
    };
}
