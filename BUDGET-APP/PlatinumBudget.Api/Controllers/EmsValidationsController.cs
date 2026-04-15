using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/ems/validations")]
public class EmsValidationsController : ControllerBase
{
    private readonly EmsNTValidationService _svc;

    public EmsValidationsController(EmsNTValidationService svc)
    {
        _svc = svc;
    }

    [HttpPost("run")]
    public async Task<IActionResult> RunValidations([FromBody] RunValidationRequest req)
    {
        var result = await _svc.ValidateBudgetVersionAsync(req.VersionId);
        return Ok(result);
    }

    [HttpGet("run")]
    public async Task<IActionResult> RunValidationsGet([FromQuery] int versionId)
    {
        var result = await _svc.ValidateBudgetVersionAsync(versionId);
        return Ok(result);
    }
}

public class RunValidationRequest
{
    public int VersionId { get; set; }
}
