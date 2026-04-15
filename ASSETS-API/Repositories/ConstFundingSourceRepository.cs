using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Repositories;

public class ConstFundingSourceRepository : IConstFundingSourceRepository
{
    private readonly DbConnectionFactory _db;
    public ConstFundingSourceRepository(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(string? finYear)
    {
        using var conn = _db.CreateConnection();
        var sql = "SELECT * FROM [Const_FundingSource] WHERE 1=1";
        var p = new DynamicParameters();
        if (!string.IsNullOrEmpty(finYear)) { sql += " AND [FinYear]=@finYear"; p.Add("finYear", finYear); }
        sql += " ORDER BY [FundingSource_ID]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT * FROM [Const_FundingSource] WHERE [FundingSource_ID]=@id", new { id });
    }

    public async Task<int> CreateAsync(string fundingSourceDesc, int enabled, string? finYear, int? previousReferenceId)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstAsync<int>(@"
            INSERT INTO [Const_FundingSource] ([FundingSourceDesc],[Enabled],[FinYear],[PreviousReferenceId])
            OUTPUT INSERTED.[FundingSource_ID]
            VALUES (@fundingSourceDesc,@enabled,@finYear,@previousReferenceId)",
            new { fundingSourceDesc, enabled, finYear, previousReferenceId });
    }

    public async Task<bool> UpdateAsync(int id, string fundingSourceDesc, int enabled, string? finYear)
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.ExecuteAsync(@"
            UPDATE [Const_FundingSource]
            SET [FundingSourceDesc]=@fundingSourceDesc,[Enabled]=@enabled,[FinYear]=@finYear
            WHERE [FundingSource_ID]=@id",
            new { fundingSourceDesc, enabled, finYear, id });
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "DELETE FROM [Const_FundingSource] WHERE [FundingSource_ID]=@id", new { id });
        return rows > 0;
    }
}
