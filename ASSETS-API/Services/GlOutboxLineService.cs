using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Services;

public class GlOutboxLineService : IGlOutboxLineService
{
    private readonly DbConnectionFactory _db;
    public GlOutboxLineService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(Guid? outboxId = null)
    {
        using var conn = _db.CreateConnection();
        if (outboxId.HasValue)
        {
            return await conn.QueryAsync<dynamic>(
                "SELECT * FROM [GL_Outbox_Lines] WHERE [OutboxId] = @outboxId ORDER BY [LineId]",
                new { outboxId = outboxId.Value });
        }
        return await conn.QueryAsync<dynamic>(
            "SELECT * FROM [GL_Outbox_Lines] ORDER BY [LineId]");
    }

    public async Task<dynamic?> GetByIdAsync(long id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT * FROM [GL_Outbox_Lines] WHERE [LineId] = @id", new { id });
    }

    public async Task<long> CreateAsync(GlOutboxLineCreateRequest req)
    {
        using var conn = _db.CreateConnection();
        return await conn.QuerySingleAsync<long>(@"
            INSERT INTO [GL_Outbox_Lines]
                ([OutboxId],[ProcessingMonth],[FinYear],[TransactionDetails],[SourceModuleId],
                 [Debit],[Credit],[CapturerId],[PlanProjectItemID],[VATRate],[VATRateID])
            VALUES
                (@OutboxId, @ProcessingMonth, @FinYear, @TransactionDetails, @SourceModuleId,
                 @Debit, @Credit, @CapturerId, @PlanProjectItemID, @VATRate, @VATRateID);
            SELECT SCOPE_IDENTITY()",
            new
            {
                req.OutboxId,
                req.ProcessingMonth,
                req.FinYear,
                req.TransactionDetails,
                req.SourceModuleId,
                req.Debit,
                req.Credit,
                req.CapturerId,
                req.PlanProjectItemID,
                req.VATRate,
                req.VATRateID
            });
    }
}
