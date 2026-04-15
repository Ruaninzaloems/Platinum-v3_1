using System.Data;
using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Repositories;

public class DivisionRepository : IDivisionRepository
{
    private readonly DbConnectionFactory _db;

    public DivisionRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Division>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<Division>("SELECT * FROM [Const_Division]");
    }

    public async Task<Division?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Division>("SELECT * FROM [Const_Division] WHERE [Division_ID] = @id", new { id });
    }

    public async Task<int> CreateAsync(Division entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "INSERT INTO [Const_Division] ([DivisionDesc], [DivisionCode], [DepartmentID], [DivisionParentID], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID], [SCOAFunctionID], [HRPayrollSCOAFundID], [StartDate], [EndDate], [RegionID], [ProjectID], [ManagerPositionID], [ManagerStartDate], [ManagerEndDate], [ConditionOfServiceID], [DirectorateLevel], [FinYear]) OUTPUT INSERTED.[Division_ID] VALUES (@DivisionDesc, @DivisionCode, @DepartmentID, @DivisionParentID, @Enabled, @DateCaptured, @CapturerID, @DateModified, @ModifierID, @SCOAFunctionID, @HRPayrollSCOAFundID, @StartDate, @EndDate, @RegionID, @ProjectID, @ManagerPositionID, @ManagerStartDate, @ManagerEndDate, @ConditionOfServiceID, @DirectorateLevel, @FinYear)";
        return await conn.ExecuteScalarAsync<int>(sql, entity);
    }

    public async Task<bool> UpdateAsync(Division entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "UPDATE [Const_Division] SET [DivisionDesc] = @DivisionDesc, [DivisionCode] = @DivisionCode, [DepartmentID] = @DepartmentID, [DivisionParentID] = @DivisionParentID, [Enabled] = @Enabled, [DateCaptured] = @DateCaptured, [CapturerID] = @CapturerID, [DateModified] = @DateModified, [ModifierID] = @ModifierID, [SCOAFunctionID] = @SCOAFunctionID, [HRPayrollSCOAFundID] = @HRPayrollSCOAFundID, [StartDate] = @StartDate, [EndDate] = @EndDate, [RegionID] = @RegionID, [ProjectID] = @ProjectID, [ManagerPositionID] = @ManagerPositionID, [ManagerStartDate] = @ManagerStartDate, [ManagerEndDate] = @ManagerEndDate, [ConditionOfServiceID] = @ConditionOfServiceID, [DirectorateLevel] = @DirectorateLevel, [FinYear] = @FinYear WHERE [Division_ID] = @Division_ID";
        return await conn.ExecuteAsync(sql, entity) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM [Const_Division] WHERE [Division_ID] = @id", new { id }) > 0;
    }
}
