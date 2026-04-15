using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Repositories;

public class EmployeeRepository : IEmployeeRepository
{
    private readonly DbConnectionFactory _db;
    public EmployeeRepository(DbConnectionFactory db) { _db = db; }

    public async Task<IEnumerable<Employee>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<Employee>("SELECT * FROM [Payroll_Employee]");
    }

    public async Task<Employee?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Employee>("SELECT * FROM [Payroll_Employee] WHERE [Employee_ID] = @id", new { id });
    }

    public async Task<int> CreateAsync(Employee entity)
    {
        using var conn = _db.CreateConnection();
        return await conn.QuerySingleAsync<int>(
            @"INSERT INTO [Payroll_Employee] ([EmpCode], [IdNo], [TitleID], [Initials], [FirstName], [SecondName], [Surname], [KnownAsName],
              [DateOfBirth], [GenderID], [LanguageID], [MarriedID], [Dependants], [PassportNumber], [PassportCountryID],
              [EmailAddress], [HomeNumber], [WorkNumber], [CellNumber], [FaxNumber], [JoiningDate], [EndDate],
              [WorkOutside], [IncomeTaxNumber], [ExcludeUIF], [ExcludeSDL],
              [PhysicalAddress1], [PhysicalAddress2], [PhysicalPostalCode], [PhysicalCountryID], [PhysicalProvinceID], [PhysicalTownID],
              [AnnualSalary], [FixedSalary], [Enabled], [CapturerID], [DateCaptured], [IsDummy], [MunicipalityID], [CycleID],
              [PayrollDefinitionGroupID], [EthnicGroupID], [JobProfileID], [TaxCalculationType])
              OUTPUT INSERTED.[Employee_ID]
              VALUES (@EmpCode, @IdNo, @TitleID, @Initials, @FirstName, @SecondName, @Surname, @KnownAsName,
              @DateOfBirth, @GenderID, @LanguageID, @MarriedID, @Dependants, @PassportNumber, @PassportCountryID,
              @EmailAddress, @HomeNumber, @WorkNumber, @CellNumber, @FaxNumber, @JoiningDate, @EndDate,
              @WorkOutside, @IncomeTaxNumber, @ExcludeUIF, @ExcludeSDL,
              @PhysicalAddress1, @PhysicalAddress2, @PhysicalPostalCode, @PhysicalCountryID, @PhysicalProvinceID, @PhysicalTownID,
              @AnnualSalary, @FixedSalary, @Enabled, @CapturerID, GETDATE(), @IsDummy, @MunicipalityID, @CycleID,
              @PayrollDefinitionGroupID, @EthnicGroupID, @JobProfileID, @TaxCalculationType)", entity);
    }

    public async Task<bool> UpdateAsync(Employee entity)
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.ExecuteAsync(
            @"UPDATE [Payroll_Employee] SET [EmpCode] = @EmpCode, [IdNo] = @IdNo, [TitleID] = @TitleID, [Initials] = @Initials,
              [FirstName] = @FirstName, [SecondName] = @SecondName, [Surname] = @Surname, [KnownAsName] = @KnownAsName,
              [DateOfBirth] = @DateOfBirth, [GenderID] = @GenderID, [LanguageID] = @LanguageID,
              [EmailAddress] = @EmailAddress, [CellNumber] = @CellNumber, [JoiningDate] = @JoiningDate, [EndDate] = @EndDate,
              [Enabled] = @Enabled, [ModifierID] = @ModifierID, [DateModified] = GETDATE(),
              [MunicipalityID] = @MunicipalityID, [JobProfileID] = @JobProfileID, [TaxCalculationType] = @TaxCalculationType
              WHERE [Employee_ID] = @Employee_ID", entity);
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM [Payroll_Employee] WHERE [Employee_ID] = @id", new { id }) > 0;
    }
}
