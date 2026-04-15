using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/inv-transfers")]
[Route("mssql-api/inv-transfers")]
public class InvTransferController : ControllerBase
{
    private readonly IInvTransferService _svc;
    public InvTransferController(IInvTransferService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear)
    {
        try { return Ok(await _svc.GetAllAsync(finYear)); }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var item = await _svc.GetByIdAsync(id);
            return item is null ? NotFound() : Ok(item);
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        try { return Ok(await _svc.GetPendingAsync()); }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }
}
