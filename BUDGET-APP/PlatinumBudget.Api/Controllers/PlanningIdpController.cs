using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.DTOs.Planning;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanningIdpController : ControllerBase
{
    private readonly PlanningSpService _svc;
    public PlanningIdpController(PlanningSpService svc) { _svc = svc; }

    [HttpGet]
    [Route("idp-getidplowestlevelitems")]
    public async Task<IActionResult> IDPGetIDPLowestLevelItems([FromQuery] IDPGetIDPLowestLevelItemsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("IDP_GetIDPLowestLevelItems_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("idp-getitempathfromroot")]
    public async Task<IActionResult> IDPGetItemPathFromRoot([FromQuery] IDPGetItemPathFromRootRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "itemID", request.itemID }
        };
        var result = await _svc.ExecuteSpAsync("IDP_GetItemPathFromRoot_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("idp-structure")]
    public async Task<IActionResult> IDPStructure([FromQuery] IDPStructureRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "financialYear", request.financialYear }
        };
        var result = await _svc.ExecuteSpAsync("IDP_Structure_sp", parameters);
        return Ok(result);
    }
}
