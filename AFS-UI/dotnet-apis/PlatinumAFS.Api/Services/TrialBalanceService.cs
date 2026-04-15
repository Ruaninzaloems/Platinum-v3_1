using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using PlatinumAFS.Api.Data;
using PlatinumAFS.Api.Models;

namespace PlatinumAFS.Api.Services;

public class TrialBalanceService
{
    private readonly PlatinumDbContext _context;

    public TrialBalanceService(PlatinumDbContext context)
    {
        _context = context;
    }

    public async Task<List<string>> GetAvailableFinancialYearsAsync()
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT DISTINCT FinYear FROM [dbo].[Led_Vote] ORDER BY FinYear DESC";
            cmd.CommandTimeout = 30;

            var years = new List<string>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                years.Add(reader.GetString(0));
            return years;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    public async Task<(List<TrialBalanceEntry> Entries, int TotalCount)> GetTrialBalanceAsync(
        string? finYear = null,
        string? scoaItemCode = null,
        string? sortDesc = null,
        int? voteId = null,
        int page = 1,
        int pageSize = 100)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            var whereConditions = new List<string> { "v.ControlVote IN (0, 1)" };
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrEmpty(finYear))
            {
                whereConditions.Add("v.FinYear = @FinYear");
                parameters.Add(new SqlParameter("@FinYear", finYear));
            }

            if (!string.IsNullOrEmpty(scoaItemCode))
            {
                whereConditions.Add("scoa.ScoaCode = @ScoaItemCode");
                parameters.Add(new SqlParameter("@ScoaItemCode", scoaItemCode));
            }

            if (!string.IsNullOrEmpty(sortDesc))
            {
                whereConditions.Add(@"ISNULL(hier.Level1Desc, CASE
                    WHEN LEFT(scoa.ScoaCode, 2) = 'IA' THEN 'Assets'
                    WHEN LEFT(scoa.ScoaCode, 2) = 'IL' THEN 'Liabilities'
                    WHEN LEFT(scoa.ScoaCode, 2) = 'LN' THEN 'Net Assets'
                    WHEN LEFT(scoa.ScoaCode, 2) = 'IE' THEN 'Expenditure'
                    WHEN LEFT(scoa.ScoaCode, 2) = 'IR' THEN 'Revenue'
                    WHEN LEFT(scoa.ScoaCode, 2) = 'IZ' THEN 'Gains and Losses'
                    ELSE 'Unclassified'
                END) = @SortDesc");
                parameters.Add(new SqlParameter("@SortDesc", sortDesc));
            }

            if (voteId.HasValue)
            {
                whereConditions.Add("v.Vote_ID = @VoteId");
                parameters.Add(new SqlParameter("@VoteId", voteId.Value));
            }

            var priorYear1Param = new SqlParameter("@PriorYear1", SqlDbType.NVarChar, 20) { Value = (object?)null ?? DBNull.Value };
            var priorYear2Param = new SqlParameter("@PriorYear2", SqlDbType.NVarChar, 20) { Value = (object?)null ?? DBNull.Value };
            var priorYear3Param = new SqlParameter("@PriorYear3", SqlDbType.NVarChar, 20) { Value = (object?)null ?? DBNull.Value };

            if (!string.IsNullOrEmpty(finYear))
            {
                var priorYears = ComputePriorYears(finYear);
                if (priorYears.Length > 0) priorYear1Param.Value = priorYears[0];
                if (priorYears.Length > 1) priorYear2Param.Value = priorYears[1];
                if (priorYears.Length > 2) priorYear3Param.Value = priorYears[2];
            }

            parameters.Add(priorYear1Param);
            parameters.Add(priorYear2Param);
            parameters.Add(priorYear3Param);

            var whereClause = "WHERE " + string.Join(" AND ", whereConditions);

            int totalCount;
            using (var countCmd = connection.CreateCommand())
            {
                countCmd.CommandText = BuildCountSql(whereClause);
                countCmd.CommandTimeout = 120;
                foreach (var p in parameters)
                    countCmd.Parameters.Add(CloneParameter(p));
                var result = await countCmd.ExecuteScalarAsync();
                totalCount = Convert.ToInt32(result);
            }

            var entries = new List<TrialBalanceEntry>();
            using (var dataCmd = connection.CreateCommand())
            {
                dataCmd.CommandText = BuildDataSql(whereClause, finYear);
                dataCmd.CommandTimeout = 120;
                foreach (var p in parameters)
                    dataCmd.Parameters.Add(CloneParameter(p));
                dataCmd.Parameters.Add(new SqlParameter("@Offset", (page - 1) * pageSize));
                dataCmd.Parameters.Add(new SqlParameter("@PageSize", pageSize));

                using var reader = await dataCmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    entries.Add(MapTrialBalanceEntry(reader));
                }
            }

            return (entries, totalCount);
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    public async Task<List<(string SortDesc, int Count, decimal OpenBal, decimal Debit, decimal Credit, decimal CloseBal, decimal BudgetOrig, decimal BudgetAdj)>> GetSummaryAsync(string? finYear = null)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            var finYearFilter = string.IsNullOrEmpty(finYear)
                ? "WHERE v.ControlVote IN (0, 1)"
                : "WHERE v.ControlVote IN (0, 1) AND v.FinYear = @FinYear";
            var glFilter = string.IsNullOrEmpty(finYear) ? "" : "WHERE gl.FinYear = @FinYear";

            var sql = $@"
