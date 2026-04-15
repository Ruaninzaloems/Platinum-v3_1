using Microsoft.AspNetCore.Mvc;
using MssqlApi.Services;

namespace MssqlApi.Controllers;

[ApiController]
[Route("api/const-funding-sources")]
[Route("mssql-api/const-funding-sources")]
public class ConstFundingSourceController : ControllerBase
{
    private readonly IConstFundingSourceService _svc;
    public ConstFundingSourceController(IConstFundingSourceService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear) =>
        Ok(await _svc.GetAllAsync(finYear));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _svc.GetByIdAsync(id);
        return item is null ? NotFound(new { error = "Funding source not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ConstFundingSourceModel model)
    {
        if (string.IsNullOrWhiteSpace(model.FundingSourceDesc))
            return BadRequest(new { error = "Funding source description is required" });
        var id = await _svc.CreateAsync(model.FundingSourceDesc, model.Enabled, model.FinYear, model.PreviousReferenceId);
        return Ok(new { fundingSourceId = id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ConstFundingSourceModel model)
    {
        if (string.IsNullOrWhiteSpace(model.FundingSourceDesc))
            return BadRequest(new { error = "Funding source description is required" });
        return await _svc.UpdateAsync(id, model.FundingSourceDesc, model.Enabled, model.FinYear)
            ? Ok(new { success = 1 }) : NotFound(new { error = "Not found" });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        await _svc.DeleteAsync(id) ? Ok(new { success = 1 }) : NotFound(new { error = "Not found" });
}

public class ConstFundingSourceModel
{
    public string FundingSourceDesc { get; set; } = "";
    public int Enabled { get; set; } = 1;
    public string? FinYear { get; set; }
    public int? PreviousReferenceId { get; set; }
}
