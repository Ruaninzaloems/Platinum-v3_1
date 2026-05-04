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
}