;WITH ScoaHierarchy AS (
    SELECT
        s.ScoaID,
        s.ScoaCode,
        s.ScoaDesc,
        s.ScoaShortDesc,
        s.LevelID,
        s.ScoaParentID,
        s.PostingLevel,
        s.DebitCreditID,
        s.ScoaID AS LeafScoaID,
        s.ScoaDesc AS LeafDesc,
        CAST(s.ScoaDesc AS NVARCHAR(MAX)) AS FullPath
    FROM [dbo].[Const_SCOA_Structure] s
    WHERE s.ScoaParentID IS NULL OR NOT EXISTS (
        SELECT 1 FROM [dbo].[Const_SCOA_Structure] child WHERE child.ScoaParentID = s.ScoaID
    )

    UNION ALL

    SELECT
        parent.ScoaID,
        parent.ScoaCode,
        parent.ScoaDesc,
        parent.ScoaShortDesc,
        parent.LevelID,
        parent.ScoaParentID,
        parent.PostingLevel,
        parent.DebitCreditID,
        h.LeafScoaID,
        h.LeafDesc,
        CAST(parent.ScoaDesc + ':' + h.FullPath AS NVARCHAR(MAX))
    FROM [dbo].[Const_SCOA_Structure] parent
    INNER JOIN ScoaHierarchy h ON h.ScoaParentID = parent.ScoaID
    WHERE parent.ScoaParentID IS NOT NULL
),
HierFlat AS (
    SELECT
        LeafScoaID AS ScoaID,
        MAX(CASE WHEN LevelID = 1 THEN ScoaDesc END) AS Level1Desc,
        MAX(CASE WHEN LevelID = 2 THEN ScoaDesc END) AS Level2Desc,
        MAX(CASE WHEN LevelID = 3 THEN ScoaDesc END) AS Level3Desc,
        MAX(CASE WHEN LevelID = 4 THEN ScoaDesc END) AS Level4Desc,
        MAX(CASE WHEN LevelID = 5 THEN ScoaDesc END) AS Level5Desc,
        MAX(CASE WHEN LevelID = 6 THEN ScoaDesc END) AS Level6Desc,
        MAX(CASE WHEN LevelID = 7 THEN ScoaDesc END) AS Level7Desc
    FROM ScoaHierarchy
    GROUP BY LeafScoaID
),
GlAgg AS (
    SELECT gl.VoteID,
           ISNULL(SUM(gl.Debit), 0) AS TotalDebit,
           ISNULL(SUM(gl.Credit), 0) AS TotalCredit,
           ISNULL(SUM(gl.Balance), 0) AS TotalBalance
    FROM [dbo].[Led_GeneralLedger] gl
    {glFilter}
    GROUP BY gl.VoteID
),
BudgetAdj AS (
    SELECT ba.VoteID,
           ISNULL(SUM(CASE WHEN ba.BudgetAdjustmentApproved = 1 THEN ba.BudgetAdjustmentTotal ELSE 0 END), 0) AS AdjTotal
    FROM [dbo].[Led_VoteBudgetAdjustment_Header] ba
    GROUP BY ba.VoteID
)
SELECT
    ISNULL(hier.Level1Desc, CASE
        WHEN LEFT(scoa.ScoaCode, 2) = 'IA' THEN 'Assets'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IL' THEN 'Liabilities'
        WHEN LEFT(scoa.ScoaCode, 2) = 'LN' THEN 'Net Assets'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IE' THEN 'Expenditure'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IR' THEN 'Revenue'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IZ' THEN 'Gains and Losses'
        ELSE 'Unclassified'
    END) AS SortDesc,
    COUNT(*) AS EntryCount,
    SUM(ISNULL(ob.OpeningBalanceAmt, 0)) AS TotalOpeningBalance,
    SUM(ISNULL(ga.TotalDebit, 0)) AS TotalDebit,
    SUM(ISNULL(ga.TotalCredit, 0)) AS TotalCredit,
    SUM(ISNULL(ob.OpeningBalanceAmt, 0) + ISNULL(ga.TotalBalance, 0)) AS TotalClosingBalance,
    SUM(CAST(ISNULL(bo.BudgetTotal, 0) AS DECIMAL(18,2))) AS TotalBudgetOriginal,
    SUM(CAST(ISNULL(bo.BudgetTotal, 0) AS DECIMAL(18,2)) + CAST(ISNULL(ba.AdjTotal, 0) AS DECIMAL(18,2))) AS TotalBudgetAdjusted
