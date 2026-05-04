using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Decorator over <see cref="MockPlatinumIntegrationService"/> that replaces
/// the in-memory position list with rows read from the legacy Payroll_Position
/// table via EF (read-only). Employees and departments still come from the
/// mock until the real Platinum APIs are wired in a follow-up task.
/// </summary>
public class DbPositionsPlatinumIntegrationService : IPlatinumIntegrationService
{
    private readonly MockPlatinumIntegrationService _mock;
    private readonly IServiceScopeFactory _scopeFactory;

    public DbPositionsPlatinumIntegrationService(
        MockPlatinumIntegrationService mock,
        IServiceScopeFactory scopeFactory)
    {
        _mock = mock;
        _scopeFactory = scopeFactory;
    }

    public Task<List<EmployeeDto>> GetEmployeesAsync(string? search = null, CancellationToken ct = default)
        => _mock.GetEmployeesAsync(search, ct);

    public Task<EmployeeDto?> GetEmployeeAsync(string employeeId, CancellationToken ct = default)
        => _mock.GetEmployeeAsync(employeeId, ct);

    public Task<List<DepartmentDto>> GetDepartmentsAsync(CancellationToken ct = default)
        => _mock.GetDepartmentsAsync(ct);

    public async Task<List<PositionDto>> GetPositionsAsync(string? search = null, CancellationToken ct = default)
    {
        // New scope so this singleton service can use the scoped DbContext.
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();

        var q = BuildPositionQuery(db, search);

        // Project to PositionDto in SQL. `let emp` joins the incumbent employee
        // in the same round trip via a correlated OUTER APPLY so vacant positions
        // get empty strings without a separate query.
        var rows = await (
            from p in q
            let emp = db.PayrollEmployees
                .Where(e => e.PositionId == p.PositionId)
                .Select(e => new { e.EmployeeId, e.EmpCode, e.FirstName, e.Surname })
                .FirstOrDefault()
            orderby p.PositionDesc
            select new PositionDto
            {
                Id = p.PositionId.ToString(),
                PositionCode = p.PositionCode ?? string.Empty,
                Description = p.PositionDesc ?? string.Empty,
                DepartmentId = p.DepartmentId.HasValue ? p.DepartmentId.Value.ToString() : string.Empty,
                DepartmentName = p.DepartmentId.HasValue
                    ? (db.ConstDepartments
                        .Where(d => d.DepartmentId == p.DepartmentId!.Value)
                        .Select(d => d.DepartmentDesc).FirstOrDefault() ?? string.Empty)
                    : string.Empty,
                EmployeeId = emp != null ? emp.EmployeeId.ToString() : string.Empty,
                EmployeeCode = (emp != null ? emp.EmpCode : null) ?? string.Empty,
                EmployeeFirstName = (emp != null ? emp.FirstName : null) ?? string.Empty,
                EmployeeSurname = (emp != null ? emp.Surname : null) ?? string.Empty
            }
        ).ToListAsync(ct);

        return rows;
    }

    public async Task<PositionDto?> GetPositionAsync(string positionId, CancellationToken ct = default)
    {
        if (!int.TryParse(positionId, out var id)) return null;
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();
        // Same SQL-side projection as the list path so DepartmentName is real.
        return await db.Set<PayrollPosition>().AsNoTracking()
            .Where(p => p.PositionId == id)
            .Select(p => new PositionDto
            {
                Id = p.PositionId.ToString(),
                PositionCode = p.PositionCode ?? string.Empty,
                Description = p.PositionDesc ?? string.Empty,
                DepartmentId = p.DepartmentId.HasValue ? p.DepartmentId.Value.ToString() : string.Empty,
                DepartmentName = p.DepartmentId.HasValue
                    ? (db.ConstDepartments
                        .Where(d => d.DepartmentId == p.DepartmentId!.Value)
                        .Select(d => d.DepartmentDesc).FirstOrDefault() ?? string.Empty)
                    : string.Empty
            })
            .FirstOrDefaultAsync(ct);
    }

