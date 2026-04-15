using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/wards")]
[Route("mssql-api/wards")]
public class WardController : ControllerBase
{
    private readonly IWardService _svc;
    public WardController(IWardService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _svc.GetAllAsync();
        return Ok(items.Select(x => (object)new { id = x.Ward_Id, description = x.WardDescription }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
