using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class LedVoteService : ILedVoteService
{
    private readonly DbConnectionFactory _db;
    public LedVoteService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(string? finYear)
    {
        using var conn = _db.CreateConnection();
        var sql = @"SELECT [Vote_ID] AS id, [Vote] AS vote, [VoteDesc] AS voteDesc, [FinYear] AS finYear
                    FROM [Led_Vote] WHERE 1=1";
        var p = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(finYear)) { sql += " AND [FinYear] = @finYear"; p.Add("finYear", finYear); }
        sql += " ORDER BY [Vote]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Led_Vote] WHERE [Vote_ID] = @id", new { id });
    }
}
