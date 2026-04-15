using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/ems/virements")]
public class EmsVirementController : ControllerBase
{
    private readonly EmsVirementService _svc;

    public EmsVirementController(EmsVirementService svc)
    {
        _svc = svc;
    }

    [HttpGet]
    public async Task<IActionResult> GetVirements([FromQuery] string? finYear)
    {
        var result = await _svc.GetVirementsAsync(finYear);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetVirement(int id)
    {
        var result = await _svc.GetVirementDetailAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateVirement([FromBody] EmsCreateVirementRequest req)
    {
        var result = await _svc.CreateVirementAsync(req);
        return CreatedAtAction(nameof(GetVirement), new { id = result.VirementId }, result);
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] EmsActionRequest req)
    {
        var (success, message) = await _svc.ApproveVirementAsync(id, req.UserId, req.Comment);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] EmsActionRequest req)
    {
        var (success, message) = await _svc.RejectVirementAsync(id, req.UserId, req.Comment ?? "No reason provided");
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    [HttpGet("{id:int}/next-approver")]
    public async Task<IActionResult> GetNextApprover(int id)
    {
        var detail = await _svc.GetVirementDetailAsync(id);
        var next = detail?.ApprovalChain.FirstOrDefault(s => s.Status == "Pending");
        return Ok(next);
    }
}

public class EmsActionRequest
{
    public int UserId { get; set; } = 1;
    public string? Comment { get; set; }
}
