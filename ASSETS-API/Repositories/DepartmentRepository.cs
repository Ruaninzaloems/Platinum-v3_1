using System.Data;
using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Repositories;

public class DepartmentRepository : IDepartmentRepository
{
    private readonly DbConnectionFactory _db;

    public DepartmentRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Department>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<Department>("SELECT * FROM [Const_Department]");
    }

    public async Task<Department?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Department>("SELECT * FROM [Const_Department] WHERE [Department_ID] = @id", new { id });
    }

    public async Task<int> CreateAsync(Department entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "INSERT INTO [Const_Department] ([DepartmentDesc], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID], [DepartmentCode], [StartDate], [EndDate], [VatApportionment], [ManagerPositionID], [ManagerStartDate], [ManagerEndDate], [FinYear]) OUTPUT INSERTED.[Department_ID] VALUES (@DepartmentDesc, @Enabled, @DateCaptured, @CapturerID, @DateModified, @ModifierID, @DepartmentCode, @StartDate, @EndDate, @VatApportionment, @ManagerPositionID, @ManagerStartDate, @ManagerEndDate, @FinYear)";
        return await conn.ExecuteScalarAsync<int>(sql, entity);
    }

    public async Task<bool> UpdateAsync(Department entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "UPDATE [Const_Department] SET [DepartmentDesc] = @DepartmentDesc, [Enabled] = @Enabled, [DateCaptured] = @DateCaptured, [CapturerID] = @CapturerID, [DateModified] = @DateModified, [ModifierID] = @ModifierID, [DepartmentCode] = @DepartmentCode, [StartDate] = @StartDate, [EndDate] = @EndDate, [VatApportionment] = @VatApportionment, [ManagerPositionID] = @ManagerPositionID, [ManagerStartDate] = @ManagerStartDate, [ManagerEndDate] = @ManagerEndDate, [FinYear] = @FinYear WHERE [Department_ID] = @Department_ID";
        return await conn.ExecuteAsync(sql, entity) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM [Const_Department] WHERE [Department_ID] = @id", new { id }) > 0;
    }
}
