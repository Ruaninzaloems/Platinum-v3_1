using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/segregation-rules")]
public class SegregationRulesController : ControllerBase
{
    private readonly ISegregationService _service;

    public SegregationRulesController(ISegregationService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var result = await _service.GetAllRulesAsync();
        return Ok(result);
    }

    [HttpGet("validate")]
    public async Task<ActionResult> Validate([FromQuery] int userId, [FromQuery] string entityType,
        [FromQuery] string action, [FromQuery] int entityId)
    {
        var isValid = await _service.ValidateSegregationAsync(userId, entityType, action, entityId);
        return Ok(ApiResponse<object>.Ok(new { isValid, userId, entityType, action, entityId }));
    }
}
