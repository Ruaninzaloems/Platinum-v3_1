using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BudgetVersionsController : ControllerBase
{
    private readonly BudgetVersionService _service;

    public BudgetVersionsController(BudgetVersionService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? financialYearId, [FromQuery] string? type, [FromQuery] string? status)
    {
        BudgetVersionType? vType = Enum.TryParse<BudgetVersionType>(type, true, out var t) ? t : null;
        BudgetVersionStatus? vStatus = Enum.TryParse<BudgetVersionStatus>(status, true, out var s) ? s : null;
        return Ok(await _service.GetAllAsync(financialYearId, vType, vStatus));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBudgetVersionDto dto)
    {
        var version = await _service.CreateAsync(dto, "system");
        return CreatedAtAction(nameof(GetById), new { id = version.Id }, version);
    }

    [HttpPost("{id}/submit-approval")]
    public async Task<IActionResult> SubmitApproval(int id, [FromBody] ApprovalActionDto dto)
    {
        var result = await _service.SubmitForApprovalAsync(id, dto);
        return result == null ? BadRequest("Version not found or not in Draft status") : Ok(result);
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApprovalActionDto dto)
    {
        var result = await _service.ApproveAsync(id, dto);
        return result == null ? BadRequest("Version not found or not in Pending status") : Ok(result);
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] ApprovalActionDto dto)
    {
        var result = await _service.RejectAsync(id, dto);
        return result == null ? BadRequest("Version not found or not in Pending status") : Ok(result);
    }

    [HttpPost("{id}/lock")]
    public async Task<IActionResult> Lock(int id, [FromBody] ApprovalActionDto dto)
    {
        var result = await _service.LockAsync(id, dto);
        return result == null ? BadRequest("Version not found or not in Approved status") : Ok(result);
    }

    [HttpPost("{id}/unlock-request")]
    public async Task<IActionResult> UnlockRequest(int id, [FromBody] ApprovalActionDto dto)
    {
        var result = await _service.UnlockRequestAsync(id, dto);
        return result == null ? BadRequest("Version not found or not in Locked status") : Ok(result);
    }

    [HttpPost("{id}/activate")]
    public async Task<IActionResult> Activate(int id, [FromBody] ApprovalActionDto dto)
    {
        var result = await _service.ActivateAsync(id, dto);
        return result == null ? BadRequest("Version not found or not in Locked status") : Ok(result);
    }

    [HttpPost("{id}/clone")]
    public async Task<IActionResult> Clone(int id, [FromBody] CloneBudgetVersionDto dto)
    {
        var result = await _service.CloneAsync(id, dto, "system");
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("{id}/diff/{compareId}")]
    public async Task<IActionResult> Diff(int id, int compareId)
    {
        var result = await _service.GetDiffAsync(id, compareId);
        return result == null ? NotFound() : Ok(result);
    }
}
