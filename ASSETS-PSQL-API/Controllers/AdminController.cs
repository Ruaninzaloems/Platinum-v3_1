using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;
using System.Collections.Concurrent;

namespace AssetManagement.Controllers;

public class PsqlPopulateJobState
{
    public int Done { get; set; }
    public int Total { get; set; }
    public int Percent => Total == 0 ? (Finished ? 100 : 0) : (int)Math.Round(Done * 100.0 / Total);
    public bool Finished { get; set; }
    public object? Result { get; set; }
    public string? Error { get; set; }
    public DateTime CreatedAt { get; } = DateTime.UtcNow;
}

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;

    private static readonly ConcurrentDictionary<string, PsqlPopulateJobState> _jobs = new();

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
                    ""GL_Outbox"",
                    ""Asset_MaintenanceWorkOrderDetails"",
                    ""Asset_MaintenanceWorkOrder"",
                    ""Asset_MaintenanceRequest"",
                    ""Planned_Maint_Schedule"",
                    ""Planned_Maint_Activity"",
                    ""Planned_Maint_Plan""
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
            return Ok(new { success = 1, message = "All test data cleared and ID sequences reset to 1", tablesCleared = 50 });
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

    public record PopulateSummaryAllRequest(string? FinYear, int? FinPeriod, int? AssetId);

    [HttpPost("populate-summary")]
    public async Task<IActionResult> PopulateSummaryAll([FromBody] PopulateSummaryAllRequest? request)
    {
        string finYear;
        int finPeriod;
        List<int> assetIds;

        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            finYear = request?.FinYear ?? string.Empty;
            if (string.IsNullOrEmpty(finYear))
            {
                var row = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                    SELECT ""Financial_Year"" AS fy, ""Financial_Period"" AS fp
                    FROM ""Asset_MonthlyApproval""
                    WHERE ""IsApproved"" = TRUE
                    ORDER BY ""Financial_Year"" DESC, ""Financial_Period"" DESC
                    LIMIT 1");
                if (row != null)
                    finYear = row.fy?.ToString() ?? string.Empty;
                else
                {
                    var now = DateTime.Now;
                    int y = now.Month >= 7 ? now.Year : now.Year - 1;
                    finYear = $"{y}/{y + 1}";
                }
            }

            finPeriod = request?.FinPeriod ?? 1;

            if (request?.AssetId.HasValue == true)
            {
                assetIds = new List<int> { request.AssetId.Value };
            }
            else
            {
                assetIds = (await conn.QueryAsync<int>(@"
                    SELECT ""AssetRegisterItem_ID"" FROM ""Asset_Register_Items""
                    WHERE COALESCE(""IsDisposed"", 0) = 0")).ToList();
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }

        var jobId = Guid.NewGuid().ToString("N");
        var state = new PsqlPopulateJobState { Total = assetIds.Count, Done = 0 };
        _jobs[jobId] = state;

        var cutoff = DateTime.UtcNow.AddMinutes(-30);
        foreach (var kvp in _jobs)
        {
            if (kvp.Value.Finished && kvp.Value.CreatedAt < cutoff)
                _jobs.TryRemove(kvp.Key, out _);
        }

        string capturedFinYear = finYear;
        int capturedFinPeriod = finPeriod;
        var txnSvc = _txnService;

        _ = Task.Run(async () =>
        {
            int successCount = 0;
            int errorCount = 0;
            try
            {
                foreach (var assetId in assetIds)
                {
                    try
                    {
                        await txnSvc.PopulateTransactionSummarySingle(assetId, capturedFinYear, capturedFinPeriod);
                        successCount++;
                    }
                    catch
                    {
                        errorCount++;
                    }
                    state.Done++;
                }

                state.Result = new
                {
                    success = 1,
                    message = $"Populated {successCount} assets for {capturedFinYear} from period {capturedFinPeriod}" + (errorCount > 0 ? $", {errorCount} errors" : ""),
                    source = "bulkRebuild",
                    assetsProcessed = successCount,
                    assetsErrored = errorCount,
                    finYear = capturedFinYear,
                    finPeriod = capturedFinPeriod
                };
            }
            catch (Exception ex)
            {
                state.Error = ex.Message;
            }
            finally
            {
                state.Finished = true;
            }
        });

        return Ok(new { jobId });
    }

    [HttpGet("populate-summary/progress/{jobId}")]
    public IActionResult GetPopulateSummaryProgress(string jobId)
    {
        if (!_jobs.TryGetValue(jobId, out var state))
            return NotFound(new { error = "Job not found" });

        return Ok(new
        {
            done = state.Done,
            total = state.Total,
            percent = state.Percent,
            finished = state.Finished,
            result = state.Result,
            error = state.Error
        });
    }
}
