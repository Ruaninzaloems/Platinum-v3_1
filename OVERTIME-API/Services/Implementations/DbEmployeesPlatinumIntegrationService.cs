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

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);

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
        var cacheKey = $"employees:{(string.IsNullOrWhiteSpace(search) ? "all" : search.Trim().ToLowerInvariant())}";
        if (_cache.TryGetValue(cacheKey, out List<EmployeeDto>? cached) && cached is not null)
            return cached;

        // New scope so this singleton service can use the scoped DbContext.
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();

        var today = DateTime.UtcNow.Date;
        var q = db.Set<PayrollEmployee>().AsNoTracking()
            .Where(e => e.Enabled == true && (e.EndDate == null || e.EndDate > today));

        var term = (search ?? string.Empty).Trim();
        var numericQuery = !string.IsNullOrEmpty(term) && term.All(char.IsDigit);
        if (!string.IsNullOrEmpty(term))
        {
            // Tokenize on whitespace so a natural full-name query like
            // "Rosemary Bredenkamp" matches a row whose FirstName contains
            // one token AND Surname contains the other. Each token must
            // independently hit some field. We deliberately match only the
            // identifier we display in the picker (Employee_ID) and the
            // visible name fields — EmpCode / IdNo / EmailAddress are not
            // shown to the user and including them produced confusing
            // "ghost" matches (e.g. typing "259" hitting a SA ID number).
            var tokens = term.ToLowerInvariant()
                .Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var tok in tokens)
            {
                var t = tok;
                q = q.Where(e =>
                    e.EmployeeId.ToString().Contains(t) ||
                    (e.PositionId != null && e.PositionId.ToString().Contains(t)) ||
                    (e.Surname != null && e.Surname.ToLower().Contains(t)) ||
                    (e.FirstName != null && e.FirstName.ToLower().Contains(t)) ||
                    (e.KnownAsName != null && e.KnownAsName.ToLower().Contains(t)));
            }
        }

        // Join Position → Department → Division in one query so the picker
        // and employee card have department/division names without extra
        // round-trips.
        var joined =
            from emp in q
            join pos in db.Set<PayrollPosition>().AsNoTracking()
                on emp.PositionId equals pos.PositionId into posJoin
            from pos in posJoin.DefaultIfEmpty()
            join dept in db.Set<ConstDepartment>().AsNoTracking()
                on pos.DepartmentId equals dept.DepartmentId into deptJoin
            from dept in deptJoin.DefaultIfEmpty()
            join div in db.Set<ConstDivision>().AsNoTracking()
                on pos.DivisionId equals div.DivisionId into divJoin
            from div in divJoin.DefaultIfEmpty()
            select new { emp, pos, dept, div };

        var ordered = numericQuery
            ? joined.OrderBy(r => r.emp.EmployeeId)
            : joined.OrderBy(r => r.emp.Surname).ThenBy(r => r.emp.FirstName);

        var rows = await ordered.ToListAsync(ct);
        var result = rows.Select(r => Map(r.emp, r.pos, r.dept, r.div)).ToList();

        _cache.Set(cacheKey, result, CacheTtl);
        return result;
    }

    public async Task<EmployeeDto?> GetEmployeeAsync(string employeeId, CancellationToken ct = default)
    {
        if (!int.TryParse(employeeId, out var id)) return null;
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();

        var row = await (
            from emp in db.Set<PayrollEmployee>().AsNoTracking()
            where emp.EmployeeId == id
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
            PositionDescription = p?.PositionDesc ?? string.Empty
        };
    }
}
