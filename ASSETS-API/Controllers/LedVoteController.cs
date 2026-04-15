using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/led-votes")]
[Route("mssql-api/led-votes")]
public class LedVoteController : ControllerBase
{
    private readonly ILedVoteService _svc;
    public LedVoteController(ILedVoteService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear) =>
        Ok(await _svc.GetAllAsync(finYear));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
