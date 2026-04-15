using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/commodities")]
[Route("mssql-api/commodities")]
public class CommodityController : ControllerBase
{
    private readonly ICommodityService _svc;
    public CommodityController(ICommodityService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _svc.GetAllAsync();
        return Ok(items.Select(x => (object)new { commodityId = x.Commodity_ID, commodityDesc = x.CommodityDesc }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
