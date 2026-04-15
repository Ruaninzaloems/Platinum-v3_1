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

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""Const_DocumentType"" ORDER BY ""DocumentTypeDesc""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(@"SELECT * FROM ""Const_DocumentType"" WHERE ""DocumentType_ID"" = @id", new { id });
        return item is null ? NotFound() : Ok(item);
    }
}
