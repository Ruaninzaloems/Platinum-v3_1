using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class RoomService : IRoomService
{
    private readonly DbConnectionFactory _db;
    public RoomService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(int? floorId)
    {
        using var conn = _db.CreateConnection();
        var sql = "SELECT * FROM [Const_Room] WHERE 1=1";
        var p = new DynamicParameters();
        if (floorId.HasValue) { sql += " AND [FloorID] = @floorId"; p.Add("floorId", floorId.Value); }
        sql += " ORDER BY [RoomDesc]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Const_Room] WHERE [Room_ID] = @id", new { id });
    }
}
