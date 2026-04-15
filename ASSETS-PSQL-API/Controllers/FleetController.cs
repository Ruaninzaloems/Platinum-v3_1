using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/fleet-ext")]
public class FleetController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public FleetController(DbConnectionFactory db) => _db = db;

    [HttpGet("trips")]
    public async Task<IActionResult> GetTrips([FromQuery] string? status)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""Asset_TripRequests"" WHERE 1=1";
        var parameters = new DynamicParameters();
        if (!string.IsNullOrEmpty(status)) { sql += @" AND ""status"" = @status"; parameters.Add("status", status); }
        sql += @" ORDER BY ""created_at"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpPost("trips")]
    public async Task<IActionResult> CreateTrip([FromBody] TripRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstAsync<dynamic>(@"
            INSERT INTO ""Asset_TripRequests"" (""vehicle_asset_id"", ""requestor_id"", ""purpose"", ""destination"", ""departure_date"", ""return_date"", ""passengers"", ""mscoa_string"")
            VALUES (@VehicleAssetId, 1, @Purpose, @Destination, @DepartureDate, @ReturnDate, @Passengers, @MscoaString) RETURNING *", request);
        return CreatedAtAction(null, result);
    }

    [HttpPatch("trips/{id:int}/status")]
    public async Task<IActionResult> UpdateTripStatus(int id, [FromBody] TripStatusUpdate update)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            UPDATE ""Asset_TripRequests"" SET ""status"" = @Status, ""approved_by"" = 1,
                ""driver_id"" = COALESCE(@DriverId, ""driver_id""), ""updated_at"" = GETDATE()
            WHERE ""id"" = @id RETURNING *", new { update.Status, update.DriverId, id });
        return result is null ? NotFound(new { error = "Trip not found" }) : Ok(result);
    }

    [HttpGet("inspections")]
    public async Task<IActionResult> GetInspections([FromQuery] int? vehicle_asset_id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""Asset_FleetInspections"" WHERE 1=1";
        var parameters = new DynamicParameters();
        if (vehicle_asset_id.HasValue) { sql += @" AND ""vehicle_asset_id"" = @vehicle_asset_id"; parameters.Add("vehicle_asset_id", vehicle_asset_id.Value); }
        sql += @" ORDER BY ""inspected_at"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpPost("inspections")]
    public async Task<IActionResult> CreateInspection([FromBody] InspectionRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstAsync<dynamic>(@"
            INSERT INTO ""Asset_FleetInspections"" (""vehicle_asset_id"", ""inspection_type"", ""trip_request_id"", ""inspector_id"", ""checklist_results"", ""overall_status"", ""comments"")
            VALUES (@VehicleAssetId, @InspectionType, @TripRequestId, 1, @ChecklistResults, @OverallStatus, @Comments) RETURNING *", new { request.VehicleAssetId, request.InspectionType, request.TripRequestId, ChecklistResults = System.Text.Json.JsonSerializer.Serialize(request.ChecklistResults), request.OverallStatus, request.Comments });
        return CreatedAtAction(null, result);
    }

    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookings()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""Asset_FleetBookingSchedule"" ORDER BY ""booked_for_date""");
        return Ok(items);
    }

    [HttpPost("bookings")]
    public async Task<IActionResult> CreateBooking([FromBody] BookingRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstAsync<dynamic>(@"
            INSERT INTO ""Asset_FleetBookingSchedule"" (""vehicle_asset_id"", ""booked_by"", ""booked_for_date"", ""purpose"")
            VALUES (@VehicleAssetId, 1, @BookedForDate, @Purpose) RETURNING *", request);
        return CreatedAtAction(null, result);
    }
}

public class TripRequest
{
    public int? VehicleAssetId { get; set; }
    public string? Purpose { get; set; }
    public string? Destination { get; set; }
    public DateTime? DepartureDate { get; set; }
    public DateTime? ReturnDate { get; set; }
    public int? Passengers { get; set; }
    public string? MscoaString { get; set; }
}

public class TripStatusUpdate
{
    public string? Status { get; set; }
    public int? DriverId { get; set; }
}

public class InspectionRequest
{
    public int? VehicleAssetId { get; set; }
    public string? InspectionType { get; set; }
    public int? TripRequestId { get; set; }
    public object? ChecklistResults { get; set; }
    public string? OverallStatus { get; set; }
    public string? Comments { get; set; }
}

public class BookingRequest
{
    public int? VehicleAssetId { get; set; }
    public DateTime? BookedForDate { get; set; }
    public string? Purpose { get; set; }
}
