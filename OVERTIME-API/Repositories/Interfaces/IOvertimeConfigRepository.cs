using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Repositories.Interfaces;

public interface IOvertimeConfigRepository
{
    Task<OvertimeConfig?> GetAsync(CancellationToken ct = default);
    Task<OvertimeConfig> UpsertAsync(OvertimeConfig config, CancellationToken ct = default);
}
