using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using PlatinumAFS.Api.Data;
using PlatinumAFS.Api.DTOs;
using PlatinumAFS.Api.Models;

namespace PlatinumAFS.Api.Services;

public class DocumentService
{
    private readonly PlatinumDbContext _context;

    public DocumentService(PlatinumDbContext context)
    {
        _context = context;
    }

    private const string DocumentRegisterSql = @"
SELECT
    gl.DocumentNumber,
    dt.DocumentTypeDesc AS DocumentType,
    MIN(gl.TransactionTypeID) AS TransactionTypeID,
    tt.TransactionTypeDesc AS TransactionType,
    gl.FinYear,
    MIN(gl.ProcessingMonth) AS ProcessingMonth,
    MIN(gl.PostingDate) AS PostingDate,
    MIN(gl.DateCaptured) AS DateCaptured,
    MIN(cap.UserName) AS CapturedBy,
    CAST(NULL AS NVARCHAR(50)) AS ReferenceNumber,
    CAST(NULL AS NVARCHAR(50)) AS VendorInvoiceNumber,
    CAST(NULL AS NVARCHAR(50)) AS PaymentDocumentNumber,
    CAST(NULL AS NVARCHAR(50)) AS OrderNumber,
    CAST(NULL AS NVARCHAR(50)) AS SupplierNo,
    CAST(NULL AS NVARCHAR(200)) AS SupplierName,
    MIN(dept.DepartmentDesc) AS Department,
    MIN(div.DivisionDesc) AS Division,
    CAST(MIN(p.ProjectCode) AS NVARCHAR(20)) AS ProjectCode,
    MIN(p.ProjectDesc) AS ProjectDescription,
    COUNT(*) AS LineItemCount,
    ISNULL(SUM(gl.Debit), 0) AS TotalDebit,
    ISNULL(SUM(gl.Credit), 0) AS TotalCredit,
    ISNULL(SUM(gl.Debit), 0) - ISNULL(SUM(gl.Credit), 0) AS NetAmount,
    ABS(ISNULL(SUM(gl.Debit), 0) - ISNULL(SUM(gl.Credit), 0)) AS AbsoluteAmount,
    MIN(gl.TransactionDetails) AS TransactionDetails,
    CAST(NULL AS NVARCHAR(235)) AS OrderDescription,
    MIN(gl.VATRate) AS VATRate,
    CASE WHEN MIN(gl.VATRate) IS NOT NULL AND MIN(gl.VATRate) > 0 THEN 'Y' ELSE 'N' END AS VATIndicator,
    MIN(gl.MatchTranGuid) AS MatchTranGuid
FROM [dbo].[Led_GeneralLedger] gl
LEFT JOIN [dbo].[Led_Vote] v ON gl.VoteID = v.Vote_ID
LEFT JOIN [dbo].[Const_TransactionType] tt ON gl.TransactionTypeID = tt.TransactionType_ID
LEFT JOIN [dbo].[User_UserDetail] cap ON gl.CapturerID = cap.User_ID
LEFT JOIN [dbo].[Const_Division] div ON gl.DivisionID = div.Division_ID
LEFT JOIN [dbo].[Const_Department] dept ON div.DepartmentID = dept.Department_ID
LEFT JOIN [dbo].[Plan_Project] p ON gl.ProjectID = p.Project_ID
OUTER APPLY (SELECT TOP 1 d.DocumentTypeDesc FROM [dbo].[Const_DocumentType] d WHERE CHARINDEX('/', gl.DocumentNumber) > 0 AND d.DocumentType_ID = TRY_CAST(LEFT(gl.DocumentNumber, CHARINDEX('/', gl.DocumentNumber) - 1) AS INT)) dt";

    private const string DocumentRegisterGroupBy = @"
GROUP BY gl.DocumentNumber, tt.TransactionTypeDesc, dt.DocumentTypeDesc, gl.FinYear";

