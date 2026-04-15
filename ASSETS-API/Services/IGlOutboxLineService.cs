using MssqlApi.Models;

namespace MssqlApi.Services;

public interface IGlOutboxLineService
{
    Task<IEnumerable<dynamic>> GetAllAsync(Guid? outboxId = null);
    Task<dynamic?> GetByIdAsync(long id);
    Task<long> CreateAsync(GlOutboxLineCreateRequest req);
}
