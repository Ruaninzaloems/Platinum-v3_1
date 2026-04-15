using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class FloorService : IFloorService
{
    private readonly DbConnectionFactory _db;
    public FloorService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(int? buildingId)
    {
        using var conn = _db.CreateConnection();
        var sql = "SELECT * FROM [Const_Floor] WHERE 1=1";
        var p = new DynamicParameters();
        if (buildingId.HasValue) { sql += " AND [BuildingID] = @buildingId"; p.Add("buildingId", buildingId.Value); }
        sql += " ORDER BY [FloorDesc]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Const_Floor] WHERE [Floor_ID] = @id", new { id });
    }
}
