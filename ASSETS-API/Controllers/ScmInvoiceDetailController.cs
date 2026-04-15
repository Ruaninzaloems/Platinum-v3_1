using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/scm-invoice-details")]
[Route("mssql-api/scm-invoice-details")]
public class ScmInvoiceDetailController : ControllerBase
{
    private readonly IScmInvoiceDetailService _svc;
    public ScmInvoiceDetailController(IScmInvoiceDetailService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? invoiceId) =>
        Ok(await _svc.GetAllAsync(invoiceId));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
