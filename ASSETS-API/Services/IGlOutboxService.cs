using MssqlApi.Models;

namespace MssqlApi.Services;

public interface IGlOutboxService
{
    Task<IEnumerable<dynamic>> GetAllAsync();
    Task<dynamic?> GetByIdAsync(Guid id);
    Task<Guid> CreateAsync(GlOutboxCreateRequest req);
    Task<bool> UpdateStatusAsync(Guid id, string status, string? lastError = null);
}
