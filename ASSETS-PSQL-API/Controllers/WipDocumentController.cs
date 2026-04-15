using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/wip-documents")]
public class WipDocumentController : ControllerBase
{
    private static readonly HashSet<string> PdfMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf", "application/x-pdf"
    };

    private readonly DbConnectionFactory _db;
    public WipDocumentController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? wipRegisterId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"
            SELECT ""WIPDocument_ID"" AS ""wipDocumentId"",
                   ""WIPRegister_ID"" AS ""wipRegisterId"",
                   ""DocumentType"" AS ""documentType"",
                   ""DocumentName"" AS ""documentName"",
                   ""MimeType"" AS ""mimeType"",
                   ""FileSizeKB"" AS ""fileSizeKb"",
                   ""DateCaptured"" AS ""dateCaptured""
            FROM ""Asset_WIP_Documents""
            WHERE 1=1";
        var parameters = new DynamicParameters();
        if (wipRegisterId.HasValue)
        {
            sql += @" AND ""WIPRegister_ID"" = @wipRegisterId";
            parameters.Add("wipRegisterId", wipRegisterId.Value);
        }
        sql += @" ORDER BY ""WIPDocument_ID"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        [FromForm] int wipRegisterId,
        [FromForm] string documentType,
        IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        var mimeType = file.ContentType ?? string.Empty;

        if ((documentType == "CompletionCertificate" || documentType == "BillOfQuantities")
            && !PdfMimeTypes.Contains(mimeType))
        {
            return BadRequest(new { error = $"{documentType} must be a PDF file" });
        }

        string fileData;
        using (var ms = new MemoryStream())
        {
            await file.CopyToAsync(ms);
            fileData = Convert.ToBase64String(ms.ToArray());
        }

        var fileSizeKb = (int)Math.Ceiling(file.Length / 1024.0);

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_WIP_Documents""
                (""WIPRegister_ID"", ""DocumentType"", ""DocumentName"", ""FileData"", ""MimeType"", ""FileSizeKB"", ""DateCaptured"", ""CapturerID"")
            VALUES
                (@wipRegisterId, @documentType, @documentName, @fileData, @mimeType, @fileSizeKb, NOW(), 1)
            RETURNING ""WIPDocument_ID""",
            new { wipRegisterId, documentType, documentName = file.FileName, fileData, mimeType, fileSizeKb });

        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""WIPDocument_ID"" AS ""wipDocumentId"", ""WIPRegister_ID"" AS ""wipRegisterId"",
                     ""DocumentType"" AS ""documentType"", ""DocumentName"" AS ""documentName"",
                     ""MimeType"" AS ""mimeType"", ""FileSizeKB"" AS ""fileSizeKb"", ""DateCaptured"" AS ""dateCaptured""
              FROM ""Asset_WIP_Documents"" WHERE ""WIPDocument_ID"" = @id", new { id });
        return Ok(created);
    }

    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> Download(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var doc = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""DocumentName"" AS ""documentName"", ""MimeType"" AS ""mimeType"", ""FileData"" AS ""fileData""
              FROM ""Asset_WIP_Documents"" WHERE ""WIPDocument_ID"" = @id", new { id });
        if (doc is null) return NotFound(new { error = "Document not found" });
        return Ok(doc);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"DELETE FROM ""Asset_WIP_Documents"" WHERE ""WIPDocument_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Document not found" }) : NoContent();
    }
}
