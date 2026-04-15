using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/scm-transfers")]
[Route("mssql-api/scm-transfers")]
public class ScmTransferController : ControllerBase
{
    private readonly IScmTransferService _svc;
    public ScmTransferController(IScmTransferService svc) => _svc = svc;

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
