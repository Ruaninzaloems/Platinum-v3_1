using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Services;

public class GlOutboxService : IGlOutboxService
{
    private readonly DbConnectionFactory _db;
    public GlOutboxService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>("SELECT * FROM [GL_Outbox] ORDER BY [CreatedAt] DESC");
    }

    public async Task<dynamic?> GetByIdAsync(Guid id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT * FROM [GL_Outbox] WHERE [OutboxId] = @id", new { id });
    }

    public async Task<Guid> CreateAsync(GlOutboxCreateRequest req)
    {
        var outboxId = (req.OutboxId.HasValue && req.OutboxId.Value != Guid.Empty)
            ? req.OutboxId.Value
            : Guid.NewGuid();
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(@"
            INSERT INTO [GL_Outbox]
                ([OutboxId],[SubmoduleId],[EventType],[DocumentNumber],[IsCashflow],[Status],[RetryCount],[CreatedAt])
            VALUES
                (@outboxId, @SubmoduleId, @EventType, @DocumentNumber, @IsCashflow, @Status, 0, GETDATE())",
            new
            {
                outboxId,
                req.SubmoduleId,
                req.EventType,
                req.DocumentNumber,
                req.IsCashflow,
                req.Status
            });
        return outboxId;
    }

    public async Task<bool> UpdateStatusAsync(Guid id, string status, string? lastError = null)
    {
        using var conn = _db.CreateConnection();
        var affected = await conn.ExecuteAsync(@"
            UPDATE [GL_Outbox]
            SET [Status] = @status,
                [DispatchedAt] = CASE WHEN @status = 'POSTED' THEN GETDATE() ELSE [DispatchedAt] END,
                [LastError] = CASE WHEN @status = 'FAILED' THEN @lastError ELSE [LastError] END,
                [RetryCount] = CASE WHEN @status = 'FAILED' THEN [RetryCount] + 1 ELSE [RetryCount] END
            WHERE [OutboxId] = @id",
            new { id, status, lastError });
        return affected > 0;
    }
}