    public async Task<PaginatedResponse<PositionListItemDto>> GetPositionsListAsync(
        string? search,
        string? status,
        int page,
        int pageSize,
        string? sort = null,
        string? sortDirection = null,
        CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();

        // Correlate PayrollPosition with PositionApprovalConfig in SQL so the
        // IsConfigured flag is computed by the database (translated by EF to
        // an EXISTS / IN sub-select on the configured-ids set) — no second
        // round-trip to load the full id list. PositionId in
        // PositionApprovalConfig is a string mirror of the legacy numeric
        // PositionId, so the correlation key is the stringified id.
        var configIds = db.PositionApprovalConfigs.Select(c => c.PositionId);

        var positions = BuildPositionQuery(db, search);

        // "Today" boundaries for currently-effective filtering.
        // StartDate comparison: use "before tomorrow midnight" so that
        // relationships seeded/created today with a time component are included
        // regardless of the hour they were inserted.
        // EndDate comparison: "today midnight or later" — rows with EndDate = today
        // (stored as midnight) should still be considered active.
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        // Correlated sub-selects keep this a single SQL round trip:
        //   - Reports To: most recent currently-effective parent for the position
        //     (joined through PositionApprovalConfig + PositionReportingRelationship).
        //   - Department / Division: looked up against Const_Department /
        //     Const_Division using `let` so the division row is fetched once per
        //     position (single OUTER APPLY) and both code + description come back
        //     in one trip. Positions whose department or division id is null (or
        //     points at a row that no longer exists) resolve to empty string.
        var enriched =
            from p in positions
            let dept = db.ConstDepartments
                .Where(d => p.DepartmentId.HasValue && d.DepartmentId == p.DepartmentId!.Value)
                .Select(d => new { d.DepartmentDesc })
                .FirstOrDefault()
            let div = db.ConstDivisions
                .Where(d => p.DivisionId.HasValue && d.DivisionId == p.DivisionId!.Value)
                .Select(d => new { d.DivisionCode, d.DivisionDesc })
                .FirstOrDefault()
            // Incumbent employee — the Payroll_Employee row whose PositionId
            // matches this position. When a position is vacant (no matching row)
            // all four employee fields resolve to empty string.
            let emp = db.PayrollEmployees
                .Where(e => e.PositionId == p.PositionId)
                .Select(e => new { e.EmployeeId, e.EmpCode, e.FirstName, e.Surname })
                .FirstOrDefault()
            select new PositionListItemDto
            {
                Id = p.PositionId.ToString(),
                PositionCode = p.PositionCode ?? string.Empty,
                Description = p.PositionDesc ?? string.Empty,
                DepartmentId = p.DepartmentId.HasValue ? p.DepartmentId.Value.ToString() : string.Empty,
                DepartmentName = (dept != null ? dept.DepartmentDesc : null) ?? string.Empty,
                DivisionId = p.DivisionId.HasValue ? p.DivisionId.Value.ToString() : string.Empty,
                DivisionCode = (div != null ? div.DivisionCode : null) ?? string.Empty,
                DivisionName = (div != null ? div.DivisionDesc : null) ?? string.Empty,
                IsConfigured = configIds.Contains(p.PositionId.ToString()),
                EmployeeId = emp != null ? emp.EmployeeId.ToString() : string.Empty,
                EmployeeCode = (emp != null ? emp.EmpCode : null) ?? string.Empty,
                EmployeeFirstName = (emp != null ? emp.FirstName : null) ?? string.Empty,
                EmployeeSurname = (emp != null ? emp.Surname : null) ?? string.Empty,
                ReportsToPositionDescription =
                    (from r in db.PositionReportingRelationships
                     join c in db.PositionApprovalConfigs on r.PositionApprovalConfigId equals c.Id
                     where r.ReportsToPositionId == p.PositionId.ToString()
                          && r.StartDate < tomorrow
                          && (r.EndDate == null || r.EndDate >= today)
                     orderby r.StartDate descending
                     select c.PositionDescription).FirstOrDefault() ?? string.Empty
            };

        var statusKey = (status ?? "all").Trim().ToLowerInvariant();
        enriched = statusKey switch
        {
            "configured" => enriched.Where(x => x.IsConfigured),
            "notconfigured" or "not-configured" or "not_configured" =>
                enriched.Where(x => !x.IsConfigured),
            _ => enriched
        };

        // Order in SQL so Skip/Take are deterministic. ThenBy(Description) on
        // every branch keeps ties stable so paging never reshuffles rows.
        var sortKey = (sort ?? string.Empty).Trim().ToLowerInvariant();
        var desc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
        IOrderedQueryable<PositionListItemDto> ordered = sortKey switch
        {
            // Empty Reports To values cluster at the END regardless of
            // direction (asc or desc) — users sorting by parent should see
            // populated rows first; blanks are noise.
            "reportsto" => desc
                ? enriched.OrderBy(x => x.ReportsToPositionDescription == "" ? 1 : 0)
                          .ThenByDescending(x => x.ReportsToPositionDescription)
                          .ThenBy(x => x.Description)
                : enriched.OrderBy(x => x.ReportsToPositionDescription == "" ? 1 : 0)
                          .ThenBy(x => x.ReportsToPositionDescription)
                          .ThenBy(x => x.Description),
            // Default: alphabetical by description, but when the search term is
            // a pure integer, put the exact-ID match first so typing "541"
            // immediately surfaces position 541 at the top of the list.
            _ when int.TryParse(search?.Trim(), out var sid) && sid != 0
                => enriched
                    .OrderBy(x => x.Id == sid.ToString() ? 0 :
                                  x.PositionCode == (search!.Trim()) ? 1 : 2)
                    .ThenBy(x => x.Description),
            _ => enriched.OrderBy(x => x.Description)
        };

        var total = await ordered.CountAsync(ct);
        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PaginatedResponse<PositionListItemDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PositionsSummaryDto> GetPositionsSummaryAsync(CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();

        // Aggregate with a single grouped scan of the joined set so totals
        // match what the paginated list would show, but without materialising
        // any rows into the API process.
        var configIds = db.PositionApprovalConfigs.Select(c => c.PositionId);
        var basePositions = db.Set<PayrollPosition>().AsNoTracking();

        var total = await basePositions.CountAsync(ct);
        var configured = await basePositions
            .CountAsync(p => configIds.Contains(p.PositionId.ToString()), ct);

        return new PositionsSummaryDto
        {
            Total = total,
            Configured = configured,
            NotConfigured = total - configured
        };
    }

    private static IQueryable<PayrollPosition> BuildPositionQuery(OvertimeDbContext db, string? search)
    {
        // Return the full legacy dataset (all 4,895 rows). The Setup screen
        // owns its own visibility rules; we do not pre-filter on Status here
        // so the picker can find every real position in Platinum Payroll.
        var q = db.Set<PayrollPosition>().AsNoTracking();

        var term = (search ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(term)) return q;

        var lower = term.ToLowerInvariant();
        // Search description, code, numeric position ID, and incumbent
        // employee (first name, surname, or employee code via EXISTS subquery).
        // UniqueId is intentionally excluded — it is an internal DB key
        // (e.g. "ELIN2541") that users never see; substring-matching it
        // produces confusing false positives when typing a position ID.
        int.TryParse(term, out var idTerm);
        return q.Where(p =>
            (p.PositionDesc != null && p.PositionDesc.ToLower().Contains(lower)) ||
            (p.PositionCode != null && p.PositionCode.ToLower().Contains(lower)) ||
            (idTerm != 0 && p.PositionId == idTerm) ||
            db.PayrollEmployees.Any(e =>
                e.PositionId == p.PositionId &&
                (
                    (e.FirstName != null && e.FirstName.ToLower().Contains(lower)) ||
                    (e.Surname != null && e.Surname.ToLower().Contains(lower)) ||
                    (e.EmpCode != null && e.EmpCode.ToLower().Contains(lower))
                )));
    }

}
