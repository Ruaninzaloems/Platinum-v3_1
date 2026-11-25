using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;

namespace AssetManagement.Services;

public class LedGeneralLedgerService
{
    private readonly DbConnectionFactory _db;
    public LedGeneralLedgerService(DbConnectionFactory db) => _db = db;

    public async Task CreateAsync(LedGlCreateRequest req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await InsertAsync(conn, null, req);
    }

    public async Task InsertAsync(System.Data.Common.DbConnection conn, System.Data.Common.DbTransaction? txn, LedGlCreateRequest req)
    {
        var transactionDetails = req.TransactionDetails != null && req.TransactionDetails.Length > 235
            ? req.TransactionDetails.Substring(0, 235)
            : req.TransactionDetails;
        var documentNumber = req.DocumentNumber != null && req.DocumentNumber.Length > 50
            ? req.DocumentNumber.Substring(0, 50)
            : req.DocumentNumber;
        await conn.ExecuteAsync(@"
            INSERT INTO ""Led_GeneralLedger"" (
                ""PostingDate"", ""ProcessingMonth"", ""VoteID"", ""FinYear"",
                ""TransactionTypeID"", ""TransactionDetails"", ""DocumentNumber"",
                ""Debit"", ""Credit"", ""DateCaptured"", ""CapturerID"",
                ""MatchTranGuid"", ""JournalTransactionTypeID"", ""AssetLinkID"",
                ""SCOAFundsID"", ""SCOARegionID"", ""SCOACostingID"",
                ""SCOAProjectID"", ""SCOAFunctionID"", ""SCOAItemID"",
                ""DivisionID"", ""ProjectID"", ""PlanProjectItemID""
            ) VALUES (
                @postingDate, @processingMonth, @voteId, @finYear,
                @transactionTypeId, @transactionDetails, @documentNumber,
                @debit, @credit, NOW(), @capturerId,
                @matchTranGuid, @journalTransactionTypeId, @assetLinkId,
                @scoaFundsId, @scoaRegionId, @scoaCostingId,
                @scoaProjectId, @scoaFunctionId, @scoaItemId,
                @divisionId, @projectId, @planProjectItemId
            )",
            new
            {
                postingDate = req.PostingDate,
                processingMonth = req.ProcessingMonth,
                voteId = req.VoteId,
                finYear = req.FinYear,
                transactionTypeId = req.TransactionTypeId,
                transactionDetails,
                documentNumber,
                debit = req.Debit,
                credit = req.Credit,
                capturerId = req.CapturerId,
                matchTranGuid = req.MatchTranGuid,
                journalTransactionTypeId = req.JournalTransactionTypeId,
                assetLinkId = req.AssetLinkId,
                scoaFundsId = req.ScoaFundsId,
                scoaRegionId = req.ScoaRegionId,
                scoaCostingId = req.ScoaCostingId,
                scoaProjectId = req.ScoaProjectId,
                scoaFunctionId = req.ScoaFunctionId,
                scoaItemId = req.ScoaItemId,
                divisionId = req.DivisionId,
                projectId = req.ProjectId,
                planProjectItemId = req.PlanProjectItemId
            }, txn);
    }

    public async Task<IEnumerable<dynamic>> GetAllAsync(string? finYear = null, int? processingMonth = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var where = new List<string>();
        if (!string.IsNullOrEmpty(finYear)) where.Add(@"""FinYear"" = @finYear");
        if (processingMonth.HasValue) where.Add(@"""ProcessingMonth"" = @processingMonth");
        var clause = where.Count > 0 ? "WHERE " + string.Join(" AND ", where) : "";
        return await conn.QueryAsync<dynamic>(
            $@"SELECT
                ""GenLedger_ID""             AS ""genLedgerId"",
                ""PostingDate""              AS ""postingDate"",
                ""ProcessingMonth""          AS ""processingMonth"",
                ""VoteID""                   AS ""voteId"",
                ""FinYear""                  AS ""finYear"",
                ""TransactionTypeID""        AS ""transactionTypeId"",
                ""TransactionDetails""       AS ""transactionDetails"",
                ""DocumentNumber""           AS ""documentNumber"",
                ""Debit""                    AS ""debit"",
                ""Credit""                   AS ""credit"",
                ""DateCaptured""             AS ""dateCaptured"",
                ""CapturerID""               AS ""capturerId"",
                ""MatchTranGuid""            AS ""matchTranGuid"",
                ""JournalTransactionTypeID"" AS ""journalTransactionTypeId"",
                ""AssetLinkID""              AS ""assetLinkId"",
                ""SCOAFundsID""              AS ""scoaFundsId"",
                ""SCOARegionID""             AS ""scoaRegionId"",
                ""SCOACostingID""            AS ""scoaCostingId"",
                ""SCOAProjectID""            AS ""scoaProjectId"",
                ""SCOAFunctionID""           AS ""scoaFunctionId"",
                ""SCOAItemID""               AS ""scoaItemId"",
                ""DivisionID""              AS ""divisionId"",
                ""ProjectID""               AS ""projectId"",
                ""PlanProjectItemID""        AS ""planProjectItemId""
            FROM ""Led_GeneralLedger"" {clause}
            ORDER BY ""GenLedger_ID"" DESC",
            new { finYear, processingMonth });
    }
}
