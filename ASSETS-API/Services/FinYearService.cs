using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class FinYearService : IFinYearService
{
    private readonly DbConnectionFactory _db;
    public FinYearService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>(@"
            SELECT [ID] AS id, [FinYear] AS finYear, [CurrentIndex] AS currentIndex,
                   [ActiveFinYear] AS activeFinYear,
                   CASE WHEN [CurrentIndex] = 0 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS isDefault
            FROM [Const_FinYearWithIndex_sys]
            ORDER BY [CurrentIndex]");
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Const_FinYearWithIndex_sys] WHERE [ID] = @id", new { id });
    }

    public async Task<dynamic?> GetDefaultAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT TOP 1 [FinYear] AS finYear, [ActiveFinYear] AS activeFinYear FROM [Const_FinYearWithIndex_sys] WHERE [CurrentIndex] = 0 ORDER BY [ID] DESC");
    }
}
