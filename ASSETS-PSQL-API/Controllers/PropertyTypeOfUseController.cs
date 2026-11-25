using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/property-types-of-use")]
public class PropertyTypeOfUseController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public PropertyTypeOfUseController(DbConnectionFactory db) => _db = db;

    private const string SelectColumns = @"
        SELECT ""PropertyTypeOfUse_ID""  AS ""propertyTypeOfUseId"",
               ""Description""           AS ""description"",
               ""Enabled""               AS ""enabled"",
               ""DateCaptured""          AS ""dateCaptured"",
               ""CapturerID""            AS ""capturerId"",
               ""DateModified""          AS ""dateModified"",
               ""ModifierID""            AS ""modifierId"",
               ""ZoneCode""              AS ""zoneCode""
        FROM ""Const_PropertyTypeOfUse""";

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(SelectColumns + @" ORDER BY ""Description""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectColumns + @" WHERE ""PropertyTypeOfUse_ID"" = @id", new { id });
        return item is null ? NotFound() : Ok(item);
    }
}
