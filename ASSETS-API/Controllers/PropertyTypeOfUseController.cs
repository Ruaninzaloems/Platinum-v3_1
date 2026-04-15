using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/property-types-of-use")]
[Route("mssql-api/property-types-of-use")]
public class PropertyTypeOfUseController : ControllerBase
{
    private readonly IPropertyTypeOfUseService _svc;
    public PropertyTypeOfUseController(IPropertyTypeOfUseService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
