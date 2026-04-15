using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/scm-invoices")]
[Route("mssql-api/scm-invoices")]
public class ScmInvoiceController : ControllerBase
{
    private readonly IScmInvoiceService _svc;
    public ScmInvoiceController(IScmInvoiceService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? contractId, [FromQuery] string? finYear) =>
        Ok(await _svc.GetAllAsync(contractId, finYear));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
