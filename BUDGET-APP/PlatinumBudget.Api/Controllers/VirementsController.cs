using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VirementsController : ControllerBase
{
    private readonly VirementService _service;
    private readonly BudgetDbContext _db;

    public VirementsController(VirementService service, BudgetDbContext db)
    {
        _service = service;
        _db = db;
    }

    [HttpGet("preflight")]
    public async Task<IActionResult> Preflight([FromQuery] string finYear)
    {
        if (string.IsNullOrWhiteSpace(finYear))
            return BadRequest("finYear is required");

        var budgetApproved = await _db.Plan_MTREFApproval
            .AnyAsync(x => x.FinancialYear == finYear && x.IsInitializeIDPMTREF == true);

        var idpApproved = await _db.Plan_IDPMTREFApproval
            .AnyAsync(x => x.FinancialYear == finYear && x.IsInitializeIDPMTREF == true);

        var messages = new List<string>();
        if (!budgetApproved)
            messages.Add($"The budget (MTREF) has not been approved for {finYear}.");
        if (!idpApproved)
            messages.Add($"The IDP has not been approved for {finYear}.");

        return Ok(new
        {
            budgetApproved,
            idpApproved,
            passed = budgetApproved && idpApproved,
            message = messages.Count > 0 ? string.Join(" ", messages) : (string?)null
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? versionId, [FromQuery] string? status)
    {
        VirementStatus? vStatus = Enum.TryParse<VirementStatus>(status, true, out var s) ? s : null;
        return Ok(await _service.GetAllAsync(versionId, vStatus));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var detail = await _service.GetDetailAsync(id);
        return detail == null ? NotFound() : Ok(detail);
    }

    [HttpGet("{id}/approval-chain")]
    public async Task<IActionResult> GetApprovalChain(int id)
    {
        return Ok(await _service.GetApprovalChainAsync(id));
    }

    [HttpGet("budget-summary")]
    public async Task<IActionResult> GetBudgetSummary(
        [FromQuery] int budgetVersionId, [FromQuery] int itemId, [FromQuery] int fundId,
        [FromQuery] int functionId, [FromQuery] int projectId, [FromQuery] int regionId,
        [FromQuery] int costingId, [FromQuery] int mscId)
    {
        var summary = await _service.GetBudgetSummaryAsync(budgetVersionId, itemId, fundId, functionId, projectId, regionId, costingId, mscId);
        return Ok(summary);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVirementDto dto)
    {
        var result = await _service.CreateAsync(dto, "system");
        return Ok(result);
    }

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> Submit(int id, [FromBody] ApprovalActionDto dto)
    {
        var result = await _service.SubmitAsync(id, dto);
        return result == null ? BadRequest("Virement not found or not in Draft status") : Ok(result);
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApprovalActionDto dto)
    {
        var result = await _service.ApproveAtLevelAsync(id, dto);
        return result == null ? BadRequest("Virement not found or not in approvable status") : Ok(result);
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] ApprovalActionDto dto)
    {
        var result = await _service.RejectAsync(id, dto);
        return result == null ? BadRequest("Virement not found or not in approvable status") : Ok(result);
    }

    [HttpPost("{id}/return")]
    public async Task<IActionResult> Return(int id, [FromBody] ApprovalActionDto dto)
    {
        var result = await _service.ReturnAsync(id, dto);
        return result == null ? BadRequest("Virement not found or not in returnable status") : Ok(result);
    }

    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] CreateVirementDto dto)
    {
        var result = await _service.ValidateAgainstPolicyAsync(dto);
        return Ok(result);
    }
}
