using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/documents")]
public class DocumentController : ControllerBase
{
    private readonly IDocumentService _service;

    public DocumentController(IDocumentService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult<PagedApiResponse<object>>> GetAll([FromQuery] string? entityType, [FromQuery] int? entityId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetAllAsync(entityType, entityId, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse.Fail("Document not found"));
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Upload([FromBody] object dto)
    {
        var result = await _service.UploadAsync(dto);
        return Ok(ApiResponse<object>.Ok(result, "Document uploaded"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success) return NotFound(ApiResponse.Fail("Document not found"));
        return Ok(ApiResponse.Ok("Document deleted"));
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var data = await _service.DownloadAsync(id);
        if (data == null) return NotFound();
        return File(data, "application/octet-stream");
    }

    [HttpGet("types")]
    public async Task<ActionResult<ApiResponse<object>>> GetTypes()
    {
        var result = await _service.GetDocumentTypesAsync();
        return Ok(ApiResponse<object>.Ok(result));
    }
}
