using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;
using System.Text.Json;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/scm-config")]
public class ScmConfigController : ControllerBase
{
    private readonly IScmConfigService _scmConfigService;

    public ScmConfigController(IScmConfigService scmConfigService)
    {
        _scmConfigService = scmConfigService;
    }

    [HttpGet]
    public async Task<ActionResult> GetConfig()
    {
        var config = await _scmConfigService.GetConfigAsync();
        return Ok(ApiResponse<object>.Ok(config));
    }

    [HttpPut("thresholds")]
    public async Task<ActionResult> UpdateThresholds([FromBody] JsonElement dto)
    {
        var boundaries = new List<dynamic>();
        if (dto.TryGetProperty("boundaries", out JsonElement boundariesEl) && boundariesEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in boundariesEl.EnumerateArray())
            {
                boundaries.Add(ParseJsonToDynamic(item));
            }
        }

        var updated = await _scmConfigService.UpdateBoundariesAsync(boundaries);
        return Ok(ApiResponse<object>.Ok(new { boundaries = updated }));
    }

    [HttpPut("preference-points")]
    public async Task<ActionResult> UpdatePreferencePoints([FromBody] JsonElement dto)
    {
        var thresholds = new List<dynamic>();
        if (dto.TryGetProperty("thresholds", out JsonElement thresholdsEl) && thresholdsEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in thresholdsEl.EnumerateArray())
            {
                thresholds.Add(ParseJsonToDynamic(item));
            }
        }

        var updated = await _scmConfigService.UpdatePreferencePointsAsync(thresholds);
        return Ok(ApiResponse<object>.Ok(new { thresholds = updated }));
    }

    [HttpPut("special-methods")]
    public async Task<ActionResult> UpdateSpecialMethods([FromBody] JsonElement dto)
    {
        var methods = new List<dynamic>();
        if (dto.TryGetProperty("methods", out JsonElement methodsEl) && methodsEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in methodsEl.EnumerateArray())
            {
                methods.Add(ParseJsonToDynamic(item));
            }
        }

        var updated = await _scmConfigService.UpdateSpecialMethodsAsync(methods);
        return Ok(ApiResponse<object>.Ok(new { methods = updated }));
    }

    [HttpGet("route")]
    public async Task<ActionResult> GetProcurementRoute([FromQuery] decimal value)
    {
        var route = await _scmConfigService.GetProcurementRouteAsync(value);
        if (route == null)
            return Ok(ApiResponse<object>.Ok(new { matched = false, message = $"No process boundary found for value R{value:N2}" }));
        return Ok(ApiResponse<object>.Ok(new { matched = true, route }));
    }

    [HttpGet("boundaries")]
    public async Task<ActionResult> GetBoundaries()
    {
        var boundaries = await _scmConfigService.GetProcessBoundariesAsync();
        return Ok(ApiResponse<object>.Ok(new { boundaries }));
    }

    [HttpPost("validate-route")]
    public async Task<ActionResult> ValidateRoute([FromBody] JsonElement dto)
    {
        decimal value = 0;
        string method = "";
        if (dto.TryGetProperty("value", out var valEl) && valEl.ValueKind == JsonValueKind.Number)
            value = valEl.GetDecimal();
        else
            return BadRequest(ApiResponse.Fail("'value' must be a numeric field"));
        if (dto.TryGetProperty("method", out var methodEl) && methodEl.ValueKind == JsonValueKind.String)
            method = methodEl.GetString() ?? "";
        else
            return BadRequest(ApiResponse.Fail("'method' must be a string field"));
        var result = await _scmConfigService.ValidateRouteAsync(value, method);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPut("anti-split")]
    public async Task<ActionResult> UpdateAntiSplit([FromBody] JsonElement dto)
    {
        var settings = ParseJsonToDynamic(dto);
        var updated = await _scmConfigService.UpdateAntiSplitAsync(settings);
        return Ok(ApiResponse<object>.Ok(new { settings = updated }));
    }

    private static dynamic ParseJsonToDynamic(JsonElement element)
    {
        var dict = new System.Dynamic.ExpandoObject() as IDictionary<string, object?>;
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in element.EnumerateObject())
            {
                dict[prop.Name] = GetJsonValue(prop.Value);
            }
        }
        return dict;
    }

    private static object? GetJsonValue(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.TryGetInt32(out int i) ? i : element.GetDecimal(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            JsonValueKind.Array => element.EnumerateArray().Select(GetJsonValue).ToList(),
            JsonValueKind.Object => ParseJsonToDynamic(element),
            _ => element.ToString()
        };
    }
}
