using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/scm-contracts")]
[Route("mssql-api/scm-contracts")]
public class ScmContractController : ControllerBase
{
    private readonly IScmContractService _svc;
    public ScmContractController(IScmContractService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound(new { error = "Contract not found" }) : Ok(item);
    }

    [HttpGet("{id:int}/unbundling-items")]
    public async Task<IActionResult> GetUnbundlingItems(int id) =>
        Ok(await _svc.GetUnbundlingItemsAsync(id));
}
