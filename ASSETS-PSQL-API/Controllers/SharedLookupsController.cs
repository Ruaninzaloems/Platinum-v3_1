using Dapper;
using Microsoft.AspNetCore.Mvc;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

// Intentional design: all lightweight read-only lookups (location hierarchy,
// HR, commodities, financial reference data) are consolidated here rather than
// split into per-entity controllers. This keeps the PSQL API lean for data
// that is owned by external systems and is effectively read-only from this API.
// Route paths match the psqlRoute values in database-toggle.service.ts so that
// dropdowns resolve correctly in PostgreSQL mode and SQL Server mode alike.
[ApiController]
public class SharedLookupsController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public SharedLookupsController(DbConnectionFactory db) => _db = db;

    [HttpGet("api/departments")]
    public async Task<IActionResult> GetDepartments()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT ""Department_ID"" AS ""id"", ""DepartmentDesc"" AS ""description"" FROM ""Const_Department"" WHERE ""Enabled"" = TRUE ORDER BY ""DepartmentDesc""");
        return Ok(items);
    }

    [HttpGet("api/divisions")]
    public async Task<IActionResult> GetDivisions([FromQuery] int? departmentId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Division_ID"" AS ""id"", ""DivisionDesc"" AS ""description"", ""DepartmentID"" AS ""departmentId"" FROM ""Const_Division"" WHERE ""Enabled"" = TRUE";
        if (departmentId.HasValue) sql += @" AND ""DepartmentID"" = @departmentId";
        sql += @" ORDER BY ""DivisionDesc""";
        var items = await conn.QueryAsync<dynamic>(sql, new { departmentId });
        return Ok(items);
    }

    [HttpGet("api/towns")]
    public async Task<IActionResult> GetTowns()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT ""Town_ID"" AS ""id"", ""Town"" AS ""description"" FROM ""Const_Town"" WHERE ""Enabled"" = 1 ORDER BY ""Town""");
        return Ok(items);
    }

    [HttpGet("api/suburbs")]
    public async Task<IActionResult> GetSuburbs([FromQuery] int? townId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Suburb_ID"" AS ""id"", ""SuburbName"" AS ""description"", ""TownID"" AS ""townId"" FROM ""Const_Suburb"" WHERE ""Enabled"" = 1";
        if (townId.HasValue) sql += @" AND ""TownID"" = @townId";
        sql += @" ORDER BY ""SuburbName""";
        var items = await conn.QueryAsync<dynamic>(sql, new { townId });
        return Ok(items);
    }

    [HttpGet("api/wards")]
    public async Task<IActionResult> GetWards()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT ""Ward_Id"" AS ""id"", ""WardDescription"" AS ""description"" FROM ""Const_Ward"" WHERE ""Enabled"" = 1 ORDER BY ""WardDescription""");
        return Ok(items);
    }

    [HttpGet("api/streets")]
    public async Task<IActionResult> GetStreets([FromQuery] int? suburbId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Street_ID"" AS ""id"", ""StreetName"" AS ""description"", ""SuburbID"" AS ""suburbId"" FROM ""Const_Street"" WHERE ""Enabled"" = 1";
        if (suburbId.HasValue) sql += @" AND ""SuburbID"" = @suburbId";
        sql += @" ORDER BY ""StreetName""";
        var items = await conn.QueryAsync<dynamic>(sql, new { suburbId });
        return Ok(items);
    }

    [HttpGet("api/buildings")]
    public async Task<IActionResult> GetBuildings([FromQuery] int? streetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Building_ID"" AS ""id"", ""BuildingDesc"" AS ""description"", ""StreetID"" AS ""streetId"" FROM ""Const_Building"" WHERE COALESCE(""Enabled"", 1) = 1";
        if (streetId.HasValue) sql += @" AND ""StreetID"" = @streetId";
        sql += @" ORDER BY ""BuildingDesc""";
        var items = await conn.QueryAsync<dynamic>(sql, new { streetId });
        return Ok(items);
    }

    [HttpGet("api/floors")]
    public async Task<IActionResult> GetFloors([FromQuery] int? buildingId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Floor_ID"" AS ""id"", ""FloorDesc"" AS ""description"", ""BuildingID"" AS ""buildingId"" FROM ""Const_Floor"" WHERE COALESCE(""Enabled"", 1) = 1";
        if (buildingId.HasValue) sql += @" AND ""BuildingID"" = @buildingId";
        sql += @" ORDER BY ""FloorDesc""";
        var items = await conn.QueryAsync<dynamic>(sql, new { buildingId });
        return Ok(items);
    }

    [HttpGet("api/rooms")]
    public async Task<IActionResult> GetRooms([FromQuery] int? floorId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Room_ID"" AS ""id"", ""RoomDesc"" AS ""description"", ""FloorID"" AS ""floorId"" FROM ""Const_Room"" WHERE COALESCE(""Enabled"", 1) = 1";
        if (floorId.HasValue) sql += @" AND ""FloorID"" = @floorId";
        sql += @" ORDER BY ""RoomDesc""";
        var items = await conn.QueryAsync<dynamic>(sql, new { floorId });
        return Ok(items);
    }

    [HttpGet("api/employees")]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] string? search = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var whereSql = @" WHERE ""Enabled"" = TRUE";
        if (!string.IsNullOrWhiteSpace(search))
            whereSql += @" AND (""Surname"" ILIKE @search OR ""FirstName"" ILIKE @search OR ""EmpCode"" ILIKE @search)";

        var selectSql = @"
            SELECT ""Employee_ID"" AS ""employeeId"", ""FirstName"" AS ""firstName"", ""Surname"" AS ""surname"", ""EmpCode"" AS ""empCode""
            FROM ""Payroll_Employee""" + whereSql + @" ORDER BY ""Surname"", ""FirstName""";

        var queryParams = new { search = $"%{search}%" };

        if (page.HasValue || pageSize.HasValue)
        {
            int p  = Math.Max(1, page     ?? 1);
            int ps = Math.Max(1, pageSize ?? 50);

            var countSql = @"SELECT COUNT(*) FROM ""Payroll_Employee""" + whereSql;
            var totalCount = await conn.QuerySingleAsync<int>(countSql, queryParams);

            var pagedSql = selectSql + " LIMIT @ps OFFSET @offset";
            var items = await conn.QueryAsync<dynamic>(pagedSql, new { search = $"%{search}%", ps, offset = (p - 1) * ps });

            return Ok(new { totalCount, page = p, pageSize = ps, items });
        }

        var allItems = await conn.QueryAsync<dynamic>(selectSql, queryParams);
        return Ok(allItems);
    }

    [HttpGet("api/vendors")]
    public async Task<IActionResult> GetVendors(
        [FromQuery] string? search = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var where = string.IsNullOrWhiteSpace(search) ? "" : @" AND ""VendorName"" ILIKE @search";
        if (page.HasValue || pageSize.HasValue)
        {
            int p  = Math.Max(1, page     ?? 1);
            int ps = Math.Max(1, pageSize ?? 50);
            var total = await conn.QuerySingleAsync<int>($@"SELECT COUNT(*) FROM ""Cons_Vendor"" WHERE 1=1{where}", new { search = $"%{search}%" });
            var items = await conn.QueryAsync<dynamic>($@"
                SELECT ""Vendor_ID"" AS ""vendorId"", ""VendorName"" AS ""vendorName""
                FROM ""Cons_Vendor""
                WHERE 1=1{where}
                ORDER BY ""VendorName""
                LIMIT @ps OFFSET @offset", new { search = $"%{search}%", ps, offset = (p - 1) * ps });
            return Ok(new { totalCount = total, page = p, pageSize = ps, items });
        }
        var all = await conn.QueryAsync<dynamic>($@"
            SELECT ""Vendor_ID"" AS ""vendorId"", ""VendorName"" AS ""vendorName""
            FROM ""Cons_Vendor""
            WHERE 1=1{where}
            ORDER BY ""VendorName""", new { search = $"%{search}%" });
        return Ok(all);
    }

    [HttpGet("api/commodities")]
    public async Task<IActionResult> GetCommodities(
        [FromQuery] string? search = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var where = string.IsNullOrWhiteSpace(search) ? "" : @" AND ""CommodityDesc"" ILIKE @search";
        if (page.HasValue || pageSize.HasValue)
        {
            int p  = Math.Max(1, page     ?? 1);
            int ps = Math.Max(1, pageSize ?? 50);
            var total = await conn.QuerySingleAsync<int>($@"SELECT COUNT(*) FROM ""Inven_Commodity"" WHERE 1=1{where}", new { search = $"%{search}%" });
            var items = await conn.QueryAsync<dynamic>($@"
                SELECT ""Commodity_ID"" AS ""commodityId"", ""CommodityDesc"" AS ""commodityDesc"",
                       ""CommodityExtendedDesc"" AS ""commodityExtendedDesc""
                FROM ""Inven_Commodity""
                WHERE 1=1{where}
                ORDER BY ""CommodityDesc""
                LIMIT @ps OFFSET @offset", new { search = $"%{search}%", ps, offset = (p - 1) * ps });
            return Ok(new { totalCount = total, page = p, pageSize = ps, items });
        }
        var all = await conn.QueryAsync<dynamic>($@"
            SELECT ""Commodity_ID"" AS ""commodityId"", ""CommodityDesc"" AS ""commodityDesc"",
                   ""CommodityExtendedDesc"" AS ""commodityExtendedDesc""
            FROM ""Inven_Commodity""
            WHERE 1=1{where}
            ORDER BY ""CommodityDesc""", new { search = $"%{search}%" });
        return Ok(all);
    }

    [HttpGet("api/fin-years")]
    public async Task<IActionResult> GetFinYears()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync(@"
            SELECT f.""ID"" AS id, f.""FinYear"" AS finYear, f.""CurrentIndex"" AS currentIndex,
                   f.""ActiveFinYear"" AS activeFinYear,
                   CASE WHEN f.""CurrentIndex"" = 0 THEN TRUE ELSE FALSE END AS isDefault
            FROM ""Const_FinYearWithIndex_sys"" f
            WHERE f.""ActiveFinYear"" = (
                SELECT ""ActiveFinYear"" FROM ""Const_FinYearWithIndex_sys""
                WHERE ""CurrentIndex"" = 0 ORDER BY ""ID"" DESC LIMIT 1
            )
            ORDER BY f.""CurrentIndex""");
        return Ok(rows);
    }

    [HttpGet("api/fin-years/default")]
    public async Task<IActionResult> GetDefaultFinYear()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var row = await conn.QueryFirstOrDefaultAsync(@"
            SELECT ""FinYear"" AS finYear, ""ActiveFinYear"" AS activeFinYear
            FROM ""Const_FinYearWithIndex_sys""
            WHERE ""CurrentIndex"" = 0
            ORDER BY ""ID"" DESC LIMIT 1");
        return row is null ? NotFound(new { error = "No default financial year configured" }) : Ok(row);
    }

    [HttpGet("api/led-votes")]
    public async Task<IActionResult> GetLedVotes([FromQuery] string? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Vote_ID"" AS ""id"", ""Vote"" AS ""vote"", ""VoteDesc"" AS ""voteDesc"", ""FinYear"" AS ""finYear""
                    FROM ""Led_Vote""";
        if (!string.IsNullOrEmpty(finYear)) sql += @" WHERE ""FinYear"" = @finYear";
        sql += @" ORDER BY ""Vote""";
        var items = await conn.QueryAsync<dynamic>(sql, new { finYear });
        return Ok(items);
    }

    [HttpGet("api/led-votes/vote-id")]
    public async Task<IActionResult> GetVoteId([FromQuery] int scoaItemId, [FromQuery] string finYear)
    {
        if (scoaItemId <= 0 || string.IsNullOrWhiteSpace(finYear))
            return Ok((int?)null);
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var voteId = await conn.QuerySingleOrDefaultAsync<int?>(
            @"SELECT ""Vote_ID"" FROM ""Led_Vote""
              WHERE ""SCOAItemID"" = @scoaItemId AND ""FinYear"" = @finYear
              LIMIT 1",
            new { scoaItemId, finYear });
        return Ok(voteId);
    }

}