    private const string LineItemSql = @"
SELECT
    gl.GenLedger_ID AS GenLedgerId,
    gl.DocumentNumber,
    gl.PostingDate,
    gl.ProcessingMonth,
    gl.FinYear,
    tt.TransactionTypeDesc AS TransactionType,
    gl.TransactionDetails,
    gl.Debit,
    gl.Credit,
    gl.Balance,
    gl.VoteID,
    v.Vote AS VoteNumber,
    v.VoteDesc AS VoteDescription,
    v.Vote AS AccountNo,
    item.ScoaCode AS ScoaItemCode,
    item.ScoaDesc AS ScoaItemDescription,
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
    COALESCE(cbRef.ReferenceNumber, jmRef.ReferenceNumber) AS ReferenceNumber,
    CAST(NULL AS NVARCHAR(50)) AS SupplierNo,
    CAST(NULL AS NVARCHAR(200)) AS SupplierName,
    CAST(NULL AS NVARCHAR(50)) AS OrderNumber,
    CAST(NULL AS NVARCHAR(50)) AS OrderLine,
    CAST(NULL AS NVARCHAR(235)) AS OrderDescription,
    CAST(NULL AS NVARCHAR(50)) AS VendorInvoiceNumber,
    CAST(NULL AS NVARCHAR(50)) AS PaymentDocumentNumber,
    gl.VATRate,
    CASE WHEN gl.VATRate IS NOT NULL AND gl.VATRate > 0 THEN 'Y' ELSE 'N' END AS VATIndicator,
    cap.UserName AS CapturedBy,
    gl.DateCaptured,
    gl.MatchTranGuid,
    CASE
        WHEN item.ScoaDesc LIKE 'Assets%' THEN 'IA'
        WHEN item.ScoaDesc LIKE 'Liabilities%' THEN 'IL'
        WHEN item.ScoaDesc LIKE 'Net Assets%' OR item.ScoaDesc LIKE 'Community Wealth%' THEN 'LN'
        WHEN item.ScoaDesc LIKE 'Revenue%' THEN 'IR'
        WHEN item.ScoaDesc LIKE 'Expenditure%' THEN 'IE'
        WHEN item.ScoaDesc LIKE 'Gains%' OR item.ScoaDesc LIKE 'Losses%' OR item.ScoaDesc LIKE 'Surplus%' OR item.ScoaDesc LIKE 'Deficit%' THEN 'IZ'
        ELSE ''
    END AS ItemType
FROM [dbo].[Led_GeneralLedger] gl
LEFT JOIN [dbo].[Led_Vote] v ON gl.VoteID = v.Vote_ID
LEFT JOIN [dbo].[Const_SCOA_Structure] item ON gl.SCOAItemID = item.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Funds_Structure] funds ON gl.SCOAFundsID = funds.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Function_Structure] func ON gl.SCOAFunctionID = func.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Project_Structure] proj ON gl.SCOAProjectID = proj.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Costing_Structure] cost ON gl.SCOACostingID = cost.ScoaID
LEFT JOIN [dbo].[Const_SCOA_Regional_Structure] reg ON gl.SCOARegionID = reg.ScoaID
LEFT JOIN [dbo].[Const_TransactionType] tt ON gl.TransactionTypeID = tt.TransactionType_ID
LEFT JOIN [dbo].[User_UserDetail] cap ON gl.CapturerID = cap.User_ID
OUTER APPLY (SELECT TOP 1 lcv.ReferenceNumber FROM [dbo].[Led_CashbookVote] lcv WHERE gl.CashbookTransactionID IS NOT NULL AND lcv.CashbookTransactionID = gl.CashbookTransactionID) cbRef
OUTER APPLY (SELECT TOP 1 jm.ReferenceNumber FROM [dbo].[Led_Journal_Multiple] jm WHERE gl.MultipleJournalID IS NOT NULL AND jm.MultipleJournal_ID = gl.MultipleJournalID) jmRef";

    public async Task<(List<DocumentEntry> Documents, int TotalCount)> GetDocumentRegisterAsync(
        string? finYear = null,
        int? processingMonth = null,
        string? documentType = null,
        string? supplierNo = null,
        string? supplierName = null,
        decimal? minAmount = null,
        decimal? maxAmount = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        string? documentNumber = null,
        string? referenceNumber = null,
        string? vendorInvoiceNumber = null,
        string? orderNumber = null,
        string? department = null,
        string? searchText = null,
        int page = 1,
        int pageSize = 100)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            var whereConditions = new List<string>();
            var parameters = new List<SqlParameter>();
            var havingConditions = new List<string>();

            if (!string.IsNullOrEmpty(finYear))
            {
                whereConditions.Add("gl.FinYear = @FinYear");
                parameters.Add(new SqlParameter("@FinYear", finYear));
            }
            if (processingMonth.HasValue)
            {
                whereConditions.Add("gl.ProcessingMonth = @ProcessingMonth");
                parameters.Add(new SqlParameter("@ProcessingMonth", processingMonth.Value));
            }
            if (!string.IsNullOrEmpty(documentNumber))
            {
                whereConditions.Add("gl.DocumentNumber LIKE @DocumentNumber");
                parameters.Add(new SqlParameter("@DocumentNumber", $"%{documentNumber}%"));
            }
            if (!string.IsNullOrEmpty(documentType))
            {
                whereConditions.Add("tt.TransactionTypeDesc = @DocumentType");
                parameters.Add(new SqlParameter("@DocumentType", documentType));
            }
            if (dateFrom.HasValue)
            {
                whereConditions.Add("gl.PostingDate >= @DateFrom");
                parameters.Add(new SqlParameter("@DateFrom", dateFrom.Value));
            }
            if (dateTo.HasValue)
            {
                whereConditions.Add("gl.PostingDate <= @DateTo");
                parameters.Add(new SqlParameter("@DateTo", dateTo.Value));
            }
            if (!string.IsNullOrEmpty(department))
            {
                whereConditions.Add("dept.DepartmentDesc LIKE @Department");
                parameters.Add(new SqlParameter("@Department", $"%{department}%"));
            }
            if (!string.IsNullOrEmpty(searchText))
            {
                whereConditions.Add("(gl.TransactionDetails LIKE @SearchText OR gl.DocumentNumber LIKE @SearchText)");
                parameters.Add(new SqlParameter("@SearchText", $"%{searchText}%"));
            }

            if (minAmount.HasValue)
            {
                havingConditions.Add("ABS(ISNULL(SUM(gl.Debit), 0) - ISNULL(SUM(gl.Credit), 0)) >= @MinAmount");
                parameters.Add(new SqlParameter("@MinAmount", minAmount.Value));
            }
            if (maxAmount.HasValue)
            {
                havingConditions.Add("ABS(ISNULL(SUM(gl.Debit), 0) - ISNULL(SUM(gl.Credit), 0)) <= @MaxAmount");
                parameters.Add(new SqlParameter("@MaxAmount", maxAmount.Value));
            }

            var whereClause = whereConditions.Count > 0
                ? " WHERE " + string.Join(" AND ", whereConditions)
                : "";

            var havingClause = havingConditions.Count > 0
                ? " HAVING " + string.Join(" AND ", havingConditions)
                : "";

            int totalCount;
            using (var countCmd = connection.CreateCommand())
            {
                countCmd.CommandText = $@"
SELECT COUNT(*) FROM (
    SELECT gl.DocumentNumber
    FROM [dbo].[Led_GeneralLedger] gl
    LEFT JOIN [dbo].[Led_Vote] v ON gl.VoteID = v.Vote_ID
    LEFT JOIN [dbo].[Const_TransactionType] tt ON gl.TransactionTypeID = tt.TransactionType_ID
    LEFT JOIN [dbo].[Const_Division] div ON gl.DivisionID = div.Division_ID
    LEFT JOIN [dbo].[Const_Department] dept ON div.DepartmentID = dept.Department_ID
    OUTER APPLY (SELECT TOP 1 d.DocumentTypeDesc FROM [dbo].[Const_DocumentType] d WHERE CHARINDEX('/', gl.DocumentNumber) > 0 AND d.DocumentType_ID = TRY_CAST(LEFT(gl.DocumentNumber, CHARINDEX('/', gl.DocumentNumber) - 1) AS INT)) dt
    {whereClause}
    GROUP BY gl.DocumentNumber, tt.TransactionTypeDesc, dt.DocumentTypeDesc, gl.FinYear
    {havingClause}
) AS DocCount";
                countCmd.CommandTimeout = 60;
                foreach (var p in parameters)
                    countCmd.Parameters.Add(CloneParameter(p));
                totalCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync());
            }

            var documents = new List<DocumentEntry>();
            using (var dataCmd = connection.CreateCommand())
            {
                dataCmd.CommandText = DocumentRegisterSql + whereClause + DocumentRegisterGroupBy + havingClause + @"
ORDER BY MIN(gl.PostingDate) DESC, gl.DocumentNumber
OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";
                dataCmd.CommandTimeout = 60;
                foreach (var p in parameters)
                    dataCmd.Parameters.Add(CloneParameter(p));
                dataCmd.Parameters.Add(new SqlParameter("@Offset", (page - 1) * pageSize));
                dataCmd.Parameters.Add(new SqlParameter("@PageSize", pageSize));

                using var reader = await dataCmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                    documents.Add(MapDocumentEntry(reader));
            }

            return (documents, totalCount);
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    public async Task<List<DocumentLineItem>> GetDocumentDetailAsync(string documentNumber, string? finYear = null)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            var whereClause = " WHERE gl.DocumentNumber = @DocumentNumber";
            var parameters = new List<SqlParameter>
            {
                new SqlParameter("@DocumentNumber", documentNumber)
            };

            if (!string.IsNullOrEmpty(finYear))
            {
                whereClause += " AND gl.FinYear = @FinYear";
                parameters.Add(new SqlParameter("@FinYear", finYear));
            }

            using var cmd = connection.CreateCommand();
            cmd.CommandText = LineItemSql + whereClause + " ORDER BY gl.PostingDate, gl.GenLedger_ID";
            cmd.CommandTimeout = 60;
            foreach (var p in parameters)
                cmd.Parameters.Add(p);

            var items = new List<DocumentLineItem>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                items.Add(MapLineItem(reader));

            return items;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    public async Task<List<DocumentLineItem>> GetRelatedDocumentsAsync(
        string documentNumber,
        string? finYear = null)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            var sql = LineItemSql + @"
