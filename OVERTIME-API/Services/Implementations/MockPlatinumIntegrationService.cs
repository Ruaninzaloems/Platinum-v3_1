using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Repositories.Interfaces;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Seeded mock for the Platinum integration boundary.
/// Replace with an HTTP-backed implementation once the real Platinum API URLs are supplied.
/// </summary>
public class MockPlatinumIntegrationService : IPlatinumIntegrationService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public MockPlatinumIntegrationService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    private static readonly List<DepartmentDto> _departments = new()
    {
        new() { Id = "DPT-001", Code = "FIN", Name = "Finance", DivisionName = "Corporate Services" },
        new() { Id = "DPT-002", Code = "HR",  Name = "Human Resources", DivisionName = "Corporate Services" },
        new() { Id = "DPT-003", Code = "OPS", Name = "Operations", DivisionName = "Service Delivery" },
        new() { Id = "DPT-004", Code = "ENG", Name = "Engineering", DivisionName = "Service Delivery" },
        new() { Id = "DPT-005", Code = "PWR", Name = "Electricity & Water", DivisionName = "Infrastructure" }
    };

    private static readonly List<PositionDto> _positions = new()
    {
        new() { Id = "POS-001", PositionCode = "FIN-MGR",  Description = "Finance Manager",            DepartmentId = "DPT-001", DepartmentName = "Finance" },
        new() { Id = "POS-002", PositionCode = "FIN-SNR",  Description = "Senior Accountant",          DepartmentId = "DPT-001", DepartmentName = "Finance" },
        new() { Id = "POS-003", PositionCode = "FIN-CLK",  Description = "Accounts Clerk",             DepartmentId = "DPT-001", DepartmentName = "Finance" },
        new() { Id = "POS-004", PositionCode = "HR-MGR",   Description = "Human Resources Manager",    DepartmentId = "DPT-002", DepartmentName = "Human Resources" },
        new() { Id = "POS-005", PositionCode = "HR-OFF",   Description = "HR Officer",                 DepartmentId = "DPT-002", DepartmentName = "Human Resources" },
        new() { Id = "POS-006", PositionCode = "OPS-DIR",  Description = "Director: Operations",       DepartmentId = "DPT-003", DepartmentName = "Operations" },
        new() { Id = "POS-007", PositionCode = "OPS-SUP",  Description = "Operations Supervisor",      DepartmentId = "DPT-003", DepartmentName = "Operations" },
        new() { Id = "POS-008", PositionCode = "OPS-FW",   Description = "Field Worker",               DepartmentId = "DPT-003", DepartmentName = "Operations" },
        new() { Id = "POS-009", PositionCode = "ENG-MGR",  Description = "Engineering Manager",        DepartmentId = "DPT-004", DepartmentName = "Engineering" },
        new() { Id = "POS-010", PositionCode = "ENG-TECH", Description = "Technician",                 DepartmentId = "DPT-004", DepartmentName = "Engineering" },
        new() { Id = "POS-011", PositionCode = "PWR-FOR",  Description = "Power Foreman",              DepartmentId = "DPT-005", DepartmentName = "Electricity & Water" },
        new() { Id = "POS-012", PositionCode = "PWR-ELEC", Description = "Electrician",                DepartmentId = "DPT-005", DepartmentName = "Electricity & Water" }
    };

    private static readonly List<EmployeeDto> _employees = new()
    {
        new() { Id = "EMP-1001", EmployeeNumber = "10001", FullName = "Thandi Nkosi",      DepartmentId = "DPT-001", DepartmentName = "Finance",              PositionId = "POS-001", PositionDescription = "Finance Manager" },
        new() { Id = "EMP-1002", EmployeeNumber = "10002", FullName = "Sipho Dlamini",     DepartmentId = "DPT-001", DepartmentName = "Finance",              PositionId = "POS-003", PositionDescription = "Accounts Clerk" },
        new() { Id = "EMP-1003", EmployeeNumber = "10003", FullName = "Lerato Mokoena",    DepartmentId = "DPT-002", DepartmentName = "Human Resources",      PositionId = "POS-004", PositionDescription = "Human Resources Manager" },
        new() { Id = "EMP-1004", EmployeeNumber = "10004", FullName = "Kabelo Sithole",    DepartmentId = "DPT-003", DepartmentName = "Operations",           PositionId = "POS-006", PositionDescription = "Director: Operations" },
        new() { Id = "EMP-1005", EmployeeNumber = "10005", FullName = "Naledi Pillay",    DepartmentId = "DPT-003", DepartmentName = "Operations",           PositionId = "POS-007", PositionDescription = "Operations Supervisor" },
        new() { Id = "EMP-1006", EmployeeNumber = "10006", FullName = "Bongani Khumalo",   DepartmentId = "DPT-003", DepartmentName = "Operations",           PositionId = "POS-008", PositionDescription = "Field Worker" },
        new() { Id = "EMP-1007", EmployeeNumber = "10007", FullName = "Anika van der Merwe", DepartmentId = "DPT-004", DepartmentName = "Engineering",        PositionId = "POS-009", PositionDescription = "Engineering Manager" },
        new() { Id = "EMP-1008", EmployeeNumber = "10008", FullName = "Pieter Botha",      DepartmentId = "DPT-004", DepartmentName = "Engineering",          PositionId = "POS-010", PositionDescription = "Technician" },
        new() { Id = "EMP-1009", EmployeeNumber = "10009", FullName = "Refilwe Mahlangu",  DepartmentId = "DPT-005", DepartmentName = "Electricity & Water",  PositionId = "POS-011", PositionDescription = "Power Foreman" },
        new() { Id = "EMP-1010", EmployeeNumber = "10010", FullName = "Sizwe Cele",        DepartmentId = "DPT-005", DepartmentName = "Electricity & Water",  PositionId = "POS-012", PositionDescription = "Electrician" }
    };

    public Task<List<EmployeeDto>> GetEmployeesAsync(string? search = null, CancellationToken ct = default)
    {
        var q = (search ?? string.Empty).Trim();
        var list = string.IsNullOrEmpty(q)
            ? _employees
            : _employees.Where(e =>
                e.FullName.Contains(q, StringComparison.OrdinalIgnoreCase)
                || e.EmployeeNumber.Contains(q, StringComparison.OrdinalIgnoreCase)
                || e.Id.Contains(q, StringComparison.OrdinalIgnoreCase)).ToList();
        return Task.FromResult(list.ToList());
    }

    public Task<EmployeeDto?> GetEmployeeAsync(string employeeId, CancellationToken ct = default) =>
        Task.FromResult(_employees.FirstOrDefault(e => e.Id == employeeId));

    public Task<List<PositionDto>> GetPositionsAsync(string? search = null, CancellationToken ct = default)
    {
        return Task.FromResult(FilterPositions(search).ToList());
    }

    public Task<PositionDto?> GetPositionAsync(string positionId, CancellationToken ct = default) =>
        Task.FromResult(_positions.FirstOrDefault(p => p.Id == positionId));

    public Task<List<DepartmentDto>> GetDepartmentsAsync(CancellationToken ct = default) =>
        Task.FromResult(_departments.ToList());

    public async Task<PaginatedResponse<PositionListItemDto>> GetPositionsListAsync(
        string? search,
        string? status,
        int page,
        int pageSize,
        string? sort = null,
        string? sortDirection = null,
        CancellationToken ct = default)
    {
        var configuredIds = await GetConfiguredIdsAsync(ct);

        var enriched = FilterPositions(search).Select(p => new PositionListItemDto
        {
            Id = p.Id,
            PositionCode = p.PositionCode,
            Description = p.Description,
            DepartmentId = p.DepartmentId,
            DepartmentName = p.DepartmentName,
            IsConfigured = configuredIds.Contains(p.Id),
            ReportsToPositionDescription = string.Empty
        });

        var statusKey = (status ?? "all").Trim().ToLowerInvariant();
        enriched = statusKey switch
        {
            "configured" => enriched.Where(x => x.IsConfigured),
            "notconfigured" or "not-configured" or "not_configured" =>
                enriched.Where(x => !x.IsConfigured),
            _ => enriched
        };

        var sortKey = (sort ?? string.Empty).Trim().ToLowerInvariant();
        var desc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
        IOrderedEnumerable<PositionListItemDto> ordered = sortKey switch
        {
            // Empties always cluster at the end regardless of direction so the
            // user never has to scroll past a wall of blanks to find real data.
            "reportsto" => desc
                ? enriched.OrderBy(x => string.IsNullOrEmpty(x.ReportsToPositionDescription) ? 1 : 0)
                          .ThenByDescending(x => x.ReportsToPositionDescription)
                : enriched.OrderBy(x => string.IsNullOrEmpty(x.ReportsToPositionDescription) ? 1 : 0)
                          .ThenBy(x => x.ReportsToPositionDescription),
            _ => enriched.OrderBy(x => x.Description)
        };

        return PaginatedResponse<PositionListItemDto>.Create(ordered, page, pageSize);
    }

    public async Task<PositionsSummaryDto> GetPositionsSummaryAsync(CancellationToken ct = default)
    {
        var configuredIds = await GetConfiguredIdsAsync(ct);
        var total = _positions.Count;
        var configured = _positions.Count(p => configuredIds.Contains(p.Id));
        return new PositionsSummaryDto
        {
            Total = total,
            Configured = configured,
            NotConfigured = total - configured
        };
    }

    private IEnumerable<PositionDto> FilterPositions(string? search)
    {
        var q = (search ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(q)) return _positions;
        return _positions.Where(p =>
            p.Description.Contains(q, StringComparison.OrdinalIgnoreCase)
            || p.PositionCode.Contains(q, StringComparison.OrdinalIgnoreCase)
            || p.Id.Contains(q, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<HashSet<string>> GetConfiguredIdsAsync(CancellationToken ct)
    {
        // Singleton service uses a fresh scope to consume the scoped repo.
        using var scope = _scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IPositionApprovalRepository>();
        return await repo.GetConfiguredPositionIdsAsync(ct);
    }
}
