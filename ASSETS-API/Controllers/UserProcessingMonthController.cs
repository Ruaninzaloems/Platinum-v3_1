using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/user-processing-months")]
[Route("mssql-api/user-processing-months")]
public class UserProcessingMonthController : ControllerBase
{
    private readonly IUserProcessingMonthService _svc;
    public UserProcessingMonthController(IUserProcessingMonthService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? userId) =>
        Ok(await _svc.GetAllAsync(userId));

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrent([FromQuery] int userId)
    {
        var item = await _svc.GetCurrentForUserAsync(userId);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("current")]
    public async Task<IActionResult> SetCurrent([FromQuery] int userId, [FromBody] Dictionary<string, object?> body)
    {
        try
        {
            body["userId"] = userId;
            var id = await _svc.CreateAsync(body);
            return Ok(new { id });
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> body)
    {
        try
        {
            var id = await _svc.CreateAsync(body);
            return Ok(new { id });
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> body)
    {
        try
        {
            var updated = await _svc.UpdateAsync(id, body);
            return updated ? Ok(new { updated = true }) : NotFound();
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }
}
