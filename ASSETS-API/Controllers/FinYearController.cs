using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/fin-years")]
[Route("mssql-api/fin-years")]
public class FinYearController : ControllerBase
{
    private readonly IFinYearService _svc;
    public FinYearController(IFinYearService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetAllAsync());

    [HttpGet("default")]
    public async Task<IActionResult> GetDefault()
    {
        var item = await _svc.GetDefaultAsync();
        return item is null ? NotFound(new { error = "No default financial year configured" }) : Ok(item);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
