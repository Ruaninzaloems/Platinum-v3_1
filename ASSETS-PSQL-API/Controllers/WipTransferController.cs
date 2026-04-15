using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/wip-transfers")]
public class WipTransferController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly InternalApiClient _internalApi;

    public WipTransferController(DbConnectionFactory db, InternalApiClient internalApi)
    {
        _db = db;
        _internalApi = internalApi;
    }

    [HttpGet("financial-years")]
    public async Task<IActionResult> GetFinancialYears()
    {
        var years = await _internalApi.GetAsync<List<object>>("api/plan-project-financial-years");
        return Ok(years ?? new List<object>());
    }

    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects([FromQuery] string finYear)
    {
        if (string.IsNullOrWhiteSpace(finYear))
            return BadRequest(new { error = "finYear query parameter is required" });
        var projects = await _internalApi.GetAsync<List<object>>($"api/plan-projects?finYear={Uri.EscapeDataString(finYear)}");
        return Ok(projects ?? new List<object>());
    }

    [HttpGet("scoa-items")]
    public async Task<IActionResult> GetScoaItems([FromQuery] int projectId)
    {
        if (projectId <= 0)
            return BadRequest(new { error = "projectId query parameter is required" });
        var items = await _internalApi.GetAsync<List<object>>($"api/plan-project-items/scoa?projectId={projectId}");
        return Ok(items ?? new List<object>());
    }

    [HttpGet("validate-asset")]
    public async Task<IActionResult> ValidateAsset([FromQuery] int assetId)
    {
        if (assetId <= 0)
            return Ok(new { valid = false, error = "Asset ID must be a positive number" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var asset = await conn.QueryFirstOrDefaultAsync(@"
            SELECT ""AssetRegisterItem_ID"" AS ""assetRegisterItemId"",
                   ""Description"" AS ""description""
            FROM ""Asset_Register_Items""
            WHERE ""AssetRegisterItem_ID"" = @assetId",
            new { assetId });
        if (asset == null)
            return Ok(new { valid = false, error = "Asset ID " + assetId + " not found" });
        return Ok(new { valid = true, assetRegisterItemId = ((dynamic)asset).assetRegisterItemId, description = ((dynamic)asset).description });
    }
}
