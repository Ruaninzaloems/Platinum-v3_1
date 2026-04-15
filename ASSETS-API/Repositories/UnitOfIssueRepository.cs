using System.Data;
using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Repositories;

public class UnitOfIssueRepository : IUnitOfIssueRepository
{
    private readonly DbConnectionFactory _db;

    public UnitOfIssueRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<UnitOfIssue>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<UnitOfIssue>("SELECT * FROM [Const_UnitOfIssue]");
    }

    public async Task<UnitOfIssue?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<UnitOfIssue>("SELECT * FROM [Const_UnitOfIssue] WHERE [UnitOfIssue_ID] = @id", new { id });
    }

    public async Task<int> CreateAsync(UnitOfIssue entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "INSERT INTO [Const_UnitOfIssue] ([UnitOfIssueDesc], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID], [UOMCode], [MeasureCategoryCode], [base], [GroupDefaultUom], [IsDeleted]) OUTPUT INSERTED.[UnitOfIssue_ID] VALUES (@UnitOfIssueDesc, @Enabled, @DateCaptured, @CapturerID, @DateModified, @ModifierID, @UOMCode, @MeasureCategoryCode, @base, @GroupDefaultUom, @IsDeleted)";
        return await conn.ExecuteScalarAsync<int>(sql, entity);
    }

    public async Task<bool> UpdateAsync(UnitOfIssue entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "UPDATE [Const_UnitOfIssue] SET [UnitOfIssueDesc] = @UnitOfIssueDesc, [Enabled] = @Enabled, [DateCaptured] = @DateCaptured, [CapturerID] = @CapturerID, [DateModified] = @DateModified, [ModifierID] = @ModifierID, [UOMCode] = @UOMCode, [MeasureCategoryCode] = @MeasureCategoryCode, [base] = @base, [GroupDefaultUom] = @GroupDefaultUom, [IsDeleted] = @IsDeleted WHERE [UnitOfIssue_ID] = @UnitOfIssue_ID";
        return await conn.ExecuteAsync(sql, entity) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM [Const_UnitOfIssue] WHERE [UnitOfIssue_ID] = @id", new { id }) > 0;
    }
}
