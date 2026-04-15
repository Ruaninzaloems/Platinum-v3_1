using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class BuildingService : IBuildingService
{
    private readonly DbConnectionFactory _db;
    public BuildingService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>("SELECT * FROM [Const_Building] ORDER BY [BuildingDesc]");
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Const_Building] WHERE [Building_ID] = @id", new { id });
    }
}
