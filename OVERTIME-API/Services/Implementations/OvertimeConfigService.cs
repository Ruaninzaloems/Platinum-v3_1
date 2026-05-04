using AutoMapper;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Repositories.Interfaces;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

public class OvertimeConfigService : IOvertimeConfigService
{
    private readonly IOvertimeConfigRepository _repo;
    private readonly IMapper _mapper;
    private readonly ILogger<OvertimeConfigService> _logger;

    public OvertimeConfigService(IOvertimeConfigRepository repo, IMapper mapper, ILogger<OvertimeConfigService> logger)
    {
        _repo = repo;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<OvertimeConfigDto> GetAsync(CancellationToken ct = default)
    {
        var entity = await _repo.GetAsync(ct);
        if (entity is null)
        {
            // Default empty config if none has been saved yet.
            return new OvertimeConfigDto
            {
                AllowOvertimeMultipleApproval = false,
                CountingPeriodStartDay = 1,
                CountingPeriodEndDay = 31,
                MaximumMonthlyOvertimeHours = 40m,
                ExceptionalMaximumOvertimeHours = 60m,
                UpdatedAt = DateTime.UtcNow
            };
        }
        return _mapper.Map<OvertimeConfigDto>(entity);
    }

    public async Task<OvertimeConfigDto> UpdateAsync(UpdateOvertimeConfigRequest request, string? updatedBy, CancellationToken ct = default)
    {
        if (request.CountingPeriodStartDay < 1 || request.CountingPeriodStartDay > 31)
            throw new ArgumentException("CountingPeriodStartDay must be between 1 and 31.");
        if (request.CountingPeriodEndDay < 1 || request.CountingPeriodEndDay > 31)
            throw new ArgumentException("CountingPeriodEndDay must be between 1 and 31.");
        if (request.MaximumMonthlyOvertimeHours < 0)
            throw new ArgumentException("MaximumMonthlyOvertimeHours cannot be negative.");
        if (request.ExceptionalMaximumOvertimeHours < request.MaximumMonthlyOvertimeHours)
            throw new ArgumentException("ExceptionalMaximumOvertimeHours must be greater than or equal to MaximumMonthlyOvertimeHours.");

        var entity = _mapper.Map<OvertimeConfig>(request);
        entity.UpdatedBy = updatedBy;
        var saved = await _repo.UpsertAsync(entity, ct);
        _logger.LogInformation("Overtime config updated by {UpdatedBy}", updatedBy ?? "anonymous");
        return _mapper.Map<OvertimeConfigDto>(saved);
    }
}
