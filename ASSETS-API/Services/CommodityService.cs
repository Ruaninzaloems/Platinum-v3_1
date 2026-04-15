using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class CommodityService : ICommodityService
{
    private readonly DbConnectionFactory _db;
    public CommodityService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>("SELECT * FROM [Inven_Commodity] ORDER BY [CommodityDesc]");
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Inven_Commodity] WHERE [Commodity_ID] = @id", new { id });
    }
}
