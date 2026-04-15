using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class StreetService : IStreetService
{
    private readonly DbConnectionFactory _db;
    public StreetService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(int? suburbId)
    {
        using var conn = _db.CreateConnection();
        var sql = "SELECT * FROM [Const_Street] WHERE 1=1";
        var p = new DynamicParameters();
        if (suburbId.HasValue) { sql += " AND [SuburbID] = @suburbId"; p.Add("suburbId", suburbId.Value); }
        sql += " ORDER BY [StreetName]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Const_Street] WHERE [Street_ID] = @id", new { id });
    }
}