WHERE (gl.MatchTranGuid IN (
        SELECT MatchTranGuid FROM [dbo].[Led_GeneralLedger]
        WHERE DocumentNumber = @DocNum AND MatchTranGuid IS NOT NULL
    ))
    AND gl.DocumentNumber != @DocNum";

            if (!string.IsNullOrEmpty(finYear))
                sql += " AND gl.FinYear = @FinYear";

            sql += " ORDER BY gl.PostingDate, gl.GenLedger_ID";

            using var cmd = connection.CreateCommand();
            cmd.CommandText = sql;
            cmd.CommandTimeout = 60;
            cmd.Parameters.Add(new SqlParameter("@DocNum", documentNumber));
            if (!string.IsNullOrEmpty(finYear))
                cmd.Parameters.Add(new SqlParameter("@FinYear", finYear));

            var items = new List<DocumentLineItem>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                items.Add(MapLineItem(reader));

            return items;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    public async Task<DocumentOverviewDto> GetDocumentOverviewAsync(string? finYear = null)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            var finYearFilter = !string.IsNullOrEmpty(finYear)
                ? "WHERE gl.FinYear = @FinYear"
                : "";

            var overview = new DocumentOverviewDto { FinYear = finYear };

            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = $@"
SELECT
    COUNT(DISTINCT gl.DocumentNumber) AS TotalDocuments,
    COUNT(*) AS TotalLineItems,
    ISNULL(SUM(gl.Debit), 0) AS TotalDebit,
    ISNULL(SUM(gl.Credit), 0) AS TotalCredit
