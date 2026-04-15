using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class PropertyTypeOfUseService : IPropertyTypeOfUseService
{
    private readonly DbConnectionFactory _db;
    public PropertyTypeOfUseService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>("SELECT * FROM [Const_PropertyTypeOfUse] ORDER BY [Description]");
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Const_PropertyTypeOfUse] WHERE [PropertyTypeOfUse_ID] = @id", new { id });
    }
}
