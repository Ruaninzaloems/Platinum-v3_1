using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;

    public AdminController(DbConnectionFactory db, TransactionService txnService)
    {
        _db = db;
        _txnService = txnService;
    }

    [HttpPost("clear-test-data")]
    public async Task<IActionResult> ClearTestData()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            await conn.ExecuteAsync(@"
                TRUNCATE TABLE
                    ""Asset_WorkflowApprovals"",
                    ""Asset_WorkflowInstances"",
                    ""Asset_PriorPeriodAdjustment"",
                    ""Asset_PriorYearAdjustment_Documents"",
                    ""Asset_PriorYearAdjustment"",
                    ""Led_Journal_Asset"",
                    ""Asset_GeneralLedger"",
                    ""Asset_Transaction_Summary"",
                    ""Asset_Register_Transactions"",
                    ""Asset_ImpairmentPostings"",
                    ""Asset_Impairment"",
                    ""Asset_Revaluations"",
                    ""Asset_Disposal_Approval"",
                    ""Asset_Disposal"",
                    ""Asset_MonthlyApproval"",
                    ""Asset_DepreciationApproval"",
                    ""Asset_Depreciation"",
                    ""Asset_DepreciationSchedule_Item"",
                    ""Asset_DepreciationSchedule"",
                    ""Asset_BulkTransactionItems"",
                    ""Asset_BulkTransactionJobs"",
                    ""Asset_BulkValidation"",
                    ""Asset_Register_Items_Upload"",
                    ""Asset_BulkUploadJobs"",
                    ""Asset_Refurb"",
                    ""Asset_Transfer_Transactions"",
                    ""Asset_Register_Items"",
                    ""Asset_WIP_Documents"",
                    ""Asset_WIP_Register_Items"",
                    ""Asset_WIP_Register_Details"",
                    ""Asset_WIP_Register_Funding"",
                    ""Asset_WIPApprovalItems"",
                    ""Asset_WIP_Register"",
                    ""Asset_VerificationPlanAuditTrail"",
                    ""Asset_VerificationPlanApproval"",
                    ""Asset_VerificationPlanTeamMember"",
                    ""Asset_VerificationPlan"",
                    ""Asset_VerificationAuditTrail"",
                    ""Asset_VerificationRegisterItem"",
                    ""Asset_VerificationRegisterTeamMember"",
                    ""Asset_VerificationRegister"",
                    ""Asset_AuditTrail"",
                    ""GL_Outbox_Lines"",
                    ""GL_Outbox""
                CASCADE", transaction: txn);

            // Reset all sequences in the public schema back to 1
            await conn.ExecuteAsync(@"
                DO $$
                DECLARE
                    seq RECORD;
                BEGIN
                    FOR seq IN
                        SELECT schemaname, sequencename
                        FROM pg_sequences
                        WHERE schemaname = 'public'
                    LOOP
                        EXECUTE 'SELECT setval(' || quote_literal(quote_ident(seq.schemaname) || '.' || quote_ident(seq.sequencename)) || ', 1, false)';
                    END LOOP;
                END $$;
            ", transaction: txn);

            await txn.CommitAsync();
            return Ok(new { success = 1, message = "All test data cleared and ID sequences reset to 1", tablesCleared = 44 });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            return StatusCode(500, new { error = "Failed to clear test data: " + ex.Message });
        }
    }

    public record PopulateSummaryRequest(List<int> AssetIds, string FinYear, int FinPeriod);

    [HttpPost("populate-transaction-summary")]
    public async Task<IActionResult> PopulateTransactionSummary([FromBody] PopulateSummaryRequest request)
    {
        if (request.AssetIds == null || request.AssetIds.Count == 0)
            return BadRequest(new { error = "AssetIds required" });

        var results = new List<object>();
        foreach (var assetId in request.AssetIds)
        {
            try
            {
                await _txnService.PopulateTransactionSummarySingle(assetId, request.FinYear, request.FinPeriod);
                results.Add(new { assetId, status = "ok" });
            }
            catch (Exception ex)
            {
                results.Add(new { assetId, status = "error", detail = ex.Message });
            }
        }

        return Ok(new { success = 1, results });
    }
}
