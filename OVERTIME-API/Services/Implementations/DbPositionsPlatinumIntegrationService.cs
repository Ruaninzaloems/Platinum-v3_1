using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
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
    private readonly IMemoryCache _cache;

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);

    public DbPositionsPlatinumIntegrationService(
        MockPlatinumIntegrationService mock,
        IServiceScopeFactory scopeFactory,
        IMemoryCache cache)
    {
        _mock = mock;
        _scopeFactory = scopeFactory;
        _cache = cache;
    }

    public Task<List<EmployeeDto>> GetEmployeesAsync(string? search = null, CancellationToken ct = default)
        => _mock.GetEmployeesAsync(search, ct);

    public Task<EmployeeDto?> GetEmployeeAsync(string employeeId, CancellationToken ct = default)
        => _mock.GetEmployeeAsync(employeeId, ct);

    public Task<List<DepartmentDto>> GetDepartmentsAsync(CancellationToken ct = default)
        => _mock.GetDepartmentsAsync(ct);

    public async Task<List<PositionDto>> GetPositionsAsync(string? search = null, CancellationToken ct = default)
    {
        var cacheKey = $"positions:{(string.IsNullOrWhiteSpace(search) ? "all" : search.Trim().ToLowerInvariant())}";
        if (_cache.TryGetValue(cacheKey, out List<PositionDto>? cached) && cached is not null)
            return cached;

        // New scope so this singleton service can use the scoped DbContext.
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();

        // Load positions, employees, and departments in 3 flat queries then
        // join in memory. This replaces the previous approach which translated
        // to ~4,895 correlated OUTER APPLY subqueries (one per position row)
        // and caused ~3 second response times on the full unfiltered list.
        var positions = await BuildPositionQuery(db, search)
            .OrderBy(p => p.PositionDesc)
            .ToListAsync(ct);

        if (positions.Count == 0)
        {
            var empty = new List<PositionDto>();
            _cache.Set(cacheKey, empty, CacheTtl);
            return empty;
        }

        var positionIds = positions.Select(p => p.PositionId).ToHashSet();

        // One query for all incumbent employees in this result set.
        var empsByPositionId = await db.PayrollEmployees
            .AsNoTracking()
            .Where(e => e.PositionId.HasValue && positionIds.Contains(e.PositionId!.Value))
            .Select(e => new { e.PositionId, e.EmployeeId, e.EmpCode, e.FirstName, e.Surname })
            .ToListAsync(ct);
        var empMap = empsByPositionId
            .GroupBy(e => e.PositionId!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        // One query for all departments referenced by this result set.
        var deptIds = positions
            .Where(p => p.DepartmentId.HasValue)
            .Select(p => p.DepartmentId!.Value)
            .Distinct()
            .ToList();
        var deptMap = deptIds.Count > 0
            ? await db.ConstDepartments
                .AsNoTracking()
                .Where(d => deptIds.Contains(d.DepartmentId))
                .ToDictionaryAsync(d => d.DepartmentId, d => d.DepartmentDesc ?? string.Empty, ct)
            : new Dictionary<int, string>();

        var result = positions.Select(p =>
        {
            empMap.TryGetValue(p.PositionId, out var emp);
            var deptName = p.DepartmentId.HasValue && deptMap.TryGetValue(p.DepartmentId.Value, out var dn) ? dn : string.Empty;
            return new PositionDto
            {
                Id = p.PositionId.ToString(),
                PositionCode = p.PositionCode ?? string.Empty,
                Description = p.PositionDesc ?? string.Empty,
                DepartmentId = p.DepartmentId.HasValue ? p.DepartmentId.Value.ToString() : string.Empty,
                DepartmentName = deptName,
                EmployeeId = emp != null ? emp.EmployeeId.ToString() : string.Empty,
                EmployeeCode = emp?.EmpCode ?? string.Empty,
                EmployeeFirstName = emp?.FirstName ?? string.Empty,
                EmployeeSurname = emp?.Surname ?? string.Empty
            };
        }).ToList();

        _cache.Set(cacheKey, result, CacheTtl);
        return result;
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

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var positions = BuildPositionQuery(db, search);
        var statusKey = (status ?? "all").Trim().ToLowerInvariant();
        var sortKey = (sort ?? string.Empty).Trim().ToLowerInvariant();
        var desc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        // Materialize the configured position ID set once as integers.
        // This turns the status filter into a fast local IN-list rather than
        // a correlated EXISTS subquery repeated for every position row —
        // which was the primary cause of the slow COUNT query.
        var allConfiguredIdInts = (await db.PositionApprovalConfigs.AsNoTracking()
                .Select(c => c.PositionId)
                .ToListAsync(ct))
            .Select(s => int.TryParse(s, out var n) ? n : -1)
            .Where(n => n >= 0)
            .ToHashSet();

        // Apply status filter on the BASE positions query — no enrichment joins.
        IQueryable<PayrollPosition> filtered = statusKey switch
        {
            "configured" => positions.Where(p => allConfiguredIdInts.Contains(p.PositionId)),
            "notconfigured" or "not-configured" or "not_configured" =>
                positions.Where(p => !allConfiguredIdInts.Contains(p.PositionId)),
            _ => positions
        };

        // Fast count — just positions (+ optional search EXISTS), no OUTER APPLY.
        var total = await filtered.CountAsync(ct);
        if (total == 0)
            return new PaginatedResponse<PositionListItemDto>
            {
                Items = [],
                Total = 0,
                Page = page,
                PageSize = pageSize
            };

        // Fetch the page of raw PayrollPosition rows.
        // For "reportsto" sort we still need the join to determine order, but
        // the COUNT above is already fast. For all other sorts we order purely
        // on the positions table — no joins, very fast.
        List<PayrollPosition> pagePositions;

        if (sortKey == "reportsto")
        {
            // Build a minimal projection with just the sort key, page the IDs,
            // then re-fetch those specific rows to get all columns.
            var sortProjection =
                from p in filtered
                let reportsTo = (from r in db.PositionReportingRelationships
                                 join c in db.PositionApprovalConfigs
                                     on r.PositionApprovalConfigId equals c.Id
                                 where r.ReportsToPositionId == p.PositionId.ToString()
                                      && r.StartDate < tomorrow
                                      && (r.EndDate == null || r.EndDate >= today)
                                 orderby r.StartDate descending
                                 select c.PositionDescription).FirstOrDefault() ?? string.Empty
                select new { p.PositionId, p.PositionDesc, reportsTo };

            var orderedProjection = desc
                ? sortProjection.OrderBy(x => x.reportsTo == "" ? 1 : 0)
                                .ThenByDescending(x => x.reportsTo)
                                .ThenBy(x => x.PositionDesc)
                : sortProjection.OrderBy(x => x.reportsTo == "" ? 1 : 0)
                                .ThenBy(x => x.reportsTo)
                                .ThenBy(x => x.PositionDesc);

            var pageIds = await orderedProjection
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => x.PositionId)
                .ToListAsync(ct);

            var posDict = await db.Set<PayrollPosition>().AsNoTracking()
                .Where(p => pageIds.Contains(p.PositionId))
                .ToDictionaryAsync(p => p.PositionId, ct);

            pagePositions = pageIds
                .Where(id => posDict.ContainsKey(id))
                .Select(id => posDict[id])
                .ToList();
        }
        else
        {
            // Sort on positions columns only — no enrichment required.
            IOrderedQueryable<PayrollPosition> orderedBase;
            if (int.TryParse(search?.Trim(), out var sid) && sid != 0)
                orderedBase = filtered
                    .OrderBy(p => p.PositionId == sid ? 0 : p.PositionCode == search!.Trim() ? 1 : 2)
                    .ThenBy(p => p.PositionDesc);
            else if (desc)
                orderedBase = filtered.OrderByDescending(p => p.PositionDesc);
            else
                orderedBase = filtered.OrderBy(p => p.PositionDesc);

            pagePositions = await orderedBase
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);
        }

        if (pagePositions.Count == 0)
            return new PaginatedResponse<PositionListItemDto>
            {
                Items = [],
                Total = total,
                Page = page,
                PageSize = pageSize
            };

        // Enrich ONLY the page positions (max pageSize rows) with flat lookups.
        // No OUTER APPLY — each of the queries below is a single round-trip.
        var pageIds2 = pagePositions.Select(p => p.PositionId).ToList();
        var pageIdStrings = pageIds2.Select(id => id.ToString()).ToHashSet();

        // Department names
        var deptIds = pagePositions
            .Where(p => p.DepartmentId.HasValue)
            .Select(p => p.DepartmentId!.Value).Distinct().ToList();
        var deptMap = deptIds.Count > 0
            ? await db.ConstDepartments.AsNoTracking()
                .Where(d => deptIds.Contains(d.DepartmentId))
                .ToDictionaryAsync(d => d.DepartmentId, d => d.DepartmentDesc ?? string.Empty, ct)
            : new Dictionary<int, string>();

        // Division codes and names
        var divIds = pagePositions
            .Where(p => p.DivisionId.HasValue)
            .Select(p => p.DivisionId!.Value).Distinct().ToList();
        var divRows = divIds.Count > 0
            ? await db.ConstDivisions.AsNoTracking()
                .Where(d => divIds.Contains(d.DivisionId))
                .ToListAsync(ct)
            : [];
        var divCodeMap = divRows.ToDictionary(d => d.DivisionId, d => d.DivisionCode ?? string.Empty);
        var divNameMap = divRows.ToDictionary(d => d.DivisionId, d => d.DivisionDesc ?? string.Empty);

        // Incumbent employees (one per position)
        var empList = await db.PayrollEmployees.AsNoTracking()
            .Where(e => e.PositionId.HasValue && pageIds2.Contains(e.PositionId!.Value))
            .ToListAsync(ct);
        var empByPos = empList
            .GroupBy(e => e.PositionId!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        // ReportsTo descriptions — flat join, no correlated subquery
        var reportsToEntries = await (
            from r in db.PositionReportingRelationships
            join c in db.PositionApprovalConfigs on r.PositionApprovalConfigId equals c.Id
            where pageIdStrings.Contains(r.ReportsToPositionId)
                  && r.StartDate < tomorrow
                  && (r.EndDate == null || r.EndDate >= today)
            orderby r.StartDate descending
            select new { r.ReportsToPositionId, c.PositionDescription }
        ).ToListAsync(ct);
        var reportsToMap = reportsToEntries
            .GroupBy(x => x.ReportsToPositionId)
            .ToDictionary(g => g.Key, g => g.First().PositionDescription);

        var items = pagePositions.Select(p =>
        {
            empByPos.TryGetValue(p.PositionId, out var emp);
            var deptName = p.DepartmentId.HasValue && deptMap.TryGetValue(p.DepartmentId.Value, out var dn) ? dn : string.Empty;
            var divCode = p.DivisionId.HasValue && divCodeMap.TryGetValue(p.DivisionId.Value, out var dc) ? dc : string.Empty;
            var divName = p.DivisionId.HasValue && divNameMap.TryGetValue(p.DivisionId.Value, out var dv) ? dv : string.Empty;
            var posIdStr = p.PositionId.ToString();
            reportsToMap.TryGetValue(posIdStr, out var reportsTo);

            return new PositionListItemDto
            {
                Id = posIdStr,
                PositionCode = p.PositionCode ?? string.Empty,
                Description = p.PositionDesc ?? string.Empty,
                DepartmentId = p.DepartmentId.HasValue ? p.DepartmentId.Value.ToString() : string.Empty,
                DepartmentName = deptName,
                DivisionId = p.DivisionId.HasValue ? p.DivisionId.Value.ToString() : string.Empty,
                DivisionCode = divCode,
                DivisionName = divName,
                IsConfigured = allConfiguredIdInts.Contains(p.PositionId),
                EmployeeId = emp != null ? emp.EmployeeId.ToString() : string.Empty,
                EmployeeCode = emp?.EmpCode ?? string.Empty,
                EmployeeFirstName = emp?.FirstName ?? string.Empty,
                EmployeeSurname = emp?.Surname ?? string.Empty,
                ReportsToPositionDescription = reportsTo ?? string.Empty
            };
        }).ToList();

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
