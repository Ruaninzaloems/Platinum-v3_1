using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/unit-of-issues")]
public class UnitOfIssueController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public UnitOfIssueController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT ""UnitOfIssue_ID"" AS ""unitOfIssueId"", ""UnitOfIssueDesc"" AS ""unitOfIssueDesc""
            FROM ""Const_UnitOfIssue""
            ORDER BY ""UnitOfIssueDesc""");
        return Ok(items);
    }
}
