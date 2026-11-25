using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/budget-approval")]
public class BudgetApprovalController : ControllerBase
{
    private readonly BudgetDbContext _db;
    public BudgetApprovalController(BudgetDbContext db) { _db = db; }

    [HttpPost("approve-draft")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ApproveDraft(
        [FromForm] string financialYear,
        [FromForm] string action,
        IFormFile? file)
    {
        var record = new CouncilBudgetApproval
        {
            FinancialYear = financialYear,
            ApprovalType = "Draft",
            Action = action,
            FileName = file?.FileName,
            SubmittedOn = DateTime.UtcNow,
            SubmittedBy = "System Admin"
        };

        _db.CouncilBudgetApprovals.Add(record);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = record.Id,
            message = $"Draft budget {action.ToLower()}d successfully.",
            financialYear,
            action
        });
    }

    [HttpPost("approve-final")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ApproveFinal(
        [FromForm] string financialYear,
        [FromForm] bool approved,
        [FromForm] string? versionName,
        [FromForm] string? comments,
        [FromForm] string? councilApprovedDate,
        IFormFile? file)
    {
        DateTime? approvedDate = null;
        if (!string.IsNullOrWhiteSpace(councilApprovedDate) &&
            DateTime.TryParse(councilApprovedDate, out var parsedDate))
            approvedDate = parsedDate;

        var record = new CouncilBudgetApproval
        {
            FinancialYear = financialYear,
            ApprovalType = "Final",
            Action = approved ? "Approve" : "None",
            Approved = approved,
            VersionName = versionName,
            Comments = comments,
            CouncilApprovedDate = approvedDate,
            FileName = file?.FileName,
            SubmittedOn = DateTime.UtcNow,
            SubmittedBy = "System Admin"
        };

        _db.CouncilBudgetApprovals.Add(record);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = record.Id,
            message = approved
                ? "Budget approved successfully."
                : "Budget submission recorded.",
            financialYear
        });
    }

    [HttpGet("approve-draft/history")]
    public IActionResult GetDraftHistory()
    {
        var records = _db.CouncilBudgetApprovals
            .Where(r => r.ApprovalType == "Draft")
            .OrderByDescending(r => r.SubmittedOn)
            .Select(r => new
            {
                r.Id,
                r.FinancialYear,
                r.Action,
                r.FileName,
                r.SubmittedOn,
                r.SubmittedBy
            })
            .ToList();
        return Ok(records);
    }
}
