using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class UserProcessingMonthService : IUserProcessingMonthService
{
    private readonly DbConnectionFactory _db;
    public UserProcessingMonthService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(int? userId)
    {
        using var conn = _db.CreateConnection();
        var sql = "SELECT * FROM [User_UserProcessingMonth] WHERE 1=1";
        var p = new DynamicParameters();
        if (userId.HasValue) { sql += " AND [UserID] = @userId"; p.Add("userId", userId.Value); }
        sql += " ORDER BY [UserProcessingMonth_ID]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT * FROM [User_UserProcessingMonth] WHERE [UserProcessingMonth_ID] = @id", new { id });
    }

    public async Task<dynamic?> GetCurrentForUserAsync(int userId)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT TOP 1 * FROM [User_UserProcessingMonth] WHERE [UserID] = @userId ORDER BY [UserProcessingMonth_ID] DESC",
            new { userId });
    }

    public async Task<int> CreateAsync(Dictionary<string, object?> body)
    {
        using var conn = _db.CreateConnection();
        var p = new DynamicParameters();
        p.Add("userId", body.GetValueOrDefault("userId") ?? body.GetValueOrDefault("UserID"));
        p.Add("processingMonth", body.GetValueOrDefault("processingMonth") ?? body.GetValueOrDefault("ProcessingMonth"));
        return await conn.ExecuteScalarAsync<int>(
            "INSERT INTO [User_UserProcessingMonth] ([UserID],[ProcessingMonth],[DateCaptured]) OUTPUT INSERTED.[UserProcessingMonth_ID] VALUES (@userId,@processingMonth,GETDATE())", p);
    }

    public async Task<bool> UpdateAsync(int id, Dictionary<string, object?> body)
    {
        using var conn = _db.CreateConnection();
        var p = new DynamicParameters();
        p.Add("id", id);
        p.Add("processingMonth", body.GetValueOrDefault("processingMonth") ?? body.GetValueOrDefault("ProcessingMonth"));
        var rows = await conn.ExecuteAsync(
            "UPDATE [User_UserProcessingMonth] SET [ProcessingMonth]=@processingMonth,[DateModified]=GETDATE() WHERE [UserProcessingMonth_ID]=@id", p);
        return rows > 0;
    }
}
