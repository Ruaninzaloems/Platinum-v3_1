using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;

namespace PlatinumOvertime_API.Services.Interfaces;

public interface IOvertimeConfigService
{
    Task<OvertimeConfigDto> GetAsync(CancellationToken ct = default);
    Task<OvertimeConfigDto> UpdateAsync(UpdateOvertimeConfigRequest request, string? updatedBy, CancellationToken ct = default);
}
