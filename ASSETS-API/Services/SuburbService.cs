using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class SuburbService : ISuburbService
{
    private readonly DbConnectionFactory _db;
    public SuburbService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(int? townId)
    {
        using var conn = _db.CreateConnection();
        var sql = "SELECT * FROM [Const_Suburb] WHERE 1=1";
        var p = new DynamicParameters();
        if (townId.HasValue) { sql += " AND [TownID] = @townId"; p.Add("townId", townId.Value); }
        sql += " ORDER BY [SuburbName]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Const_Suburb] WHERE [Suburb_ID] = @id", new { id });
    }
}
