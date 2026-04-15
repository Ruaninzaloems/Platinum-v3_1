using Dapper;
using AssetManagement.Data;
using System.Data.Common;

namespace AssetManagement.Services;

public class LookupService
{
    private readonly DbConnectionFactory _db;
    public LookupService(DbConnectionFactory db) => _db = db;

    public async Task<int> GetDocumentTypeIdAsync(DbConnection conn, string documentTypeDesc, DbTransaction? txn = null)
    {
        var id = await conn.QuerySingleOrDefaultAsync<int?>(
            @"SELECT ""DocumentType_ID"" FROM ""Const_DocumentType"" WHERE ""DocumentTypeDesc"" = @documentTypeDesc LIMIT 1",
            new { documentTypeDesc }, txn);
        return id ?? 0;
    }

    public async Task<HashSet<int>> GetPlanProjectItemIdsAsync(DbConnection conn)
    {
        var ids = await conn.QueryAsync<int>(@"SELECT ""PlanProjectItem_ID"" FROM ""Plan_ProjectItem""");
        return new HashSet<int>(ids);
    }

    public async Task<Dictionary<string, int>> GetEmployeeIdsByIdNoAsync(DbConnection conn)
    {
        var rows = await conn.QueryAsync<(string IdNo, int EmployeeId)>(
            @"SELECT ""IdNo"", ""Employee_ID"" FROM ""Payroll_Employee"" WHERE ""IdNo"" IS NOT NULL AND ""IdNo"" <> ''");
        return rows.ToDictionary(r => r.IdNo, r => r.EmployeeId, StringComparer.OrdinalIgnoreCase);
    }

    public async Task<Dictionary<string, int>> GetDivisionIdsByDescAsync(DbConnection conn)
    {
        var rows = await conn.QueryAsync<(string DivisionDesc, int DivisionId, string DepartmentDesc, int? DepartmentId)>(
            @"SELECT d.""DivisionDesc"", d.""Division_ID"", COALESCE(dep.""DepartmentDesc"", '') AS ""DepartmentDesc"", d.""DepartmentID""
              FROM ""Const_Division"" d
              LEFT JOIN ""Const_Department"" dep ON dep.""Department_ID"" = d.""DepartmentID""
              WHERE d.""Enabled"" = 1");
        var dict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in rows)
        {
            var descKey = $"{r.DepartmentDesc}|{r.DivisionDesc}";
            if (!dict.ContainsKey(descKey))
                dict[descKey] = r.DivisionId;
            if (r.DepartmentId.HasValue)
            {
                var idKey = $"{r.DepartmentId}|{r.DivisionDesc}";
                if (!dict.ContainsKey(idKey))
                    dict[idKey] = r.DivisionId;
            }
        }
        return dict;
    }

    public async Task<IEnumerable<string>> GetPlanProjectFinancialYearsAsync(DbConnection conn)
    {
        return await conn.QueryAsync<string>(@"
            SELECT DISTINCT ""FinYear""
            FROM ""Plan_Project""
            WHERE ""FinYear"" IS NOT NULL AND ""FinYear"" <> ''
            ORDER BY ""FinYear"" DESC");
    }

    public async Task<string?> GetEmployeeFullNameAsync(DbConnection conn, int employeeId)
    {
        return await conn.QuerySingleOrDefaultAsync<string>(
            @"SELECT TRIM(COALESCE(""FirstName"", '') || ' ' || COALESCE(""Surname"", ''))
              FROM ""Payroll_Employee"" WHERE ""Employee_ID"" = @id",
            new { id = employeeId });
    }

    public async Task<string?> GetDepartmentDescAsync(DbConnection conn, int deptId)
    {
        return await conn.QuerySingleOrDefaultAsync<string>(
            @"SELECT ""DepartmentDesc"" FROM ""Const_Department"" WHERE ""Department_ID"" = @id",
            new { id = deptId });
    }

    public async Task<IEnumerable<dynamic>> GetDepartmentsByIdsAsync(DbConnection conn, int[] ids)
    {
        if (ids.Length == 0) return Enumerable.Empty<dynamic>();
        return await conn.QueryAsync<dynamic>(@"
            SELECT ""Department_ID"" AS ""id"", ""DepartmentDesc"" AS ""description""
            FROM ""Const_Department""
            WHERE ""Department_ID"" = ANY(@ids)
            ORDER BY ""DepartmentDesc""",
            new { ids });
    }

    public async Task<IEnumerable<dynamic>> GetDivisionsByIdsAsync(DbConnection conn, int[] ids)
    {
        if (ids.Length == 0) return Enumerable.Empty<dynamic>();
        return await conn.QueryAsync<dynamic>(@"
            SELECT ""Division_ID"" AS ""id"", ""DivisionDesc"" AS ""description"", ""DepartmentID"" AS ""departmentId""
            FROM ""Const_Division""
            WHERE ""Division_ID"" = ANY(@ids)
            ORDER BY ""DivisionDesc""",
            new { ids });
    }

    public async Task<IEnumerable<dynamic>> GetEmployeesByIdsAsync(DbConnection conn, int[] ids)
    {
        if (ids.Length == 0) return Enumerable.Empty<dynamic>();
        return await conn.QueryAsync<dynamic>(@"
            SELECT ""Employee_ID"" AS ""id"",
                   TRIM(COALESCE(""FirstName"", '') || ' ' || COALESCE(""Surname"", '')) AS ""name""
            FROM ""Payroll_Employee""
            WHERE ""Employee_ID"" = ANY(@ids)
            ORDER BY ""Surname"", ""FirstName""",
            new { ids });
    }

    public async Task<string?> GetLocationDescAsync(DbConnection conn, string table, string idCol, string descCol, int id)
    {
        return await conn.QuerySingleOrDefaultAsync<string>(
            $@"SELECT ""{descCol}"" FROM ""{table}"" WHERE ""{idCol}"" = @id",
            new { id });
    }

    public async Task<string?> GetDivisionDescAsync(DbConnection conn, int divisionId)
    {
        return await conn.QuerySingleOrDefaultAsync<string>(
            @"SELECT ""DivisionDesc"" FROM ""Const_Division"" WHERE ""Division_ID"" = @id",
            new { id = divisionId });
    }

    public async Task<string?> GetWardDescAsync(DbConnection conn, int wardId)
    {
        return await conn.QuerySingleOrDefaultAsync<string>(
            @"SELECT ""WardDescription"" FROM ""Const_Ward"" WHERE ""Ward_Id"" = @id",
            new { id = wardId });
    }

    public async Task<string?> GetBuildingDescAsync(DbConnection conn, int buildingId)
    {
        return await conn.QuerySingleOrDefaultAsync<string>(
            @"SELECT ""BuildingDesc"" FROM ""Const_Building"" WHERE ""Building_ID"" = @id",
            new { id = buildingId });
    }

    public async Task<string?> GetFloorDescAsync(DbConnection conn, int floorId)
    {
        return await conn.QuerySingleOrDefaultAsync<string>(
            @"SELECT ""FloorDesc"" FROM ""Const_Floor"" WHERE ""Floor_ID"" = @id",
            new { id = floorId });
    }

    public async Task<string?> GetRoomDescAsync(DbConnection conn, int roomId)
    {
        return await conn.QuerySingleOrDefaultAsync<string>(
            @"SELECT ""RoomDesc"" FROM ""Const_Room"" WHERE ""Room_ID"" = @id",
            new { id = roomId });
    }
}
