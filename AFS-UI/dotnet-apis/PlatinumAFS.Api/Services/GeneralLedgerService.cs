using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using PlatinumAFS.Api.Data;
using PlatinumAFS.Api.Models;

namespace PlatinumAFS.Api.Services;

public class GeneralLedgerService
{
    private readonly PlatinumDbContext _context;

    public GeneralLedgerService(PlatinumDbContext context)
    {
        _context = context;
    }

    private const string BaseSql = @"
;WITH CorePage AS (
    SELECT
        gl.GenLedger_ID,
        gl.PostingDate,
        gl.ProcessingMonth,
        gl.FinYear,
        gl.TransactionTypeID,
        gl.TransactionDetails,
        gl.DocumentNumber,
        gl.Debit,
        gl.Credit,
        gl.Balance,
        gl.DateCaptured,
        gl.CapturerID,
        gl.DivisionID,
        gl.ProjectID,
        gl.PlanProjectItemID,
        gl.VoteID,
        gl.SCOAItemID,
        gl.SCOAFundsID,
        gl.SCOAFunctionID,
        gl.SCOAProjectID,
        gl.SCOACostingID,
        gl.SCOARegionID,
        gl.VATRate,
        gl.MatchTranGuid,
        gl.CashbookTransactionID,
        gl.MultipleJournalID
    FROM [dbo].[Led_GeneralLedger] gl
    {FILTER_PLACEHOLDER}
    ORDER BY gl.PostingDate DESC, gl.DocumentNumber
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
)
SELECT
    cp.GenLedger_ID AS GenLedgerId,
    cp.PostingDate,
    cp.ProcessingMonth,
    cp.FinYear,
    cp.TransactionTypeID,
    tt.TransactionTypeDesc AS TransactionType,
    cp.TransactionDetails,
    cp.DocumentNumber,
    dt.DocumentTypeDesc AS DocumentType,
    cp.Debit,
    cp.Credit,
    cp.Balance,
    cp.DateCaptured,
    cp.CapturerID,
    cap.UserName AS CapturedBy,
    cp.DivisionID,
    dept.DepartmentDesc AS Department,
    div.DivisionDesc AS Division,
    cp.ProjectID,
    CAST(p.ProjectCode AS NVARCHAR(20)) AS ProjectCode,
    p.ProjectDesc AS ProjectDescription,
    cp.PlanProjectItemID,
    CAST(cp.VoteID AS NVARCHAR(20)) + '|' + ISNULL(CAST(cp.SCOAItemID AS NVARCHAR(20)), '') AS UKey,
    CASE
        WHEN item.ScoaDesc LIKE 'Assets%' THEN 'IA'
        WHEN item.ScoaDesc LIKE 'Liabilities%' THEN 'IL'
        WHEN item.ScoaDesc LIKE 'Net Assets%' OR item.ScoaDesc LIKE 'Community Wealth%' THEN 'LN'
        WHEN item.ScoaDesc LIKE 'Revenue%' THEN 'IR'
        WHEN item.ScoaDesc LIKE 'Expenditure%' THEN 'IE'
        WHEN item.ScoaDesc LIKE 'Gains%' OR item.ScoaDesc LIKE 'Losses%' OR item.ScoaDesc LIKE 'Surplus%' OR item.ScoaDesc LIKE 'Deficit%' THEN 'IZ'
        ELSE ''
    END AS ItemType,
    CAST(NULL AS NVARCHAR(235)) AS OrderDescription,
    cp.VATRate,
    CASE WHEN cp.VATRate IS NOT NULL AND cp.VATRate > 0 THEN 'Y' ELSE 'N' END AS VATIndicator,
    cp.MatchTranGuid,
    CASE
        WHEN cp.CashbookTransactionID IS NOT NULL THEN lcv.ReferenceNumber
        WHEN cp.MultipleJournalID IS NOT NULL THEN jm.ReferenceNumber
        ELSE NULL
    END AS ReferenceNumber,
    CAST(NULL AS NVARCHAR(50)) AS SupplierNo,
    CAST(NULL AS NVARCHAR(200)) AS SupplierName,
    CAST(NULL AS NVARCHAR(50)) AS OrderNumber,
    CAST(NULL AS NVARCHAR(50)) AS OrderLine,
    CAST(NULL AS NVARCHAR(50)) AS VendorInvoiceNumber,
    CAST(NULL AS NVARCHAR(50)) AS PaymentDocumentNumber,
    cp.VoteID,
    v.Vote AS VoteNumber,
    v.VoteDesc AS VoteDescription,
    v.Vote AS AccountNo,
    cp.SCOAItemID,
    item.ScoaCode AS ScoaItemCode,
    item.ScoaShortDesc AS ScoaItemShortDesc,
    item.ScoaDesc AS ScoaItemDescription,
    cp.SCOAFundsID,
    funds.ScoaCode AS ScoaFundsCode,
    funds.ScoaShortDesc AS ScoaFundsShortDesc,
    funds.ScoaDesc AS ScoaFundsDescription,
    cp.SCOAFunctionID,
    func.ScoaCode AS ScoaFunctionCode,
    func.ScoaShortDesc AS ScoaFunctionShortDesc,
    func.ScoaDesc AS ScoaFunctionDescription,
    cp.SCOAProjectID,
    proj.ScoaCode AS ScoaProjectCode,
    proj.ScoaShortDesc AS ScoaProjectShortDesc,
    proj.ScoaDesc AS ScoaProjectDescription,
    cp.SCOACostingID,
    cost.ScoaCode AS ScoaCostingCode,
    cost.ScoaShortDesc AS ScoaCostingShortDesc,
    cost.ScoaDesc AS ScoaCostingDescription,
    cp.SCOARegionID,
    reg.ScoaCode AS ScoaRegionCode,
    reg.ScoaShortDesc AS ScoaRegionShortDesc,
    reg.ScoaDesc AS ScoaRegionDescription
FROM CorePage cp
LEFT JOIN [dbo].[Led_Vote] v ON cp.VoteID = v.Vote_ID
LEFT JOIN [dbo].[Const_SCOA_Structure] item ON cp.SCOAItemID = item.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Funds_Structure] funds ON cp.SCOAFundsID = funds.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Function_Structure] func ON cp.SCOAFunctionID = func.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Project_Structure] proj ON cp.SCOAProjectID = proj.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Costing_Structure] cost ON cp.SCOACostingID = cost.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Regional_Structure] reg ON cp.SCOARegionID = reg.ScoaID
LEFT JOIN [dbo].[Const_TransactionType] tt ON cp.TransactionTypeID = tt.TransactionType_ID
OUTER APPLY (SELECT TOP 1 d.DocumentTypeDesc FROM [dbo].[Const_DocumentType] d WHERE CHARINDEX('/', cp.DocumentNumber) > 0 AND d.DocumentType_ID = TRY_CAST(LEFT(cp.DocumentNumber, CHARINDEX('/', cp.DocumentNumber) - 1) AS INT)) dt
LEFT JOIN [dbo].[User_UserDetail] cap ON cp.CapturerID = cap.User_ID
LEFT JOIN [dbo].[Const_Division] div ON cp.DivisionID = div.Division_ID
LEFT JOIN [dbo].[Const_Department] dept ON div.DepartmentID = dept.Department_ID
LEFT JOIN [dbo].[Plan_Project] p ON cp.ProjectID = p.Project_ID
OUTER APPLY (SELECT TOP 1 r.ReferenceNumber FROM [dbo].[Led_CashbookVote] r WHERE r.CashbookTransactionID = cp.CashbookTransactionID AND cp.CashbookTransactionID IS NOT NULL) lcv
OUTER APPLY (SELECT TOP 1 r.ReferenceNumber FROM [dbo].[Led_Journal_Multiple] r WHERE r.MultipleJournal_ID = cp.MultipleJournalID AND cp.MultipleJournalID IS NOT NULL) jm
ORDER BY cp.PostingDate DESC, cp.DocumentNumber";

    public async Task<List<string>> GetAvailableFinancialYearsAsync()
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();
        try
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT DISTINCT FinYear FROM [dbo].[Led_GeneralLedger] ORDER BY FinYear DESC";
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

    public async Task<(List<GeneralLedgerEntry> Entries, int TotalCount)> GetEntriesAsync(
        string? finYear = null,
        int? processingMonth = null,
        string? documentNumber = null,
        int? voteId = null,
        string? scoaItemCode = null,
        string? accountNo = null,
        int page = 1,
        int pageSize = 100)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            var whereConditions = new List<string>();
            var countWhereConditions = new List<string>();
            var parameters = new List<SqlParameter>();
            var needsVoteJoinForCount = false;
            var needsScoaJoinForCount = false;

            if (!string.IsNullOrEmpty(finYear))
            {
                whereConditions.Add("gl.FinYear = @FinYear");
                countWhereConditions.Add("gl.FinYear = @FinYear");
                parameters.Add(new SqlParameter("@FinYear", finYear));
            }
            if (processingMonth.HasValue)
            {
                whereConditions.Add("gl.ProcessingMonth = @ProcessingMonth");
                countWhereConditions.Add("gl.ProcessingMonth = @ProcessingMonth");
                parameters.Add(new SqlParameter("@ProcessingMonth", processingMonth.Value));
            }
            if (!string.IsNullOrEmpty(accountNo))
            {
                whereConditions.Add("gl.VoteID IN (SELECT Vote_ID FROM [dbo].[Led_Vote] WHERE Vote = @AccountNo)");
                countWhereConditions.Add("gl.VoteID IN (SELECT Vote_ID FROM [dbo].[Led_Vote] WHERE Vote = @AccountNo)");
                parameters.Add(new SqlParameter("@AccountNo", accountNo));
            }
            if (!string.IsNullOrEmpty(documentNumber))
            {
                whereConditions.Add("gl.DocumentNumber = @DocumentNumber");
                countWhereConditions.Add("gl.DocumentNumber = @DocumentNumber");
                parameters.Add(new SqlParameter("@DocumentNumber", documentNumber));
            }
            if (voteId.HasValue)
            {
                whereConditions.Add("gl.VoteID = @VoteId");
                countWhereConditions.Add("gl.VoteID = @VoteId");
                parameters.Add(new SqlParameter("@VoteId", voteId.Value));
            }
            if (!string.IsNullOrEmpty(scoaItemCode))
            {
                whereConditions.Add("gl.SCOAItemID IN (SELECT ScoaID FROM [dbo].[Const_SCOA_Structure] WHERE ScoaCode = @ScoaItemCode)");
                countWhereConditions.Add("gl.SCOAItemID IN (SELECT ScoaID FROM [dbo].[Const_SCOA_Structure] WHERE ScoaCode = @ScoaItemCode)");
                parameters.Add(new SqlParameter("@ScoaItemCode", scoaItemCode));
            }

            var whereClause = whereConditions.Count > 0
                ? "WHERE " + string.Join(" AND ", whereConditions)
                : "";
            var countWhereClause = countWhereConditions.Count > 0
                ? "WHERE " + string.Join(" AND ", countWhereConditions)
                : "";

            int totalCount;
            using (var countCmd = connection.CreateCommand())
            {
                countCmd.CommandText = $"SELECT COUNT(*) FROM [dbo].[Led_GeneralLedger] gl {countWhereClause}";
                countCmd.CommandTimeout = 60;
                foreach (var p in parameters)
                    countCmd.Parameters.Add(CloneParameter(p));
                totalCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync());
            }

            var entries = new List<GeneralLedgerEntry>();
            using (var dataCmd = connection.CreateCommand())
            {
                var sql = BaseSql.Replace("{FILTER_PLACEHOLDER}", whereClause);
                dataCmd.CommandText = sql;
                dataCmd.CommandTimeout = 60;
                foreach (var p in parameters)
                    dataCmd.Parameters.Add(CloneParameter(p));
                dataCmd.Parameters.Add(new SqlParameter("@Offset", (page - 1) * pageSize));
                dataCmd.Parameters.Add(new SqlParameter("@PageSize", pageSize));

                using var reader = await dataCmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                    entries.Add(MapEntry(reader));
            }

            return (entries, totalCount);
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    public async Task<List<(int Month, int Count, decimal Debit, decimal Credit, decimal Balance)>> GetSummaryAsync(string? finYear = null)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            var sql = @"
SELECT
    gl.ProcessingMonth,
    COUNT(*) AS EntryCount,
    ISNULL(SUM(gl.Debit), 0) AS TotalDebit,
    ISNULL(SUM(gl.Credit), 0) AS TotalCredit,
    ISNULL(SUM(gl.Balance), 0) AS TotalBalance
