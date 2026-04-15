using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/delegations")]
public class DelegationsController : ControllerBase
{
    private readonly IDelegationService _service;

    public DelegationsController(IDelegationService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] string? type, [FromQuery] string? status,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllDelegationsAsync(type, status, page, pageSize);
        return Ok(result);
    }

    [HttpGet("thresholds")]
    public async Task<ActionResult> GetThresholds()
    {
        var result = await _service.GetThresholdsAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(int id)
    {
        var result = await _service.GetDelegationByIdAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] object dto)
    {
        var result = await _service.CreateDelegationAsync(dto);
        return Ok(ApiResponse<object>.Ok(result, "Delegation created"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] object dto)
    {
        var success = await _service.UpdateDelegationAsync(id, dto);
        if (!success)
            return NotFound(ApiResponse.Fail("Delegation not found"));
        return Ok(ApiResponse.Ok("Delegation updated"));
    }

    [HttpPost("{id}/revoke")]
    public async Task<ActionResult> Revoke(int id, [FromBody] object dto)
    {
        var success = await _service.RevokeDelegationAsync(id, dto);
        if (!success)
            return NotFound(ApiResponse.Fail("Delegation not found"));
        return Ok(ApiResponse.Ok("Delegation revoked"));
    }

    [HttpPut("thresholds/{id}")]
    public async Task<ActionResult> UpdateThreshold(int id, [FromBody] object dto)
    {
        var success = await _service.UpdateThresholdAsync(id, dto);
        if (!success)
            return NotFound(ApiResponse.Fail("Threshold not found"));
        return Ok(ApiResponse.Ok("Threshold updated"));
    }

    [HttpGet("validate")]
    public async Task<ActionResult> Validate([FromQuery] int userId, [FromQuery] decimal amount, [FromQuery] string entityType = "Requisition")
    {
        var isValid = await _service.ValidateDelegationAuthorityAsync(userId, amount, entityType);
        return Ok(ApiResponse<object>.Ok(new { isValid, userId, amount, entityType }));
    }
}
