using System.Data;
using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Repositories;

public class ScmUnbundlingHeaderRepository : IScmUnbundlingHeaderRepository
{
    private readonly DbConnectionFactory _db;

    public ScmUnbundlingHeaderRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ScmUnbundlingHeader>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<ScmUnbundlingHeader>("SELECT * FROM [SCM_AssetUnbundling_Header]");
    }

    public async Task<ScmUnbundlingHeader?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<ScmUnbundlingHeader>("SELECT * FROM [SCM_AssetUnbundling_Header] WHERE [AssetContractHeader_ID] = @id", new { id });
    }

    public async Task<int> CreateAsync(ScmUnbundlingHeader entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "INSERT INTO [SCM_AssetUnbundling_Header] ([ContractID], [AssetParentID], [VendorID], [Enabled], [Complete], [DateCaptured], [CapturerID], [DateModified], [ModifierID]) OUTPUT INSERTED.[AssetContractHeader_ID] VALUES (@ContractID, @AssetParentID, @VendorID, @Enabled, @Complete, @DateCaptured, @CapturerID, @DateModified, @ModifierID)";
        return await conn.ExecuteScalarAsync<int>(sql, entity);
    }

    public async Task<bool> UpdateAsync(ScmUnbundlingHeader entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "UPDATE [SCM_AssetUnbundling_Header] SET [ContractID] = @ContractID, [AssetParentID] = @AssetParentID, [VendorID] = @VendorID, [Enabled] = @Enabled, [Complete] = @Complete, [DateCaptured] = @DateCaptured, [CapturerID] = @CapturerID, [DateModified] = @DateModified, [ModifierID] = @ModifierID WHERE [AssetContractHeader_ID] = @AssetContractHeader_ID";
        return await conn.ExecuteAsync(sql, entity) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM [SCM_AssetUnbundling_Header] WHERE [AssetContractHeader_ID] = @id", new { id }) > 0;
    }
}
