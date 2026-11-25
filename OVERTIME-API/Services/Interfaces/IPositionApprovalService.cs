using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;

namespace PlatinumOvertime_API.Services.Interfaces;

public interface IPositionApprovalService
{
    Task<PositionApprovalConfigDto> GetByPositionIdAsync(string positionId, CancellationToken ct = default);
    Task<PositionApprovalConfigDto> UpsertAsync(string positionId, UpdatePositionApprovalConfigRequest request, string? updatedBy, CancellationToken ct = default);

    Task<byte[]> GenerateImportTemplateAsync(CancellationToken ct = default);

    Task<byte[]> GenerateReportAsync(CancellationToken ct = default);

    Task<ImportPositionApprovalValidationResultDto> ValidateImportAsync(Stream fileStream, CancellationToken ct = default);

    Task<ImportPositionApprovalResultDto> ConfirmImportAsync(ConfirmPositionApprovalImportRequest request, string? updatedBy, CancellationToken ct = default);

    /// <summary>
    /// Returns a flat list of configured positions and their leaf subordinates,
    /// ready for the client to build into an organogram tree.
    /// Each node carries role flags and a <c>HasRecommenderGap</c> flag.
    /// When <paramref name="gapsOnly"/> is <c>true</c>, only nodes on a path
    /// that leads to at least one gap are returned; summary total counts are
    /// always the full dataset regardless.
    /// Unconnected PAC islands (no active relationships) are always excluded.
    /// </summary>
    Task<OrgChartDto> GetOrgChartAsync(bool gapsOnly = false, CancellationToken ct = default);
}
