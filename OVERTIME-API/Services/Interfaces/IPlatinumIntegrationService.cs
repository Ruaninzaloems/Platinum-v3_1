using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;

namespace PlatinumOvertime_API.Services.Interfaces;

/// <summary>
/// Abstraction over the existing Platinum APIs that supply Employees,
/// Positions, Departments and (later) Salary Transactions.
/// 
/// IMPORTANT: We do NOT read directly from the Platinum SQL DB.
/// Today the implementation is a seeded mock (MockPlatinumIntegrationService).
/// To swap in the real Platinum APIs, add an HTTP-backed implementation
/// and register it in Program.cs based on PlatinumIntegrationOptions.
/// </summary>
public interface IPlatinumIntegrationService
{
    Task<List<EmployeeDto>> GetEmployeesAsync(string? search = null, CancellationToken ct = default);
    Task<EmployeeDto?> GetEmployeeAsync(string employeeId, CancellationToken ct = default);

    Task<List<PositionDto>> GetPositionsAsync(string? search = null, CancellationToken ct = default);
    Task<PositionDto?> GetPositionAsync(string positionId, CancellationToken ct = default);

    /// <summary>
    /// Server-side search/filter/page for the Position Approval Setup grid.
    /// Joins the legacy Position list with the local PositionApprovalConfig
    /// table to compute the IsConfigured flag without round-tripping the
    /// full dataset to the API process.
    /// </summary>
    Task<PaginatedResponse<PositionListItemDto>> GetPositionsListAsync(
        string? search,
        string? status,
        int page,
        int pageSize,
        string? sort = null,
        string? sortDirection = null,
        CancellationToken ct = default);

    /// <summary>
    /// Counts of total / configured / not-configured positions across the
    /// full dataset. Backs the KPI cards on the Position Approval Setup list.
    /// </summary>
    Task<PositionsSummaryDto> GetPositionsSummaryAsync(CancellationToken ct = default);

    Task<List<DepartmentDto>> GetDepartmentsAsync(CancellationToken ct = default);
}