FROM [dbo].[Led_GeneralLedger] gl
{finYearFilter}";
                cmd.CommandTimeout = 60;
                if (!string.IsNullOrEmpty(finYear))
                    cmd.Parameters.Add(new SqlParameter("@FinYear", finYear));

                using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    overview.TotalDocuments = Convert.ToInt32(reader.GetValue(0));
                    overview.TotalLineItems = Convert.ToInt32(reader.GetValue(1));
                    overview.TotalDebit = Convert.ToDecimal(reader.GetValue(2));
                    overview.TotalCredit = Convert.ToDecimal(reader.GetValue(3));
                }
            }

            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = $@"
SELECT
    ISNULL(tt.TransactionTypeDesc, 'Unknown') AS DocumentType,
    COUNT(DISTINCT gl.DocumentNumber) AS DocumentCount,
    COUNT(*) AS LineItemCount,
    ISNULL(SUM(gl.Debit), 0) AS TotalDebit,
    ISNULL(SUM(gl.Credit), 0) AS TotalCredit,
    ISNULL(SUM(gl.Debit), 0) - ISNULL(SUM(gl.Credit), 0) AS NetAmount
FROM [dbo].[Led_GeneralLedger] gl
LEFT JOIN [dbo].[Const_TransactionType] tt ON gl.TransactionTypeID = tt.TransactionType_ID
{finYearFilter}
GROUP BY tt.TransactionTypeDesc
ORDER BY COUNT(DISTINCT gl.DocumentNumber) DESC";
                cmd.CommandTimeout = 60;
                if (!string.IsNullOrEmpty(finYear))
                    cmd.Parameters.Add(new SqlParameter("@FinYear", finYear));

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    overview.ByType.Add(new DocumentTypeSummaryDto
                    {
                        DocumentType = Convert.ToString(reader.GetValue(0)) ?? "Unknown",
                        DocumentCount = Convert.ToInt32(reader.GetValue(1)),
                        LineItemCount = Convert.ToInt32(reader.GetValue(2)),
                        TotalDebit = Convert.ToDecimal(reader.GetValue(3)),
                        TotalCredit = Convert.ToDecimal(reader.GetValue(4)),
                        NetAmount = Convert.ToDecimal(reader.GetValue(5))
                    });
                }
            }

            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = $@"