FROM [dbo].[Led_Vote] v
LEFT JOIN [dbo].[Const_SCOA_Structure] scoa ON v.SCOAItemID = scoa.ScoaID
LEFT JOIN HierFlat hier ON scoa.ScoaID = hier.ScoaID
LEFT JOIN [dbo].[Led_Vote_OpeningBalance] ob ON v.Vote_ID = ob.VoteID AND v.FinYear = ob.FinYear
LEFT JOIN GlAgg ga ON v.Vote_ID = ga.VoteID
LEFT JOIN [dbo].[Led_VoteBudgetOriginal_Header] bo ON v.Vote_ID = bo.VoteID
LEFT JOIN BudgetAdj ba ON v.Vote_ID = ba.VoteID
{finYearFilter}
GROUP BY ISNULL(hier.Level1Desc, CASE
    WHEN LEFT(scoa.ScoaCode, 2) = 'IA' THEN 'Assets'
    WHEN LEFT(scoa.ScoaCode, 2) = 'IL' THEN 'Liabilities'
    WHEN LEFT(scoa.ScoaCode, 2) = 'LN' THEN 'Net Assets'
    WHEN LEFT(scoa.ScoaCode, 2) = 'IE' THEN 'Expenditure'
    WHEN LEFT(scoa.ScoaCode, 2) = 'IR' THEN 'Revenue'
    WHEN LEFT(scoa.ScoaCode, 2) = 'IZ' THEN 'Gains and Losses'
    ELSE 'Unclassified'
END)
ORDER BY SortDesc";

            using var cmd = connection.CreateCommand();
            cmd.CommandText = sql;
            cmd.CommandTimeout = 120;

            if (!string.IsNullOrEmpty(finYear))
                cmd.Parameters.Add(new SqlParameter("@FinYear", finYear));

            var results = new List<(string, int, decimal, decimal, decimal, decimal, decimal, decimal)>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add((
                    Convert.ToString(reader.GetValue(0)) ?? "Unclassified",
                    Convert.ToInt32(reader.GetValue(1)),
                    Convert.ToDecimal(reader.GetValue(2)),
                    Convert.ToDecimal(reader.GetValue(3)),
                    Convert.ToDecimal(reader.GetValue(4)),
                    Convert.ToDecimal(reader.GetValue(5)),
                    Convert.ToDecimal(reader.GetValue(6)),
                    Convert.ToDecimal(reader.GetValue(7))
                ));
            }
            return results;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    private static string BuildCountSql(string whereClause)
    {
        return $@"
;WITH ScoaAncestors AS (
    SELECT ScoaID, ScoaDesc, LevelID, ScoaParentID, ScoaID AS LeafScoaID
    FROM [dbo].[Const_SCOA_Structure]

    UNION ALL

    SELECT parent.ScoaID, parent.ScoaDesc, parent.LevelID, parent.ScoaParentID, sa.LeafScoaID
    FROM [dbo].[Const_SCOA_Structure] parent
    INNER JOIN ScoaAncestors sa ON sa.ScoaParentID = parent.ScoaID
    WHERE parent.ScoaParentID IS NOT NULL
),
HierCount AS (
    SELECT LeafScoaID AS ScoaID,
           MAX(CASE WHEN LevelID = 1 THEN ScoaDesc END) AS Level1Desc
    FROM ScoaAncestors
    GROUP BY LeafScoaID
)
SELECT COUNT(*)
FROM [dbo].[Led_Vote] v
LEFT JOIN [dbo].[Const_SCOA_Structure] scoa ON v.SCOAItemID = scoa.ScoaID
LEFT JOIN HierCount hier ON scoa.ScoaID = hier.ScoaID
{whereClause}";
    }

    private static string BuildDataSql(string whereClause, string? finYear)
    {
        var glFinYearFilter = string.IsNullOrEmpty(finYear) ? "" : "WHERE gl.FinYear = @FinYear";

        return $@"
;WITH ScoaHierarchy AS (
    SELECT
        s.ScoaID,
        s.ScoaDesc,
        s.LevelID,
        s.ScoaParentID,
        s.ScoaID AS LeafScoaID
    FROM [dbo].[Const_SCOA_Structure] s

    UNION ALL

    SELECT
        parent.ScoaID,
        parent.ScoaDesc,
        parent.LevelID,
        parent.ScoaParentID,
        h.LeafScoaID
    FROM [dbo].[Const_SCOA_Structure] parent
    INNER JOIN ScoaHierarchy h ON h.ScoaParentID = parent.ScoaID
    WHERE parent.ScoaParentID IS NOT NULL
),
HierFlat AS (
    SELECT
        LeafScoaID AS ScoaID,
        MAX(CASE WHEN LevelID = 1 THEN ScoaDesc END) AS Level1Desc,
        MAX(CASE WHEN LevelID = 2 THEN ScoaDesc END) AS Level2Desc,
        MAX(CASE WHEN LevelID = 3 THEN ScoaDesc END) AS Level3Desc,
        MAX(CASE WHEN LevelID = 4 THEN ScoaDesc END) AS Level4Desc,
        MAX(CASE WHEN LevelID = 5 THEN ScoaDesc END) AS Level5Desc,
        MAX(CASE WHEN LevelID = 6 THEN ScoaDesc END) AS Level6Desc,
        MAX(CASE WHEN LevelID = 7 THEN ScoaDesc END) AS Level7Desc
    FROM ScoaHierarchy
    GROUP BY LeafScoaID
),
GlAgg AS (
    SELECT gl.VoteID,
           ISNULL(SUM(gl.Debit), 0) AS TotalDebit,
           ISNULL(SUM(gl.Credit), 0) AS TotalCredit,
           ISNULL(SUM(gl.Balance), 0) AS TotalBalance
    FROM [dbo].[Led_GeneralLedger] gl
    {glFinYearFilter}
    GROUP BY gl.VoteID
),
BudgetAdj AS (
    SELECT ba.VoteID,
           ISNULL(SUM(CASE WHEN ba.BudgetAdjustmentApproved = 1 THEN ba.BudgetAdjustmentTotal ELSE 0 END), 0) AS AdjTotal
    FROM [dbo].[Led_VoteBudgetAdjustment_Header] ba
    GROUP BY ba.VoteID
),
VoteSegments AS (
    SELECT
        gl.VoteID,
        MAX(gl.SCOAFundsID) AS SCOAFundsID,
        MAX(gl.SCOAFunctionID) AS SCOAFunctionID,
        MAX(gl.SCOAProjectID) AS SCOAProjectID,
        MAX(gl.SCOACostingID) AS SCOACostingID,
        MAX(gl.SCOARegionID) AS SCOARegionID,
        MAX(gl.DivisionID) AS DivisionID,
        MAX(gl.ProjectID) AS ProjectID
    FROM [dbo].[Led_GeneralLedger] gl
    {glFinYearFilter}
    GROUP BY gl.VoteID
),
PY1 AS (
    SELECT v2.Vote_ID,
           ISNULL(ob2.OpeningBalanceAmt, 0) + ISNULL(ga2.TotalBalance, 0) AS Balance
    FROM [dbo].[Led_Vote] v2
    LEFT JOIN [dbo].[Led_Vote_OpeningBalance] ob2 ON v2.Vote_ID = ob2.VoteID AND v2.FinYear = ob2.FinYear
    LEFT JOIN (
        SELECT gl.VoteID, ISNULL(SUM(gl.Balance), 0) AS TotalBalance
        FROM [dbo].[Led_GeneralLedger] gl WHERE gl.FinYear = @PriorYear1
        GROUP BY gl.VoteID
    ) ga2 ON v2.Vote_ID = ga2.VoteID
    WHERE v2.FinYear = @PriorYear1 AND v2.ControlVote IN (0, 1)
),
PY2 AS (
    SELECT v3.Vote_ID,
           ISNULL(ob3.OpeningBalanceAmt, 0) + ISNULL(ga3.TotalBalance, 0) AS Balance
    FROM [dbo].[Led_Vote] v3
    LEFT JOIN [dbo].[Led_Vote_OpeningBalance] ob3 ON v3.Vote_ID = ob3.VoteID AND v3.FinYear = ob3.FinYear
    LEFT JOIN (
        SELECT gl.VoteID, ISNULL(SUM(gl.Balance), 0) AS TotalBalance
        FROM [dbo].[Led_GeneralLedger] gl WHERE gl.FinYear = @PriorYear2
        GROUP BY gl.VoteID
    ) ga3 ON v3.Vote_ID = ga3.VoteID
    WHERE v3.FinYear = @PriorYear2 AND v3.ControlVote IN (0, 1)
),
PY3 AS (
    SELECT v4.Vote_ID,
           ISNULL(ob4.OpeningBalanceAmt, 0) + ISNULL(ga4.TotalBalance, 0) AS Balance
    FROM [dbo].[Led_Vote] v4
    LEFT JOIN [dbo].[Led_Vote_OpeningBalance] ob4 ON v4.Vote_ID = ob4.VoteID AND v4.FinYear = ob4.FinYear
    LEFT JOIN (
        SELECT gl.VoteID, ISNULL(SUM(gl.Balance), 0) AS TotalBalance
        FROM [dbo].[Led_GeneralLedger] gl WHERE gl.FinYear = @PriorYear3
        GROUP BY gl.VoteID
    ) ga4 ON v4.Vote_ID = ga4.VoteID
    WHERE v4.FinYear = @PriorYear3 AND v4.ControlVote IN (0, 1)
)
SELECT
    v.Vote_ID AS VoteID,
    v.Vote AS VoteNumber,
    v.VoteDesc AS VoteDescription,
    v.FinYear,
    v.SCOAItemID,
    scoa.ScoaCode AS ScoaItemCode,
    scoa.ScoaShortDesc AS ScoaItemShortDesc,
    scoa.ScoaDesc AS ScoaItemDescription,
    scoa.LevelID AS ScoaItemLevelID,
    scoa.ScoaParentID,
    scoa.PostingLevel,
    parentScoa.PostingLevel AS PostingLevelParent,
    scoa.DebitCreditID,
    ISNULL(hier.Level1Desc, CASE
        WHEN LEFT(scoa.ScoaCode, 2) = 'IA' THEN 'Assets'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IL' THEN 'Liabilities'
        WHEN LEFT(scoa.ScoaCode, 2) = 'LN' THEN 'Net Assets'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IE' THEN 'Expenditure'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IR' THEN 'Revenue'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IZ' THEN 'Gains and Losses'
        ELSE 'Unclassified'
    END) AS Level1,
    hier.Level2Desc AS Level2,
    hier.Level3Desc AS Level3,
    hier.Level4Desc AS Level4,
    hier.Level5Desc AS Level5,
    hier.Level6Desc AS Level6,
    hier.Level7Desc AS Level7,
    CAST(p.ProjectCode AS NVARCHAR(20)) AS ProjectCode,
    funds.ScoaCode AS ScoaFundsCode,
    funds.ScoaDesc AS ScoaFundsDescription,
    func.ScoaCode AS ScoaFunctionCode,
    func.ScoaDesc AS ScoaFunctionDescription,
    proj.ScoaCode AS ScoaProjectCode,
    proj.ScoaDesc AS ScoaProjectDescription,
    cost.ScoaCode AS ScoaCostingCode,
    cost.ScoaDesc AS ScoaCostingDescription,
    reg.ScoaCode AS ScoaRegionCode,
    reg.ScoaDesc AS ScoaRegionDescription,
    mcdiv.DivisionCode AS ScoaMunicipalClassificationCode,
    mcdiv.DivisionDesc AS ScoaMunicipalClassificationDescription,
    ISNULL(hier.Level1Desc, CASE
        WHEN LEFT(scoa.ScoaCode, 2) = 'IA' THEN 'Assets'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IL' THEN 'Liabilities'
        WHEN LEFT(scoa.ScoaCode, 2) = 'LN' THEN 'Net Assets'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IE' THEN 'Expenditure'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IR' THEN 'Revenue'
        WHEN LEFT(scoa.ScoaCode, 2) = 'IZ' THEN 'Gains and Losses'
        ELSE 'Unclassified'
    END) AS SortDesc,
    CAST(ISNULL(bo.BudgetTotal, 0) AS DECIMAL(18,2)) AS BudgetOriginal,
    CAST(ISNULL(bo.BudgetTotal, 0) AS DECIMAL(18,2)) + CAST(ISNULL(ba.AdjTotal, 0) AS DECIMAL(18,2)) AS BudgetAdjusted,
    ISNULL(ob.OpeningBalanceAmt, 0) AS OpeningBalance,
    ISNULL(ga.TotalDebit, 0) AS TotalDebit,
    ISNULL(ga.TotalCredit, 0) AS TotalCredit,
    ISNULL(ob.OpeningBalanceAmt, 0) + ISNULL(ga.TotalBalance, 0) AS ClosingBalance,
    CASE WHEN (ISNULL(ob.OpeningBalanceAmt, 0) + ISNULL(ga.TotalBalance, 0)) > 0
         THEN ISNULL(ob.OpeningBalanceAmt, 0) + ISNULL(ga.TotalBalance, 0) ELSE 0 END AS DebitCloseBalance,
    CASE WHEN (ISNULL(ob.OpeningBalanceAmt, 0) + ISNULL(ga.TotalBalance, 0)) < 0
         THEN ABS(ISNULL(ob.OpeningBalanceAmt, 0) + ISNULL(ga.TotalBalance, 0)) ELSE 0 END AS CreditCloseBalance,
    ISNULL(py1.Balance, 0) AS PriorYear1Balance,
    ISNULL(py2.Balance, 0) AS PriorYear2Balance,
    ISNULL(py3.Balance, 0) AS PriorYear3Balance
FROM [dbo].[Led_Vote] v
LEFT JOIN [dbo].[Const_SCOA_Structure] scoa ON v.SCOAItemID = scoa.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Structure] parentScoa ON scoa.ScoaParentID = parentScoa.ScoaID
LEFT JOIN HierFlat hier ON scoa.ScoaID = hier.ScoaID
LEFT JOIN [dbo].[Led_Vote_OpeningBalance] ob ON v.Vote_ID = ob.VoteID AND v.FinYear = ob.FinYear
LEFT JOIN GlAgg ga ON v.Vote_ID = ga.VoteID
LEFT JOIN VoteSegments vs ON v.Vote_ID = vs.VoteID
LEFT JOIN [dbo].[Led_VoteBudgetOriginal_Header] bo ON v.Vote_ID = bo.VoteID
LEFT JOIN BudgetAdj ba ON v.Vote_ID = ba.VoteID
LEFT JOIN PY1 py1 ON v.Vote_ID = py1.Vote_ID
LEFT JOIN PY2 py2 ON v.Vote_ID = py2.Vote_ID
LEFT JOIN PY3 py3 ON v.Vote_ID = py3.Vote_ID
LEFT JOIN [dbo].[Const_SCOA_Funds_Structure] funds ON vs.SCOAFundsID = funds.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Function_Structure] func ON vs.SCOAFunctionID = func.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Project_Structure] proj ON vs.SCOAProjectID = proj.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Costing_Structure] cost ON vs.SCOACostingID = cost.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Regional_Structure] reg ON vs.SCOARegionID = reg.ScoaID
LEFT JOIN [dbo].[Const_Division] mcdiv ON vs.DivisionID = mcdiv.Division_ID
LEFT JOIN [dbo].[Plan_Project] p ON vs.ProjectID = p.Project_ID
{whereClause}
ORDER BY ISNULL(hier.Level1Desc, CASE
    WHEN LEFT(scoa.ScoaCode, 2) = 'IA' THEN 'Assets'
    WHEN LEFT(scoa.ScoaCode, 2) = 'IL' THEN 'Liabilities'
    WHEN LEFT(scoa.ScoaCode, 2) = 'LN' THEN 'Net Assets'
    WHEN LEFT(scoa.ScoaCode, 2) = 'IE' THEN 'Expenditure'
    WHEN LEFT(scoa.ScoaCode, 2) = 'IR' THEN 'Revenue'
    WHEN LEFT(scoa.ScoaCode, 2) = 'IZ' THEN 'Gains and Losses'
    ELSE 'Unclassified'
END), scoa.ScoaCode
OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";
    }

    private static TrialBalanceEntry MapTrialBalanceEntry(IDataReader reader)
    {
        return new TrialBalanceEntry
        {
            VoteID = reader.IsDBNull(reader.GetOrdinal("VoteID")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("VoteID"))),
            VoteNumber = reader.IsDBNull(reader.GetOrdinal("VoteNumber")) ? "" : Convert.ToString(reader.GetValue(reader.GetOrdinal("VoteNumber"))) ?? "",
            VoteDescription = GetNullableString(reader, "VoteDescription"),
            FinYear = reader.IsDBNull(reader.GetOrdinal("FinYear")) ? "" : Convert.ToString(reader.GetValue(reader.GetOrdinal("FinYear"))) ?? "",
            SCOAItemID = GetNullableInt(reader, "SCOAItemID"),
            ScoaItemCode = GetNullableString(reader, "ScoaItemCode"),
            ScoaItemShortDesc = GetNullableString(reader, "ScoaItemShortDesc"),
            ScoaItemDescription = GetNullableString(reader, "ScoaItemDescription"),
            ScoaItemLevelID = GetNullableInt(reader, "ScoaItemLevelID"),
            ScoaParentID = GetNullableInt(reader, "ScoaParentID"),
            PostingLevel = GetNullableString(reader, "PostingLevel"),
            PostingLevelParent = GetNullableString(reader, "PostingLevelParent"),
            DebitCreditID = GetNullableInt(reader, "DebitCreditID"),
            Level1 = GetNullableString(reader, "Level1"),
            Level2 = GetNullableString(reader, "Level2"),
            Level3 = GetNullableString(reader, "Level3"),
            Level4 = GetNullableString(reader, "Level4"),
            Level5 = GetNullableString(reader, "Level5"),
            Level6 = GetNullableString(reader, "Level6"),
            Level7 = GetNullableString(reader, "Level7"),
            ProjectCode = GetNullableString(reader, "ProjectCode"),
            ScoaFundsCode = GetNullableString(reader, "ScoaFundsCode"),
            ScoaFundsDescription = GetNullableString(reader, "ScoaFundsDescription"),
            ScoaFunctionCode = GetNullableString(reader, "ScoaFunctionCode"),
            ScoaFunctionDescription = GetNullableString(reader, "ScoaFunctionDescription"),
            ScoaProjectCode = GetNullableString(reader, "ScoaProjectCode"),
            ScoaProjectDescription = GetNullableString(reader, "ScoaProjectDescription"),
            ScoaCostingCode = GetNullableString(reader, "ScoaCostingCode"),
            ScoaCostingDescription = GetNullableString(reader, "ScoaCostingDescription"),
            ScoaRegionCode = GetNullableString(reader, "ScoaRegionCode"),
            ScoaRegionDescription = GetNullableString(reader, "ScoaRegionDescription"),
            ScoaMunicipalClassificationCode = GetNullableString(reader, "ScoaMunicipalClassificationCode"),
            ScoaMunicipalClassificationDescription = GetNullableString(reader, "ScoaMunicipalClassificationDescription"),
            SortDesc = GetNullableString(reader, "SortDesc"),
            BudgetOriginal = SafeDecimal(reader, "BudgetOriginal"),
            BudgetAdjusted = SafeDecimal(reader, "BudgetAdjusted"),
            OpeningBalance = SafeDecimal(reader, "OpeningBalance"),
            TotalDebit = SafeDecimal(reader, "TotalDebit"),
            TotalCredit = SafeDecimal(reader, "TotalCredit"),
            ClosingBalance = SafeDecimal(reader, "ClosingBalance"),
            DebitCloseBalance = SafeDecimal(reader, "DebitCloseBalance"),
            CreditCloseBalance = SafeDecimal(reader, "CreditCloseBalance"),
            PriorYear1Balance = SafeDecimal(reader, "PriorYear1Balance"),
            PriorYear2Balance = SafeDecimal(reader, "PriorYear2Balance"),
            PriorYear3Balance = SafeDecimal(reader, "PriorYear3Balance")
        };
    }

    private static string? GetNullableString(IDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        if (reader.IsDBNull(ordinal)) return null;
        var val = reader.GetValue(ordinal);
        return Convert.ToString(val);
    }

    private static int? GetNullableInt(IDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        if (reader.IsDBNull(ordinal)) return null;
        var val = reader.GetValue(ordinal);
        return Convert.ToInt32(val);
    }

    private static decimal SafeDecimal(IDataReader reader, string col)
    {
        var ord = reader.GetOrdinal(col);
        if (reader.IsDBNull(ord)) return 0m;
        var val = reader.GetValue(ord);
        return Convert.ToDecimal(val);
    }

    private static string[] ComputePriorYears(string finYear)
    {
        var parts = finYear.Split('/');
        if (parts.Length == 2 && int.TryParse(parts[0], out var startYear))
        {
            return new[]
            {
                $"{startYear - 1}/{startYear}",
                $"{startYear - 2}/{startYear - 1}",
                $"{startYear - 3}/{startYear - 2}"
            };
        }

        if (int.TryParse(finYear, out var year))
        {
            return new[]
            {
                (year - 1).ToString(),
                (year - 2).ToString(),
                (year - 3).ToString()
            };
        }

        return Array.Empty<string>();
    }

    private static SqlParameter CloneParameter(SqlParameter source)
    {
        return new SqlParameter(source.ParameterName, source.SqlDbType, source.Size)
        {
            Value = source.Value ?? DBNull.Value,
            Direction = source.Direction
        };
    }
}
