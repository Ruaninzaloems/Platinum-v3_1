using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class ScoaStructureService : IScoaStructureService
{
    private readonly DbConnectionFactory _db;
    public ScoaStructureService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(string? tableId)
    {
        using var conn = _db.CreateConnection();
        var sql = "SELECT * FROM [Const_SCOA_Structure] WHERE 1=1";
        var p = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(tableId)) { sql += " AND [TableID] = @tableId"; p.Add("tableId", tableId); }
        sql += " ORDER BY [ScoaCode]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Const_SCOA_Structure] WHERE [ScoaID] = @id", new { id });
    }
}