SELECT
    gl.ProcessingMonth,
    COUNT(DISTINCT gl.DocumentNumber) AS DocumentCount,
    COUNT(*) AS LineItemCount,
    ISNULL(SUM(gl.Debit), 0) AS TotalDebit,
    ISNULL(SUM(gl.Credit), 0) AS TotalCredit
FROM [dbo].[Led_GeneralLedger] gl
{finYearFilter}
GROUP BY gl.ProcessingMonth
ORDER BY gl.ProcessingMonth";
                cmd.CommandTimeout = 60;
                if (!string.IsNullOrEmpty(finYear))
                    cmd.Parameters.Add(new SqlParameter("@FinYear", finYear));

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    overview.ByMonth.Add(new DocumentMonthlySummaryDto
                    {
                        ProcessingMonth = Convert.ToInt32(reader.GetValue(0)),
                        DocumentCount = Convert.ToInt32(reader.GetValue(1)),
                        LineItemCount = Convert.ToInt32(reader.GetValue(2)),
                        TotalDebit = Convert.ToDecimal(reader.GetValue(3)),
                        TotalCredit = Convert.ToDecimal(reader.GetValue(4))
                    });
                }
            }

            using (var cmd = connection.CreateCommand())
            {
                var scmWhere = string.IsNullOrEmpty(finYear)
                    ? "WHERE gl.ExtraLinkID_1 IS NOT NULL"
                    : "WHERE gl.FinYear = @FinYear AND gl.ExtraLinkID_1 IS NOT NULL";

                cmd.CommandText = $@"
SELECT TOP 20
    CAST(inv.VendorCreditorID AS NVARCHAR(50)) AS SupplierNo,
    ISNULL(ven.VendorName, ven.CompanyName) AS SupplierName,
    COUNT(DISTINCT gl.DocumentNumber) AS DocumentCount,
    ISNULL(SUM(gl.Debit), 0) AS TotalDebit,
    ISNULL(SUM(gl.Credit), 0) AS TotalCredit,
    ISNULL(SUM(gl.Debit), 0) - ISNULL(SUM(gl.Credit), 0) AS NetAmount
FROM [dbo].[Led_GeneralLedger] gl
INNER JOIN [dbo].[SCM_Invoice] inv ON gl.ExtraLinkID_1 = inv.Invoice_ID AND gl.ExtraLinkDesc LIKE '%SCM Invoice%'
INNER JOIN [dbo].[Cons_Vendor] ven ON inv.VendorCreditorID = ven.Vendor_ID
{scmWhere}
GROUP BY inv.VendorCreditorID, ISNULL(ven.VendorName, ven.CompanyName)
ORDER BY ISNULL(SUM(gl.Debit), 0) DESC";
                cmd.CommandTimeout = 60;
                if (!string.IsNullOrEmpty(finYear))
                    cmd.Parameters.Add(new SqlParameter("@FinYear", finYear));

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    overview.TopSuppliers.Add(new DocumentSupplierSummaryDto
                    {
                        SupplierNo = GetNullableString(reader, "SupplierNo"),
                        SupplierName = GetNullableString(reader, "SupplierName"),
                        DocumentCount = Convert.ToInt32(reader.GetValue(reader.GetOrdinal("DocumentCount"))),
                        TotalDebit = Convert.ToDecimal(reader.GetValue(reader.GetOrdinal("TotalDebit"))),
                        TotalCredit = Convert.ToDecimal(reader.GetValue(reader.GetOrdinal("TotalCredit"))),
                        NetAmount = Convert.ToDecimal(reader.GetValue(reader.GetOrdinal("NetAmount")))
                    });
                }
            }

            return overview;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    public async Task<AuditSampleResult> GetAuditSampleAsync(
        string? finYear = null,
        string? documentType = null,
        string? supplierNo = null,
        decimal? minAmount = null,
        decimal? maxAmount = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        int? processingMonth = null,
        string samplingMethod = "monetary-unit",
        int sampleSize = 25,
        int? seed = null)
    {
        var (allDocuments, totalCount) = await GetDocumentRegisterAsync(
            finYear: finYear,
            documentType: documentType,
            supplierNo: supplierNo,
            minAmount: minAmount,
            maxAmount: maxAmount,
            dateFrom: dateFrom,
            dateTo: dateTo,
            processingMonth: processingMonth,
            page: 1,
            pageSize: 50000);

        var result = new AuditSampleResult
        {
            TotalPopulation = allDocuments.Count,
            TotalPopulationAmount = allDocuments.Sum(d => d.AbsoluteAmount),
            SamplingMethod = samplingMethod
        };

        List<DocumentEntry> sample;

        switch (samplingMethod.ToLower())
        {
            case "monetary-unit":
            case "mus":
                sample = MonetaryUnitSampling(allDocuments, sampleSize, seed);
                break;

            case "top-n":
            case "largest":
                sample = allDocuments
                    .OrderByDescending(d => d.AbsoluteAmount)
                    .Take(sampleSize)
                    .ToList();
                break;

            case "random":
                var rng = seed.HasValue ? new Random(seed.Value) : new Random();
                sample = allDocuments
                    .OrderBy(_ => rng.Next())
                    .Take(Math.Min(sampleSize, allDocuments.Count))
                    .ToList();
                break;

            case "stratified":
                sample = StratifiedSampling(allDocuments, sampleSize, seed);
                break;

            default:
                sample = allDocuments
                    .OrderByDescending(d => d.AbsoluteAmount)
                    .Take(sampleSize)
                    .ToList();
                break;
        }

        result.SampleItems = sample;
        result.SampleSize = sample.Count;
        result.SampleAmount = sample.Sum(d => d.AbsoluteAmount);
        result.CoveragePercentage = result.TotalPopulationAmount > 0
            ? Math.Round(result.SampleAmount / result.TotalPopulationAmount * 100, 2)
            : 0;

        return result;
    }

    public async Task<List<DocumentSchemaSummary>> DiscoverDocumentTablesAsync()
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            var tables = new List<DocumentSchemaSummary>();

            using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
