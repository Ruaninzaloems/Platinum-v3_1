using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Repositories;

public class PlanProjectRepository : IPlanProjectRepository
{
    private readonly DbConnectionFactory _db;
    public PlanProjectRepository(DbConnectionFactory db) => _db = db;

    private static string? S(Dictionary<string, object?> m, string k) => m.TryGetValue(k, out var v) ? v?.ToString() : null;
    private static int? I(Dictionary<string, object?> m, string k) { var s = S(m, k); return int.TryParse(s, out var n) ? n : null; }
    private static decimal? D(Dictionary<string, object?> m, string k) { var s = S(m, k); return decimal.TryParse(s, out var n) ? n : null; }

    public async Task<IEnumerable<dynamic>> GetProjectsAsync(string? finYear)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT [Project_ID] AS projectId,[ProjectCode] AS projectCode,
                   [ProjectName] AS projectName,[ProjectDesc] AS projectDesc,
                   [FinYear] AS finYear,[ScoaProjectID] AS scoaProjectId
            FROM [Plan_Project]
            WHERE ([IsDeleted] IS NULL OR [IsDeleted]=0)";
        var p = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(finYear)) { sql += " AND [FinYear]=@finYear"; p.Add("finYear", finYear); }
        sql += " ORDER BY [ProjectCode]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetProjectAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT * FROM [Plan_Project] WHERE [Project_ID]=@id", new { id });
    }

    public async Task<dynamic> CreateProjectAsync(Dictionary<string, object?> model)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstAsync<dynamic>(@"
            INSERT INTO [Plan_Project]
                ([ProjectCode],[ProjectName],[ProjectDesc],[FinYear],[ScoaProjectID],[DateCaptured],[CapturerID])
            OUTPUT INSERTED.*
            VALUES (@code,@name,@desc,@finYear,@scoaProjectId,GETDATE(),1)",
            new
            {
                code = S(model, "ProjectCode"), name = S(model, "ProjectName"),
                desc = S(model, "ProjectDesc"), finYear = S(model, "FinYear"),
                scoaProjectId = I(model, "ScoaProjectID")
            });
    }

    public async Task<bool> UpdateProjectAsync(int id, Dictionary<string, object?> model)
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.ExecuteAsync(@"
            UPDATE [Plan_Project]
            SET [ProjectCode]=@code,[ProjectName]=@name,[ProjectDesc]=@desc,
                [FinYear]=@finYear,[ScoaProjectID]=@scoaProjectId
            WHERE [Project_ID]=@id",
            new
            {
                code = S(model, "ProjectCode"), name = S(model, "ProjectName"),
                desc = S(model, "ProjectDesc"), finYear = S(model, "FinYear"),
                scoaProjectId = I(model, "ScoaProjectID"), id
            });
        return rows > 0;
    }

    public async Task<bool> DeleteProjectAsync(int id)
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "UPDATE [Plan_Project] SET [IsDeleted]=1 WHERE [Project_ID]=@id", new { id });
        return rows > 0;
    }

    public async Task<IEnumerable<dynamic>> GetProjectItemsAsync(int? projectId, string? finYear)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT ppi.[PlanProjectItem_ID] AS planProjectItemId,
                   ppi.[ProjectID] AS projectId,
                   ppi.[SCOAItemID] AS scoaItemId,
                   ppi.[FinYear] AS finYear,
                   COALESCE(ppi.[BudgetAmount],0) AS budgetAmount,
                   ppi.[SCOAFunctionId] AS scoaFunctionId,
                   ppi.[SCOARegionId] AS scoaRegionId,
                   ppi.[DivisionId] AS divisionId,
                   CAST(ppi.[PlanProjectItem_ID] AS NVARCHAR(20)) + ' | ' +
                   COALESCE(css.[ScoaCode],'') + ' | ' +
                   COALESCE(css.[ScoaShortDesc],'') AS scoaDesc
            FROM [Plan_ProjectItem] ppi
            LEFT JOIN [Const_SCOA_Structure] css ON ppi.[SCOAItemID]=css.[ScoaID]
            WHERE 1=1";
        var p = new DynamicParameters();
        if (projectId.HasValue) { sql += " AND ppi.[ProjectID]=@projectId"; p.Add("projectId", projectId.Value); }
        if (!string.IsNullOrWhiteSpace(finYear)) { sql += " AND ppi.[FinYear]=@finYear"; p.Add("finYear", finYear); }
        sql += " ORDER BY css.[ScoaCode],ppi.[PlanProjectItem_ID]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<IEnumerable<dynamic>> GetProjectItemsScoaAsync(int? projectId, string? finYear)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT ppi.[PlanProjectItem_ID] AS planProjectItemId,
                   ppi.[ProjectID] AS projectId,
                   ppi.[SCOAItemID] AS scoaItemId,
                   ppi.[FinYear] AS finYear,
                   COALESCE(ppi.[BudgetAmount],0) AS budgetAmount,
                   ppi.[SCOAFunctionId] AS scoaFunctionId,
                   ppi.[SCOARegionId] AS scoaRegionId,
                   ppi.[DivisionId] AS divisionId,
                   css.[ScoaCode] AS scoaCode,
                   css.[ScoaShortDesc] AS scoaShortDesc,
                   CAST(ppi.[PlanProjectItem_ID] AS NVARCHAR(20)) + ' | ' +
                   COALESCE(css.[ScoaCode],'') + ' | ' +
                   COALESCE(css.[ScoaShortDesc],'') AS scoaDesc
            FROM [Plan_ProjectItem] ppi
            LEFT JOIN [Const_SCOA_Structure] css ON ppi.[SCOAItemID]=css.[ScoaID]
            WHERE 1=1";
        var p = new DynamicParameters();
        if (projectId.HasValue) { sql += " AND ppi.[ProjectID]=@projectId"; p.Add("projectId", projectId.Value); }
        if (!string.IsNullOrWhiteSpace(finYear)) { sql += " AND ppi.[FinYear]=@finYear"; p.Add("finYear", finYear); }
        sql += " ORDER BY css.[ScoaCode],ppi.[PlanProjectItem_ID]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetProjectItemAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT * FROM [Plan_ProjectItem] WHERE [PlanProjectItem_ID]=@id", new { id });
    }

    public async Task<dynamic> CreateProjectItemAsync(Dictionary<string, object?> model)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstAsync<dynamic>(@"
            INSERT INTO [Plan_ProjectItem]
                ([ProjectID],[SCOAItemID],[FinYear],[BudgetAmount],[SCOAFunctionId],[SCOARegionId],[DivisionId],[DateCaptured],[CapturerID])
            OUTPUT INSERTED.*
            VALUES (@projectId,@scoaItemId,@finYear,@budgetAmount,@scoaFunctionId,@scoaRegionId,@divisionId,GETDATE(),1)",
            new
            {
                projectId = I(model, "ProjectID") ?? I(model, "projectId"),
                scoaItemId = I(model, "SCOAItemID") ?? I(model, "scoaItemId"),
                finYear = S(model, "FinYear") ?? S(model, "finYear"),
                budgetAmount = D(model, "BudgetAmount") ?? D(model, "budgetAmount"),
                scoaFunctionId = I(model, "SCOAFunctionId") ?? I(model, "scoaFunctionId"),
                scoaRegionId = I(model, "SCOARegionId") ?? I(model, "scoaRegionId"),
                divisionId = I(model, "DivisionId") ?? I(model, "divisionId")
            });
    }

    public async Task<bool> UpdateProjectItemAsync(int id, Dictionary<string, object?> model)
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.ExecuteAsync(@"
            UPDATE [Plan_ProjectItem]
            SET [SCOAItemID]=@scoaItemId,[BudgetAmount]=@budgetAmount,
                [SCOAFunctionId]=@scoaFunctionId,[SCOARegionId]=@scoaRegionId,[DivisionId]=@divisionId
            WHERE [PlanProjectItem_ID]=@id",
            new
            {
                scoaItemId = I(model, "SCOAItemID") ?? I(model, "scoaItemId"),
                budgetAmount = D(model, "BudgetAmount") ?? D(model, "budgetAmount"),
                scoaFunctionId = I(model, "SCOAFunctionId") ?? I(model, "scoaFunctionId"),
                scoaRegionId = I(model, "SCOARegionId") ?? I(model, "scoaRegionId"),
                divisionId = I(model, "DivisionId") ?? I(model, "divisionId"),
                id
            });
        return rows > 0;
    }

    public async Task<bool> DeleteProjectItemAsync(int id)
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.ExecuteAsync("DELETE FROM [Plan_ProjectItem] WHERE [PlanProjectItem_ID]=@id", new { id });
        return rows > 0;
    }
}
