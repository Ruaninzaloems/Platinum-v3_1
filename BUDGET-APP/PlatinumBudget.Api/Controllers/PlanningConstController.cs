using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.DTOs.Planning;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanningConstController : ControllerBase
{
    private readonly PlanningSpService _svc;
    public PlanningConstController(PlanningSpService svc) { _svc = svc; }

    [HttpGet]
    [Route("const-getscoaversionbyfinyear")]
    public async Task<IActionResult> ConstGetScoaVersionByFinYear([FromQuery] ConstGetScoaVersionByFinYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "TablenameActual", request.TablenameActual },
            { "StructureName", request.StructureName }
        };
        var result = await _svc.ExecuteSpAsync("Const_GetScoaVersionByFinYear_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("const-idpleveldescriptionsearch")]
    public async Task<IActionResult> ConstIDPLevelDescriptionSearch([FromQuery] ConstIDPLevelDescriptionSearchRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "financialYear", request.financialYear }
        };
        var result = await _svc.ExecuteSpAsync("Const_IDPLevelDescriptionSearch_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("const-idplevelheadersearch")]
    public async Task<IActionResult> ConstIDPLevelHeaderSearch([FromQuery] ConstIDPLevelHeaderSearchRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "financialYear", request.financialYear }
        };
        var result = await _svc.ExecuteSpAsync("Const_IDPLevelHeaderSearch_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("const-idpnationalkpasearch")]
    public async Task<IActionResult> ConstIDPNationalKPASearch([FromQuery] ConstIDPNationalKPASearchRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "financialYear", request.financialYear }
        };
        var result = await _svc.ExecuteSpAsync("Const_IDPNationalKPASearch_sp", parameters);
        return Ok(result);
    }
}
