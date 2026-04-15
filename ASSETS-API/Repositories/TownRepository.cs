using System.Data;
using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Repositories;

public class TownRepository : ITownRepository
{
    private readonly DbConnectionFactory _db;

    public TownRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<TownLookup>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<TownLookup>("SELECT * FROM [Const_Town]");
    }

    public async Task<TownLookup?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<TownLookup>("SELECT * FROM [Const_Town] WHERE [Town_ID] = @id", new { id });
    }

    public async Task<int> CreateAsync(TownLookup entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "INSERT INTO [Const_Town] ([Town], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID], [FallswithinMunicipality], [TownCode], [ProvinceID], [Code]) OUTPUT INSERTED.[Town_ID] VALUES (@Town, @Enabled, @DateCaptured, @CapturerID, @DateModified, @ModifierID, @FallswithinMunicipality, @TownCode, @ProvinceID, @Code)";
        return await conn.ExecuteScalarAsync<int>(sql, entity);
    }

    public async Task<bool> UpdateAsync(TownLookup entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "UPDATE [Const_Town] SET [Town] = @Town, [Enabled] = @Enabled, [DateCaptured] = @DateCaptured, [CapturerID] = @CapturerID, [DateModified] = @DateModified, [ModifierID] = @ModifierID, [FallswithinMunicipality] = @FallswithinMunicipality, [TownCode] = @TownCode, [ProvinceID] = @ProvinceID, [Code] = @Code WHERE [Town_ID] = @Town_ID";
        return await conn.ExecuteAsync(sql, entity) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM [Const_Town] WHERE [Town_ID] = @id", new { id }) > 0;
    }
}
