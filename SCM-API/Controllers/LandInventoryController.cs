using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/land-inventory")]
public class LandInventoryController : ControllerBase
{
    private readonly ILandInventoryService _service;

    public LandInventoryController(ILandInventoryService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult<PagedApiResponse<object>>> GetAll([FromQuery] string? search, [FromQuery] int? propertyType, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetPropertiesAsync(search, propertyType, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById(int id)
    {
        var result = await _service.GetPropertyByIdAsync(id);
        if (result == null) return NotFound(ApiResponse.Fail("Not found"));
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] object dto)
    {
        var result = await _service.CreatePropertyAsync(dto);
        return Ok(ApiResponse<object>.Ok(result, "Property created"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] object dto)
    {
        var success = await _service.UpdatePropertyAsync(id, dto);
        if (!success) return NotFound(ApiResponse.Fail("Not found"));
        return Ok(ApiResponse.Ok("Property updated"));
    }

    [HttpGet("{id}/valuations")]
    public async Task<ActionResult<ApiResponse<object>>> GetValuations(int id)
    {
        var result = await _service.GetValuationsAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{id}/leases")]
    public async Task<ActionResult<ApiResponse<object>>> GetLeases(int id)
    {
        var result = await _service.GetLeasesAsync(id);
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("leases")]
    public async Task<ActionResult<ApiResponse<object>>> CreateLease([FromBody] object dto)
    {
        var result = await _service.CreateLeaseAsync(dto);
        return Ok(ApiResponse<object>.Ok(result, "Lease created"));
    }

    [HttpGet("types")]
    public async Task<ActionResult<ApiResponse<object>>> GetTypes()
    {
        var result = await _service.GetPropertyTypesAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }
}
