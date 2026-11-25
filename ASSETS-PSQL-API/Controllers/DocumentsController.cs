using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly string _uploadPath;

    public DocumentsController(DbConnectionFactory db, IWebHostEnvironment env)
    {
        _db = db;
        _uploadPath = Path.Combine(env.ContentRootPath, "uploads", "asset-docs");
        if (!Directory.Exists(_uploadPath)) Directory.CreateDirectory(_uploadPath);
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(
        IFormFile file,
        [FromForm] string? entity_type,
        [FromForm] string? entity_id,
        [FromForm] string? description,
        [FromForm] int? assetRegisterItemId,
        [FromForm] string? transactionType)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        var fileName = $"{Guid.NewGuid()}-{file.FileName}";
        var filePath = Path.Combine(_uploadPath, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstAsync<dynamic>(@"
            INSERT INTO ""Asset_Documents"" (""entity_type"", ""entity_id"", ""file_name"", ""file_path"", ""file_size"", ""mime_type"", ""uploaded_by"", ""description"", ""asset_register_item_id"", ""transaction_type"")
            VALUES (@entity_type, @entity_id, @originalName, @fileName, @size, @mimeType, 1, @description, @assetRegisterItemId, @transactionType) RETURNING *",
            new { entity_type, entity_id, originalName = file.FileName, fileName, size = file.Length, mimeType = file.ContentType, description, assetRegisterItemId, transactionType });
        return CreatedAtAction(null, result);
    }

    [HttpGet("by-asset/{assetRegisterItemId:int}")]
    public async Task<IActionResult> GetByAsset(int assetRegisterItemId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT * FROM ""Asset_Documents""
            WHERE ""asset_register_item_id"" = @assetRegisterItemId
            ORDER BY ""uploaded_at"" DESC", new { assetRegisterItemId });
        return Ok(items);
    }

    [HttpGet("{entityType}/{entityId}")]
    public async Task<IActionResult> GetByEntity(string entityType, string entityId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT * FROM ""Asset_Documents""
            WHERE ""entity_type"" = @entityType AND ""entity_id"" = @entityId
            ORDER BY ""uploaded_at"" DESC", new { entityType, entityId });
        return Ok(items);
    }

    [HttpGet("download/{id:int}")]
    public async Task<IActionResult> Download(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var doc = await conn.QueryFirstOrDefaultAsync<dynamic>(@"SELECT * FROM ""Asset_Documents"" WHERE ""id"" = @id", new { id });
        if (doc is null) return NotFound(new { error = "Document not found" });
        var filePath = Path.Combine(_uploadPath, (string)doc.file_path);
        if (!System.IO.File.Exists(filePath)) return NotFound(new { error = "File not found on disk" });
        return PhysicalFile(filePath, (string)doc.mime_type, (string)doc.file_name);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var doc = await conn.QueryFirstOrDefaultAsync<dynamic>(@"SELECT ""file_path"" FROM ""Asset_Documents"" WHERE ""id"" = @id", new { id });
        if (doc is null) return NotFound(new { error = "Not found" });
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_Documents"" WHERE ""id"" = @id", new { id });
        try
        {
            var relPath = (string)(doc.file_path ?? "");
            if (!string.IsNullOrEmpty(relPath))
            {
                var uploadRoot = Path.GetFullPath(_uploadPath);
                var absPath = Path.GetFullPath(Path.Combine(uploadRoot, Path.GetFileName(relPath)));
                if (absPath.StartsWith(uploadRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
                    && System.IO.File.Exists(absPath))
                    System.IO.File.Delete(absPath);
            }
        }
        catch { /* best-effort */ }
        return Ok(new { message = "Document deleted" });
    }
}