FROM [dbo].[Led_GeneralLedger] gl
" + (string.IsNullOrEmpty(finYear) ? "" : "WHERE gl.FinYear = @FinYear ") + @"
GROUP BY gl.ProcessingMonth
ORDER BY gl.ProcessingMonth";

            using var cmd = connection.CreateCommand();
            cmd.CommandText = sql;
            cmd.CommandTimeout = 60;
            if (!string.IsNullOrEmpty(finYear))
                cmd.Parameters.Add(new SqlParameter("@FinYear", finYear));

            var results = new List<(int, int, decimal, decimal, decimal)>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add((
                    Convert.ToInt32(reader.GetValue(0)),
                    Convert.ToInt32(reader.GetValue(1)),
                    Convert.ToDecimal(reader.GetValue(2)),
                    Convert.ToDecimal(reader.GetValue(3)),
                    Convert.ToDecimal(reader.GetValue(4))
                ));
            }
            return results;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    private static GeneralLedgerEntry MapEntry(IDataReader reader)
    {
        var entry = new GeneralLedgerEntry
        {
            GenLedgerId = reader.IsDBNull(reader.GetOrdinal("GenLedgerId")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("GenLedgerId"))),
            PostingDate = reader.IsDBNull(reader.GetOrdinal("PostingDate")) ? DateTime.MinValue : Convert.ToDateTime(reader.GetValue(reader.GetOrdinal("PostingDate"))),
            ProcessingMonth = reader.IsDBNull(reader.GetOrdinal("ProcessingMonth")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("ProcessingMonth"))),
            FinYear = reader.IsDBNull(reader.GetOrdinal("FinYear")) ? "" : Convert.ToString(reader.GetValue(reader.GetOrdinal("FinYear"))) ?? "",
            TransactionTypeID = GetNullableInt(reader, "TransactionTypeID"),
            TransactionType = GetNullableString(reader, "TransactionType"),
            TransactionDetails = GetNullableString(reader, "TransactionDetails"),
            DocumentNumber = GetNullableString(reader, "DocumentNumber"),
            DocumentType = GetNullableString(reader, "DocumentType"),
            Debit = GetNullableDecimal(reader, "Debit"),
            Credit = GetNullableDecimal(reader, "Credit"),
            Balance = GetNullableDecimal(reader, "Balance"),
            DateCaptured = GetNullableDateTime(reader, "DateCaptured"),
            CapturerID = GetNullableInt(reader, "CapturerID"),
            CapturedBy = GetNullableString(reader, "CapturedBy"),
            DivisionID = GetNullableInt(reader, "DivisionID"),
            Department = GetNullableString(reader, "Department"),
            Division = GetNullableString(reader, "Division"),
            ProjectID = GetNullableInt(reader, "ProjectID"),
            ProjectCode = GetNullableString(reader, "ProjectCode"),
            ProjectDescription = GetNullableString(reader, "ProjectDescription"),
            PlanProjectItemID = GetNullableInt(reader, "PlanProjectItemID"),
            UKey = GetNullableString(reader, "UKey"),
            ItemType = GetNullableString(reader, "ItemType"),
            OrderDescription = GetNullableString(reader, "OrderDescription"),
            VATRate = GetNullableDecimal(reader, "VATRate"),
            VATIndicator = GetNullableString(reader, "VATIndicator"),
            MatchTranGuid = GetNullableGuid(reader, "MatchTranGuid"),
            ReferenceNumber = GetNullableString(reader, "ReferenceNumber"),
            SupplierNo = GetNullableString(reader, "SupplierNo"),
            SupplierName = GetNullableString(reader, "SupplierName"),
            OrderNumber = GetNullableString(reader, "OrderNumber"),
            OrderLine = GetNullableString(reader, "OrderLine"),
            VendorInvoiceNumber = GetNullableString(reader, "VendorInvoiceNumber"),
            PaymentDocumentNumber = GetNullableString(reader, "PaymentDocumentNumber"),
            VoteID = GetNullableInt(reader, "VoteID"),
            VoteNumber = GetNullableString(reader, "VoteNumber"),
            VoteDescription = GetNullableString(reader, "VoteDescription"),
            AccountNo = GetNullableString(reader, "AccountNo"),
            SCOAItemID = GetNullableInt(reader, "SCOAItemID"),
            ScoaItemCode = GetNullableString(reader, "ScoaItemCode"),
            ScoaItemShortDesc = GetNullableString(reader, "ScoaItemShortDesc"),
            ScoaItemDescription = GetNullableString(reader, "ScoaItemDescription"),
            SCOAFundsID = GetNullableInt(reader, "SCOAFundsID"),
            ScoaFundsCode = GetNullableString(reader, "ScoaFundsCode"),
            ScoaFundsShortDesc = GetNullableString(reader, "ScoaFundsShortDesc"),
            ScoaFundsDescription = GetNullableString(reader, "ScoaFundsDescription"),
            SCOAFunctionID = GetNullableInt(reader, "SCOAFunctionID"),
            ScoaFunctionCode = GetNullableString(reader, "ScoaFunctionCode"),
            ScoaFunctionShortDesc = GetNullableString(reader, "ScoaFunctionShortDesc"),
            ScoaFunctionDescription = GetNullableString(reader, "ScoaFunctionDescription"),
            SCOAProjectID = GetNullableInt(reader, "SCOAProjectID"),
            ScoaProjectCode = GetNullableString(reader, "ScoaProjectCode"),
            ScoaProjectShortDesc = GetNullableString(reader, "ScoaProjectShortDesc"),
            ScoaProjectDescription = GetNullableString(reader, "ScoaProjectDescription"),
            SCOACostingID = GetNullableInt(reader, "SCOACostingID"),
            ScoaCostingCode = GetNullableString(reader, "ScoaCostingCode"),
            ScoaCostingShortDesc = GetNullableString(reader, "ScoaCostingShortDesc"),
            ScoaCostingDescription = GetNullableString(reader, "ScoaCostingDescription"),
            SCOARegionID = GetNullableInt(reader, "SCOARegionID"),
            ScoaRegionCode = GetNullableString(reader, "ScoaRegionCode"),
            ScoaRegionShortDesc = GetNullableString(reader, "ScoaRegionShortDesc"),
            ScoaRegionDescription = GetNullableString(reader, "ScoaRegionDescription")
        };

        var scoaDesc = entry.ScoaItemDescription;
        if (!string.IsNullOrEmpty(scoaDesc))
        {
            var parts = scoaDesc.Split(':');
            entry.ReportingLevel1 = parts.Length >= 1 ? string.Join(":", parts.Take(1)) : null;
            entry.ReportingLevel2 = parts.Length >= 2 ? string.Join(":", parts.Take(2)) : null;
            entry.ReportingLevel3 = parts.Length >= 3 ? string.Join(":", parts.Take(3)) : null;
            entry.ReportingLevel4 = parts.Length >= 4 ? string.Join(":", parts.Take(4)) : null;
            entry.ReportingLevel5 = parts.Length >= 5 ? string.Join(":", parts.Take(5)) : null;
            entry.ReportingLevel6 = parts.Length >= 6 ? string.Join(":", parts.Take(6)) : null;
            entry.ReportingLevel7 = parts.Length >= 7 ? string.Join(":", parts.Take(7)) : null;
            entry.ReportingLevel8 = parts.Length >= 8 ? string.Join(":", parts.Take(8)) : null;
            entry.ReportingLevel9 = parts.Length >= 9 ? string.Join(":", parts.Take(9)) : null;
            entry.ReportingLevel10 = parts.Length >= 10 ? string.Join(":", parts.Take(10)) : null;
            entry.ReportingLevel11 = parts.Length >= 11 ? string.Join(":", parts.Take(11)) : null;
            entry.ReportingLevel12 = parts.Length >= 12 ? string.Join(":", parts.Take(12)) : null;
        }

        return entry;
    }

    private static string? GetNullableString(IDataReader reader, string col)
    {
        var ord = reader.GetOrdinal(col);
        if (reader.IsDBNull(ord)) return null;
        var val = reader.GetValue(ord);
        return Convert.ToString(val);
    }

    private static int? GetNullableInt(IDataReader reader, string col)
    {
        var ord = reader.GetOrdinal(col);
        if (reader.IsDBNull(ord)) return null;
        var val = reader.GetValue(ord);
        return Convert.ToInt32(val);
    }

    private static decimal? GetNullableDecimal(IDataReader reader, string col)
    {
        var ord = reader.GetOrdinal(col);
        if (reader.IsDBNull(ord)) return null;
        var val = reader.GetValue(ord);
        return Convert.ToDecimal(val);
    }

    private static DateTime? GetNullableDateTime(IDataReader reader, string col)
    {
        var ord = reader.GetOrdinal(col);
        if (reader.IsDBNull(ord)) return null;
        var val = reader.GetValue(ord);
        return Convert.ToDateTime(val);
    }

    private static Guid? GetNullableGuid(IDataReader reader, string col)
    {
        var ord = reader.GetOrdinal(col);
        if (reader.IsDBNull(ord)) return null;
        var val = reader.GetValue(ord);
        if (val is Guid g) return g;
        return Guid.TryParse(Convert.ToString(val), out var parsed) ? parsed : null;
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
