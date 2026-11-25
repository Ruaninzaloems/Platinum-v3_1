using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AnalyticsController(DbConnectionFactory db) => _db = db;

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var summaryResult = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT
                COUNT(*) as total_assets,
                COALESCE(SUM(""PurchaseAmount""), 0) as total_cost,
                COALESCE(SUM(""AccumulatedDepreciationClosingBalance""), 0) as total_depreciation,
                COALESCE(SUM(""AccumulatedImpairmentClosingBalance""), 0) as total_impairment,
                COALESCE(SUM(""CarryingAmountClosingBalance""), 0) as total_carrying_amount,
                COALESCE(SUM(""RevaluationOpeningBalance""), 0) as total_revaluation_reserve
            FROM ""Asset_Register_Items""
        ");

        var categoryResult = await conn.QueryAsync<dynamic>(@"
            SELECT
                COALESCE(cat.""AssetCategoryDesc"", 'Unknown') as category_name,
                COUNT(*) as count,
                COALESCE(SUM(a.""PurchaseAmount""), 0) as cost_closing,
                COALESCE(SUM(a.""AccumulatedDepreciationClosingBalance""), 0) as dep_closing,
                COALESCE(SUM(a.""CarryingAmountClosingBalance""), 0) as carrying
            FROM ""Asset_Register_Items"" a
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON a.""AssetCategory_ID"" = cat.""AssetCategoryID""
            GROUP BY cat.""AssetCategoryDesc"", a.""AssetCategory_ID""
            ORDER BY SUM(a.""CarryingAmountClosingBalance"") DESC
        ");

        var conditionResult = await conn.QueryAsync<dynamic>(@"
            SELECT COALESCE(cond.""Description"", 'Not Assessed') as condition, COUNT(*) as count
            FROM ""Asset_Register_Items"" a
            LEFT JOIN ""Const_Asset_Condition"" cond ON a.""AssetCondition_ID"" = cond.""Asset_Condition_ID""
            GROUP BY cond.""Description"", a.""AssetCondition_ID""
            ORDER BY count DESC
        ");

        var departmentResult = await conn.QueryAsync<dynamic>(@"
            SELECT COALESCE(""MunicipalDepartment_ID"", 'Unknown') as department_name, COUNT(*) as count
            FROM ""Asset_Register_Items""
            GROUP BY ""MunicipalDepartment_ID""
            ORDER BY count DESC
        ");

        var maintenanceCount = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(*) FROM ""Asset_MaintenanceRequest""");

        var workflowStats = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT
                COUNT(*) FILTER (WHERE status = 'pending') as pending_approvals,
                COUNT(*) FILTER (WHERE status = 'approved') as total_approved,
                COUNT(*) FILTER (WHERE status = 'rejected') as total_rejected
            FROM ""Asset_WorkflowInstances""
        ");

        var nearingEolCount = await conn.ExecuteScalarAsync<int>(@"
            SELECT COUNT(*) FROM ""Asset_Register_Items""
            WHERE ""RemainingUsefulLife"" IS NOT NULL
              AND ""RemainingUsefulLife"" > 0
              AND ""RemainingUsefulLife"" <= 12
        ");

        var revaluationModelCount = await conn.ExecuteScalarAsync<int>(@"
            SELECT COUNT(*) FROM ""Asset_Register_Items""
            WHERE ""RevaluationOpeningBalance"" IS NOT NULL AND ""RevaluationOpeningBalance"" > 0
        ");

        var openPeriodRow = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""Financial_Period"" as last_period, ""Financial_Year"" as fin_year
            FROM ""Asset_MonthlyApproval""
            WHERE ""IsApproved"" = TRUE
            ORDER BY ""Financial_Year"" DESC, ""Financial_Period"" DESC
            LIMIT 1
        ");

        int openPeriod;
        string openFinYear;
        if (openPeriodRow != null)
        {
            int lastPeriod = (int)openPeriodRow.last_period;
            string lastFinYear = (string)openPeriodRow.fin_year;
            int nextPeriod = lastPeriod + 1;
            if (nextPeriod > 12)
            {
                nextPeriod = 1;
                var parts = lastFinYear.Split('/');
                if (parts.Length == 2 && int.TryParse(parts[0], out int fy0))
                    openFinYear = (fy0 + 1) + "/" + (fy0 + 2);
                else
                    openFinYear = lastFinYear;
            }
            else
            {
                openFinYear = lastFinYear;
            }
            openPeriod = nextPeriod;
        }
        else
        {
            var settingsFy = await conn.ExecuteScalarAsync<string>(@"SELECT ""financial_year"" FROM ""Asset_OrganisationSettings"" LIMIT 1") ?? "2024/2025";
            openFinYear = settingsFy;
            openPeriod = 1;
        }

        var currentFinYear = await conn.ExecuteScalarAsync<string>(@"
            SELECT ""FinYear"" FROM ""Asset_Transaction_Summary""
            WHERE ""FinYear"" IS NOT NULL
            GROUP BY ""FinYear""
            ORDER BY ""FinYear"" DESC
            OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
        ") ?? "2024/2025";

        var depreciationByPeriod = await conn.QueryAsync<dynamic>(@"
            SELECT ""FinancialPeriod"" as period,
                   COALESCE(SUM(""DepreciationValue""), 0) as total
            FROM ""Asset_Transaction_Summary""
            WHERE ""FinYear"" = @finYear
              AND ""FinancialPeriod"" IS NOT NULL
              AND ""FinancialPeriod"" BETWEEN 1 AND 12
            GROUP BY ""FinancialPeriod""
            ORDER BY ""FinancialPeriod""
        ", new { finYear = currentFinYear });

        var periodToMonth = new Dictionary<int, string>
        {
            {1, "Jul"}, {2, "Aug"}, {3, "Sep"}, {4, "Oct"}, {5, "Nov"}, {6, "Dec"},
            {7, "Jan"}, {8, "Feb"}, {9, "Mar"}, {10, "Apr"}, {11, "May"}, {12, "Jun"}
        };

        var depLookup = depreciationByPeriod.ToDictionary(
            d => (int)d.period,
            d => Math.Round((decimal)d.total, 2)
        );

        var monthlyDepreciationData = Enumerable.Range(1, 12).Select(p => new
        {
            month = periodToMonth[p],
            amount = depLookup.ContainsKey(p) ? depLookup[p] : 0m
        }).ToArray();

        long totalAssets = summaryResult?.total_assets ?? 0;
        decimal totalCarrying = summaryResult?.total_carrying_amount ?? 0;
        decimal totalCost = summaryResult?.total_cost ?? 0;
        decimal totalDep = summaryResult?.total_depreciation ?? 0;
        decimal totalImp = summaryResult?.total_impairment ?? 0;
        decimal totalReval = summaryResult?.total_revaluation_reserve ?? 0;

        var valueByCategory = categoryResult.Select(c => new
        {
            category = (string)c.category_name,
            value = Math.Round((decimal)(c.carrying ?? 0)),
            costClosing = Math.Round((decimal)(c.cost_closing ?? 0)),
            depClosing = Math.Round((decimal)(c.dep_closing ?? 0)),
            count = (long)c.count
        }).Where(c => c.category != "Unknown").ToList();

        var conditionDistribution = conditionResult.Select(c =>
        {
            int count = (int)(long)c.count;
            return new { condition = (string)c.condition, count, percentage = totalAssets > 0 ? (int)(count * 100 / totalAssets) : 0 };
        }).ToList();

        long goodCount = conditionDistribution
            .Where(c => c.condition != null && c.condition.ToLower().Contains("good"))
            .Sum(c => (long)c.count);
        int conditionGoodPct = totalAssets > 0 ? (int)(goodCount * 100 / totalAssets) : 0;

        return Ok(new
        {
            kpis = new
            {
                totalAssetValue = Math.Round(totalCarrying),
                totalCostClosing = Math.Round(totalCost),
                totalDepreciationClosing = Math.Round(totalDep),
                totalImpairmentClosing = Math.Round(totalImp),
                totalRevaluationReserve = Math.Round(totalReval),
                totalAssetCount = totalAssets,
                wipCount = 0,
                disposedThisYear = 0,
                fleetVehicles = 0,
                maintenanceRequests = maintenanceCount,
                conditionGood = conditionGoodPct,
                conditionFair = 0,
                conditionPoor = 0,
                costModelCount = totalAssets,
                revaluationModelCount,
                totalAcquisitions = Math.Round(totalCost),
                totalDepreciationCharge = Math.Round(totalDep),
                totalDisposals = 0m,
                municipality = "Mnquma Local Municipality",
                finYear = openFinYear,
                financialPeriod = openPeriod,
                openPeriod,
                openFinYear,
                assetsNearingEol = nearingEolCount
            },
            charts = new
            {
                valueByCategory,
                conditionDistribution,
                monthlyDepreciation = monthlyDepreciationData,
                acquisitionsVsDisposals = new[] {
                    new { month = "Jul", acquisitions = 0, disposals = 0 },
                    new { month = "Aug", acquisitions = 0, disposals = 0 },
                    new { month = "Sep", acquisitions = 0, disposals = 0 }
                }
            },
            insights = new { critical_insights = 0, warning_insights = 0, active_insights = 0 },
            recentActivity = Array.Empty<object>()
        });
    }

    [HttpGet("insights")]
    public async Task<IActionResult> GetInsights([FromQuery] string? type, [FromQuery] string? severity, [FromQuery] bool? dismissed)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""Asset_AiInsights"" WHERE 1=1";
        var parameters = new DynamicParameters();
        if (!string.IsNullOrEmpty(type)) { sql += @" AND ""insight_type"" = @type"; parameters.Add("type", type); }
        if (!string.IsNullOrEmpty(severity)) { sql += @" AND ""severity"" = @severity"; parameters.Add("severity", severity); }
        bool showDismissed = dismissed.HasValue ? dismissed.Value : false;
        sql += @" AND ""is_dismissed"" = @dismissed";
        parameters.Add("dismissed", showDismissed);
        sql += @" ORDER BY CASE ""severity"" WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, ""generated_at"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("/api/locations")]
    public async Task<IActionResult> GetLocations()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            @"SELECT DISTINCT ""Suburb"" AS ""name""
              FROM ""Asset_Register_Items""
              WHERE ""Suburb"" IS NOT NULL AND ""Suburb"" != ''
              ORDER BY ""name""");
        return Ok(items);
    }

    [HttpGet("/api/category-totals")]
    public async Task<IActionResult> GetCategoryTotals()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT
                COALESCE(a.""AssetCategory_ID""::text, 'Uncategorised') as ""category"",
                COUNT(*) as ""count"",
                SUM(COALESCE(a.""PurchaseAmount"", 0)) as ""costClosing"",
                SUM(COALESCE(a.""AccumulatedDepreciationClosingBalance"", 0)) as ""depClosing"",
                SUM(COALESCE(a.""CarryingAmountClosingBalance"", 0)) as ""carrying"",
                SUM(COALESCE(a.""RevaluationOpeningBalance"", 0)) as ""revaluationReserve""
            FROM ""Asset_Register_Items"" a
            GROUP BY a.""AssetCategory_ID""
            ORDER BY a.""AssetCategory_ID""::text";
        var rows = await conn.QueryAsync<dynamic>(sql);
        return Ok(rows);
    }

    [HttpGet("clearing-balance")]
    public async Task<IActionResult> GetClearingBalance()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var activeFinYearRow = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""Financial_Year"" AS fin_year
            FROM ""Asset_MonthlyApproval""
            WHERE ""IsApproved"" = TRUE
            ORDER BY ""Financial_Year"" DESC, ""Financial_Period"" DESC
            LIMIT 1");

        string finYear = activeFinYearRow != null
            ? (string)activeFinYearRow.fin_year
            : (await conn.ExecuteScalarAsync<string>(@"SELECT ""financial_year"" FROM ""Asset_OrganisationSettings"" LIMIT 1") ?? "");

        int[] ids;
        try
        {
            ids = (await conn.QueryAsync<int>(@"
                SELECT ""PlanProjectItem_ID"" FROM ""Asset_ClearingAccounts""")).ToArray();
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "42P01") { ids = Array.Empty<int>(); }

        decimal balance = 0;
        if (ids.Length > 0)
        {
            balance = await conn.ExecuteScalarAsync<decimal>(@"
                SELECT COALESCE(SUM(""Debit""), 0) - COALESCE(SUM(""Credit""), 0)
                FROM ""Asset_GeneralLedger""
                WHERE ""PlanProjectItemID"" = ANY(@ids)
                  AND ""FinYear"" = @finYear",
                new { ids, finYear });
        }

        return Ok(new { finYear, balance = Math.Round(balance, 2), itemCount = ids.Length });
    }

    [HttpPatch("insights/{id:int}/dismiss")]
    public async Task<IActionResult> DismissInsight(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            UPDATE ""Asset_AiInsights"" SET ""is_dismissed"" = true, ""dismissed_by"" = 1, ""dismissed_at"" = NOW()
            WHERE ""id"" = @id RETURNING *", new { id });
        return result is null ? NotFound(new { error = "Insight not found" }) : Ok(result);
    }
}
