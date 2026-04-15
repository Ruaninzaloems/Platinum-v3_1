using System.Data;
using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Repositories;

public class MonthRepository : IMonthRepository
{
    private readonly DbConnectionFactory _db;

    public MonthRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<MonthLookup>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<MonthLookup>("SELECT * FROM [Const_Month_sys]");
    }

    public async Task<MonthLookup?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<MonthLookup>("SELECT * FROM [Const_Month_sys] WHERE [Month_ID] = @id", new { id });
    }

    public async Task<int> CreateAsync(MonthLookup entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "INSERT INTO [Const_Month_sys] ([Month], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) OUTPUT INSERTED.[Month_ID] VALUES (@Month, @Enabled, @DateCaptured, @CapturerID, @DateModified, @ModifierID)";
        return await conn.ExecuteScalarAsync<int>(sql, entity);
    }

    public async Task<bool> UpdateAsync(MonthLookup entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "UPDATE [Const_Month_sys] SET [Month] = @Month, [Enabled] = @Enabled, [DateCaptured] = @DateCaptured, [CapturerID] = @CapturerID, [DateModified] = @DateModified, [ModifierID] = @ModifierID WHERE [Month_ID] = @Month_ID";
        return await conn.ExecuteAsync(sql, entity) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM [Const_Month_sys] WHERE [Month_ID] = @id", new { id }) > 0;
    }
}