SELECT
    t.TABLE_SCHEMA,
    t.TABLE_NAME,
    (SELECT SUM(p.rows) FROM sys.partitions p
     INNER JOIN sys.tables st ON p.object_id = st.object_id
     INNER JOIN sys.schemas ss ON st.schema_id = ss.schema_id
     WHERE ss.name = t.TABLE_SCHEMA AND st.name = t.TABLE_NAME AND p.index_id IN (0,1)) AS RowCount
FROM INFORMATION_SCHEMA.TABLES t
WHERE t.TABLE_TYPE = 'BASE TABLE'
AND (t.TABLE_NAME LIKE '%Document%'
    OR t.TABLE_NAME LIKE '%Invoice%'
    OR t.TABLE_NAME LIKE '%Order%'
    OR t.TABLE_NAME LIKE '%Payment%'
    OR t.TABLE_NAME LIKE '%Receipt%'
    OR t.TABLE_NAME LIKE '%Voucher%'
    OR t.TABLE_NAME LIKE '%Batch%'
    OR t.TABLE_NAME LIKE '%Journal%'
    OR t.TABLE_NAME LIKE '%Attachment%'
    OR t.TABLE_NAME LIKE '%Cashbook%'
    OR t.TABLE_NAME LIKE '%Creditor%'
    OR t.TABLE_NAME LIKE '%Debtor%'
    OR t.TABLE_NAME LIKE '%SCM%'
    OR t.TABLE_NAME LIKE '%Procurement%')
ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME";
            cmd.CommandTimeout = 30;

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                tables.Add(new DocumentSchemaSummary
                {
                    TableSchema = Convert.ToString(reader.GetValue(0)) ?? "",
                    TableName = Convert.ToString(reader.GetValue(1)) ?? "",
                    RowCount = reader.IsDBNull(2) ? 0 : Convert.ToInt64(reader.GetValue(2))
                });
            }

            foreach (var table in tables)
            {
                using var colCmd = connection.CreateCommand();
                colCmd.CommandText = @"
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @Schema AND TABLE_NAME = @Table
ORDER BY ORDINAL_POSITION";
                colCmd.CommandTimeout = 10;
                colCmd.Parameters.Add(new SqlParameter("@Schema", table.TableSchema!));
                colCmd.Parameters.Add(new SqlParameter("@Table", table.TableName!));

                using var colReader = await colCmd.ExecuteReaderAsync();
                while (await colReader.ReadAsync())
                {
                    table.Columns.Add(colReader.GetString(0));
                    table.ColumnCount++;
                }
            }

            return tables;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    public async Task<List<string>> GetDocumentTypesAsync(string? finYear = null)
    {
        var connection = _context.Database.GetDbConnection();
        await connection.OpenAsync();

        try
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
SELECT DISTINCT tt.TransactionTypeDesc
FROM [dbo].[Led_GeneralLedger] gl
LEFT JOIN [dbo].[Const_TransactionType] tt ON gl.TransactionTypeID = tt.TransactionType_ID
" + (string.IsNullOrEmpty(finYear) ? "" : "WHERE gl.FinYear = @FinYear ") + @"
ORDER BY tt.TransactionTypeDesc";
            cmd.CommandTimeout = 60;
            if (!string.IsNullOrEmpty(finYear))
                cmd.Parameters.Add(new SqlParameter("@FinYear", finYear));

            var types = new List<string>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                if (!reader.IsDBNull(0))
                    types.Add(reader.GetString(0));
            }
            return types;
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    private static List<DocumentEntry> MonetaryUnitSampling(List<DocumentEntry> population, int sampleSize, int? seed)
    {
        if (population.Count == 0) return new List<DocumentEntry>();

        var effectiveSize = Math.Min(sampleSize, population.Count);
        var sorted = population.OrderByDescending(d => d.AbsoluteAmount).ToList();
        var totalAmount = sorted.Sum(d => d.AbsoluteAmount);
        if (totalAmount == 0) return sorted.Take(effectiveSize).ToList();

        var interval = totalAmount / effectiveSize;
        var rng = seed.HasValue ? new Random(seed.Value) : new Random();
        var startPoint = (decimal)rng.NextDouble() * interval;

        var selected = new HashSet<int>();
        var sample = new List<DocumentEntry>();

        for (int i = 0; i < effectiveSize * 2 && sample.Count < effectiveSize; i++)
        {
            var targetAmount = startPoint + (i * interval);
            decimal cumulative = 0;

            for (int j = 0; j < sorted.Count; j++)
            {
                cumulative += sorted[j].AbsoluteAmount;
                if (cumulative >= targetAmount && !selected.Contains(j))
                {
                    selected.Add(j);
                    sample.Add(sorted[j]);
                    break;
                }
            }
        }

        if (sample.Count < effectiveSize)
        {
            for (int j = 0; j < sorted.Count && sample.Count < effectiveSize; j++)
            {
                if (!selected.Contains(j))
                    sample.Add(sorted[j]);
            }
        }

        return sample;
    }

    private static List<DocumentEntry> StratifiedSampling(List<DocumentEntry> population, int sampleSize, int? seed)
    {
        if (population.Count == 0) return new List<DocumentEntry>();

        var effectiveSize = Math.Min(sampleSize, population.Count);
        var rng = seed.HasValue ? new Random(seed.Value) : new Random();

        var strata = population
            .GroupBy(d =>
            {
                if (d.AbsoluteAmount >= 1000000) return "High (>=R1M)";
                if (d.AbsoluteAmount >= 100000) return "Medium (R100K-R1M)";
                if (d.AbsoluteAmount >= 10000) return "Low (R10K-R100K)";
                return "Minimal (<R10K)";
            })
            .OrderByDescending(g => g.Key)
            .ToList();

        var sample = new List<DocumentEntry>();
        var selectedIndices = new HashSet<int>();
        var remaining = effectiveSize;

        foreach (var stratum in strata)
        {
            var stratumList = stratum.ToList();
            var proportional = (int)Math.Ceiling((double)stratumList.Count / population.Count * effectiveSize);
            var take = Math.Min(Math.Min(proportional, remaining), stratumList.Count);

            if (take > 0)
            {
                var picked = stratumList.OrderBy(_ => rng.Next()).Take(take).ToList();
                sample.AddRange(picked);
                remaining -= picked.Count;
            }
        }

        if (sample.Count < effectiveSize)
        {
            var sampleSet = new HashSet<string?>(sample.Select(s => s.DocumentNumber));
            var fill = population
                .Where(p => !sampleSet.Contains(p.DocumentNumber))
                .OrderBy(_ => rng.Next())
                .Take(effectiveSize - sample.Count);
            sample.AddRange(fill);
        }

        return sample;
    }

    private static DocumentEntry MapDocumentEntry(IDataReader reader)
    {
        return new DocumentEntry
        {
            DocumentNumber = GetNullableString(reader, "DocumentNumber"),
            DocumentType = GetNullableString(reader, "DocumentType"),
            TransactionTypeID = GetNullableInt(reader, "TransactionTypeID"),
            TransactionType = GetNullableString(reader, "TransactionType"),
            FinYear = GetNullableString(reader, "FinYear"),
            ProcessingMonth = GetNullableInt(reader, "ProcessingMonth"),
            PostingDate = GetNullableDateTime(reader, "PostingDate"),
            DateCaptured = GetNullableDateTime(reader, "DateCaptured"),
            CapturedBy = GetNullableString(reader, "CapturedBy"),
            ReferenceNumber = GetNullableString(reader, "ReferenceNumber"),
            VendorInvoiceNumber = GetNullableString(reader, "VendorInvoiceNumber"),
            PaymentDocumentNumber = GetNullableString(reader, "PaymentDocumentNumber"),
            OrderNumber = GetNullableString(reader, "OrderNumber"),
            SupplierNo = GetNullableString(reader, "SupplierNo"),
            SupplierName = GetNullableString(reader, "SupplierName"),
            Department = GetNullableString(reader, "Department"),
            Division = GetNullableString(reader, "Division"),
            ProjectCode = GetNullableString(reader, "ProjectCode"),
            ProjectDescription = GetNullableString(reader, "ProjectDescription"),
            LineItemCount = reader.IsDBNull(reader.GetOrdinal("LineItemCount")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("LineItemCount"))),
            TotalDebit = reader.IsDBNull(reader.GetOrdinal("TotalDebit")) ? 0m : Convert.ToDecimal(reader.GetValue(reader.GetOrdinal("TotalDebit"))),
            TotalCredit = reader.IsDBNull(reader.GetOrdinal("TotalCredit")) ? 0m : Convert.ToDecimal(reader.GetValue(reader.GetOrdinal("TotalCredit"))),
            NetAmount = reader.IsDBNull(reader.GetOrdinal("NetAmount")) ? 0m : Convert.ToDecimal(reader.GetValue(reader.GetOrdinal("NetAmount"))),
            AbsoluteAmount = reader.IsDBNull(reader.GetOrdinal("AbsoluteAmount")) ? 0m : Convert.ToDecimal(reader.GetValue(reader.GetOrdinal("AbsoluteAmount"))),
            TransactionDetails = GetNullableString(reader, "TransactionDetails"),
            OrderDescription = GetNullableString(reader, "OrderDescription"),
            VATRate = GetNullableDecimal(reader, "VATRate"),
            VATIndicator = GetNullableString(reader, "VATIndicator"),
            MatchTranGuid = GetNullableGuid(reader, "MatchTranGuid")
        };
    }

    private static DocumentLineItem MapLineItem(IDataReader reader)
    {
        return new DocumentLineItem
        {
            GenLedgerId = reader.IsDBNull(reader.GetOrdinal("GenLedgerId")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("GenLedgerId"))),
            DocumentNumber = GetNullableString(reader, "DocumentNumber"),
            PostingDate = reader.IsDBNull(reader.GetOrdinal("PostingDate")) ? DateTime.MinValue : Convert.ToDateTime(reader.GetValue(reader.GetOrdinal("PostingDate"))),
            ProcessingMonth = reader.IsDBNull(reader.GetOrdinal("ProcessingMonth")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("ProcessingMonth"))),
            FinYear = GetNullableString(reader, "FinYear"),
            TransactionType = GetNullableString(reader, "TransactionType"),
            TransactionDetails = GetNullableString(reader, "TransactionDetails"),
            Debit = GetNullableDecimal(reader, "Debit"),
            Credit = GetNullableDecimal(reader, "Credit"),
            Balance = GetNullableDecimal(reader, "Balance"),
            VoteID = GetNullableInt(reader, "VoteID"),
            VoteNumber = GetNullableString(reader, "VoteNumber"),
            VoteDescription = GetNullableString(reader, "VoteDescription"),
            AccountNo = GetNullableString(reader, "AccountNo"),
            ScoaItemCode = GetNullableString(reader, "ScoaItemCode"),
            ScoaItemDescription = GetNullableString(reader, "ScoaItemDescription"),
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
            ReferenceNumber = GetNullableString(reader, "ReferenceNumber"),
            SupplierNo = GetNullableString(reader, "SupplierNo"),
            SupplierName = GetNullableString(reader, "SupplierName"),
            OrderNumber = GetNullableString(reader, "OrderNumber"),
            OrderLine = GetNullableString(reader, "OrderLine"),
            OrderDescription = GetNullableString(reader, "OrderDescription"),
            VendorInvoiceNumber = GetNullableString(reader, "VendorInvoiceNumber"),
            PaymentDocumentNumber = GetNullableString(reader, "PaymentDocumentNumber"),
            VATRate = GetNullableDecimal(reader, "VATRate"),
            VATIndicator = GetNullableString(reader, "VATIndicator"),
            CapturedBy = GetNullableString(reader, "CapturedBy"),
            DateCaptured = GetNullableDateTime(reader, "DateCaptured"),
            MatchTranGuid = GetNullableGuid(reader, "MatchTranGuid"),
            ItemType = GetNullableString(reader, "ItemType")
        };
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
