using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class AssetConfigEventTypeService : IAssetConfigEventTypeService
{
    private readonly DbConnectionFactory _db;
    public AssetConfigEventTypeService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>(
            "SELECT * FROM [AssetConfig_EventType] ORDER BY [EventTypeCode]");
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT * FROM [AssetConfig_EventType] WHERE [EventType_ID] = @id", new { id });
    }
}
