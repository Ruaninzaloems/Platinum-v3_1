using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class WardService : IWardService
{
    private readonly DbConnectionFactory _db;
    public WardService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>("SELECT * FROM [Const_Ward] ORDER BY [WardDescription]");
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Const_Ward] WHERE [Ward_Id] = @id", new { id });
    }
}
