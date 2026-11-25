using Microsoft.AspNetCore.Mvc;
using AssetManagement.Models;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/led-general-ledger")]
public class LedGeneralLedgerController : ControllerBase
{
    private readonly LedGeneralLedgerService _service;

    public LedGeneralLedgerController(LedGeneralLedgerService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear = null, [FromQuery] int? processingMonth = null)
    {
        var rows = await _service.GetAllAsync(finYear, processingMonth);
        return Ok(rows);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] LedGlCreateRequest req)
    {
        await _service.CreateAsync(req);
        return Ok();
    }
}
