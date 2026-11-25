using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/document-types")]
public class DocumentTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public DocumentTypeController(DbConnectionFactory db) => _db = db;

    private const string SelectColumns = @"
        SELECT ""DocumentType_ID""   AS ""documentTypeId"",
               ""DocumentTypeDesc""  AS ""documentTypeDesc"",
               ""Enabled""           AS ""enabled"",
               ""CapturerID""        AS ""capturerId"",
               ""DateCaptured""      AS ""dateCaptured"",
               ""ModuleID""          AS ""moduleId""
        FROM ""Asset_DocumentType""";

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(SelectColumns + @" ORDER BY ""DocumentTypeDesc""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectColumns + @" WHERE ""DocumentType_ID"" = @id", new { id });
        return item is null ? NotFound() : Ok(item);
    }
}
