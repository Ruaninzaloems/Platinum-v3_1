using Microsoft.AspNetCore.Mvc;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/automated")]
public class AutomatedProcessingController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;

    public AutomatedProcessingController(DbConnectionFactory db, TransactionService txnService)
    {
        _db = db;
        _txnService = txnService;
    }

    [HttpPost("recalculate-after-rejection")]
    public async Task<IActionResult> RecalculateAfterRejection([FromBody] RecalculateRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var approvalMethod = await _txnService.GetApprovalMethod(conn);
        if (approvalMethod != "Automated")
            return Ok(new { skipped = 1, reason = "Not in Automated mode" });

        var (impairmentsUpdated, disposalsUpdated) = await _txnService.RecalculatePendingAfterDate(
            conn, request.AssetId, request.AfterDate, request.FinYear);

        return Ok(new { success = 1, impairmentsUpdated, disposalsUpdated });
    }
}

public class RecalculateRequest
{
    public int AssetId { get; set; }
    public string? FinYear { get; set; }
    public DateTime AfterDate { get; set; }
    public string? RejectedTransactionType { get; set; }
}
