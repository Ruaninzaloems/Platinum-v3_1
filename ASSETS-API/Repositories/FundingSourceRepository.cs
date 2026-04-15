using System.Data;
using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Repositories;

public class FundingSourceRepository : IFundingSourceRepository
{
    private readonly DbConnectionFactory _db;

    public FundingSourceRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<FundingSource>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<FundingSource>("SELECT * FROM [Const_FundingSource]");
    }

    public async Task<FundingSource?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<FundingSource>("SELECT * FROM [Const_FundingSource] WHERE [FundingSource_ID] = @id", new { id });
    }

    public async Task<int> CreateAsync(FundingSource entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "INSERT INTO [Const_FundingSource] ([FundingSourceDesc], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID], [FinYear], [PreviousReferenceId]) OUTPUT INSERTED.[FundingSource_ID] VALUES (@FundingSourceDesc, @Enabled, @DateCaptured, @CapturerID, @DateModified, @ModifierID, @FinYear, @PreviousReferenceId)";
        return await conn.ExecuteScalarAsync<int>(sql, entity);
    }

    public async Task<bool> UpdateAsync(FundingSource entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "UPDATE [Const_FundingSource] SET [FundingSourceDesc] = @FundingSourceDesc, [Enabled] = @Enabled, [DateCaptured] = @DateCaptured, [CapturerID] = @CapturerID, [DateModified] = @DateModified, [ModifierID] = @ModifierID, [FinYear] = @FinYear, [PreviousReferenceId] = @PreviousReferenceId WHERE [FundingSource_ID] = @FundingSource_ID";
        return await conn.ExecuteAsync(sql, entity) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM [Const_FundingSource] WHERE [FundingSource_ID] = @id", new { id }) > 0;
    }
}
