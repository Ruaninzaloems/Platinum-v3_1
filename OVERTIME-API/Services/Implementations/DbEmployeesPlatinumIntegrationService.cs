using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Decorator that replaces the in-memory employee list with rows read from
/// the legacy Payroll_Employee table via EF (read-only). Delegates positions
/// and departments to the wrapped inner implementation (which is the
/// DB-backed positions decorator over the mock, so positions stay DB-backed
/// and departments stay mocked until the real Department lookup ships).
///
/// Active-only filter: only employees with Enabled = true AND
/// (EndDate IS NULL OR EndDate &gt; today) are visible to the picker. This
/// matches the customer's expectation that the Acting Appointments picker
/// shows currently-employed staff, not historical / terminated rows.
/// </summary>
public class DbEmployeesPlatinumIntegrationService : IPlatinumIntegrationService
{
    private readonly IPlatinumIntegrationService _inner;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMemoryCache _cache;

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(1);

    public DbEmployeesPlatinumIntegrationService(
        IPlatinumIntegrationService inner,
        IServiceScopeFactory scopeFactory,
        IMemoryCache cache)
    {
        _inner = inner;
        _scopeFactory = scopeFactory;
        _cache = cache;
    }

    // Positions, departments — pass through to the wrapped service.
    public Task<List<PositionDto>> GetPositionsAsync(string? search = null, CancellationToken ct = default)
        => _inner.GetPositionsAsync(search, ct);

    public Task<PositionDto?> GetPositionAsync(string positionId, CancellationToken ct = default)
        => _inner.GetPositionAsync(positionId, ct);

    public Task<List<DepartmentDto>> GetDepartmentsAsync(CancellationToken ct = default)
        => _inner.GetDepartmentsAsync(ct);

    public Task<PaginatedResponse<PositionListItemDto>> GetPositionsListAsync(
        string? search, string? status, int page, int pageSize,
        string? sort = null, string? sortDirection = null, CancellationToken ct = default)
        => _inner.GetPositionsListAsync(search, status, page, pageSize, sort, sortDirection, ct);

    public Task<PositionsSummaryDto> GetPositionsSummaryAsync(CancellationToken ct = default)
        => _inner.GetPositionsSummaryAsync(ct);

    public async Task<List<EmployeeDto>> GetEmployeesAsync(string? search = null, CancellationToken ct = default)
    {
        // Cache the FULL allowed list under a single key so that any change to
        // AllowOverTime (or any other eligibility flag) is consistently visible
        // across all search terms after at most CacheTtl.  Per-search-term
        // caching caused stale results: e.g. searching "289" could still return
        // a previously-cached hit even after AllowOverTime was set to false,
        // because the name-based cache key had expired but the numeric one had not.
        const string CacheKey = "employees:all";

        if (!_cache.TryGetValue(CacheKey, out List<EmployeeDto>? all) || all is null)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();

            var today = DateTime.UtcNow.Date;

            var joined =
                from emp in db.Set<PayrollEmployee>().AsNoTracking()
                    .Where(e => e.Enabled == true
                             && (e.EndDate == null || e.EndDate > today)
                             && e.AllowOverTime == true)
                join pos in db.Set<PayrollPosition>().AsNoTracking()
                    on emp.PositionId equals pos.PositionId into posJoin
                from pos in posJoin.DefaultIfEmpty()
                join dept in db.Set<ConstDepartment>().AsNoTracking()
                    on pos.DepartmentId equals dept.DepartmentId into deptJoin
                from dept in deptJoin.DefaultIfEmpty()
                join div in db.Set<ConstDivision>().AsNoTracking()
                    on pos.DivisionId equals div.DivisionId into divJoin
                from div in divJoin.DefaultIfEmpty()
                orderby emp.Surname, emp.FirstName
                select new { emp, pos, dept, div };

            var rows = await joined.ToListAsync(ct);
            all = rows.Select(r => Map(r.emp, r.pos, r.dept, r.div)).ToList();
            _cache.Set(CacheKey, all, CacheTtl);
        }

        // Filter and sort in memory — fast on ~3 500 rows, and ensures every
        // search term sees the same consistent snapshot from the single cache entry.
        var term = (search ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(term))
            return all;

        var tokens = term.ToLowerInvariant()
            .Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);

        var numericQuery = tokens.Length == 1 && tokens[0].All(char.IsDigit);

        IEnumerable<EmployeeDto> filtered = all;
        foreach (var tok in tokens)
        {
            var t = tok;
            filtered = filtered.Where(e =>
                e.Id.Contains(t) ||
                e.FullName.ToLowerInvariant().Contains(t) ||
                e.PositionId.Contains(t));
        }

        return numericQuery
            ? filtered.OrderBy(e => int.TryParse(e.Id, out var n) ? n : int.MaxValue).ToList()
            : filtered.OrderBy(e => e.FullName).ToList();
    }

    public async Task<EmployeeDto?> GetEmployeeAsync(string employeeId, CancellationToken ct = default)
    {
        if (!int.TryParse(employeeId, out var id)) return null;
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();

        var row = await (
            from emp in db.Set<PayrollEmployee>().AsNoTracking()
            where emp.EmployeeId == id && emp.AllowOverTime == true
            join pos in db.Set<PayrollPosition>().AsNoTracking()
                on emp.PositionId equals pos.PositionId into posJoin
            from pos in posJoin.DefaultIfEmpty()
            join dept in db.Set<ConstDepartment>().AsNoTracking()
                on pos.DepartmentId equals dept.DepartmentId into deptJoin
            from dept in deptJoin.DefaultIfEmpty()
            join div in db.Set<ConstDivision>().AsNoTracking()
                on pos.DivisionId equals div.DivisionId into divJoin
            from div in divJoin.DefaultIfEmpty()
            select new { emp, pos, dept, div }
        ).FirstOrDefaultAsync(ct);

        return row is null ? null : Map(row.emp, row.pos, row.dept, row.div);
    }

    private static EmployeeDto Map(
        PayrollEmployee e,
        PayrollPosition? p,
        ConstDepartment? dept,
        ConstDivision? div)
    {
        var preferredFirst = !string.IsNullOrWhiteSpace(e.KnownAsName) ? e.KnownAsName : e.FirstName;
        var fullName = string.Join(" ",
            new[] { preferredFirst, e.Surname }
                .Where(s => !string.IsNullOrWhiteSpace(s)));

        return new EmployeeDto
        {
            Id             = e.EmployeeId.ToString(),
            EmployeeNumber = e.EmployeeId.ToString(),
            FullName       = string.IsNullOrWhiteSpace(fullName) ? $"Employee {e.EmployeeId}" : fullName,
            EmpCode        = e.EmpCode ?? string.Empty,
            IdNo           = e.IdNo ?? string.Empty,
            DepartmentId   = p?.DepartmentId?.ToString() ?? string.Empty,
            DepartmentName = dept?.DepartmentDesc ?? string.Empty,
            DivisionId     = p?.DivisionId?.ToString() ?? string.Empty,
            DivisionName   = div?.DivisionDesc ?? string.Empty,
            PositionId     = e.PositionId?.ToString() ?? string.Empty,
            PositionDescription = p?.PositionDesc ?? string.Empty,
            AllowOverTime  = e.AllowOverTime ?? true
        };
    }
}
