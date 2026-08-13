using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PlatinumBudget.Api.Data;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/virement-approval-levels")]
public class VirementApprovalLevelsController : ControllerBase
{
    private readonly BudgetDbContext _db;

    public VirementApprovalLevelsController(BudgetDbContext db)
    {
        _db = db;
    }

    // ── Helper: borrow the already-configured EF connection ──────────────────
    private async Task<NpgsqlConnection> OpenConn()
    {
        var conn = (NpgsqlConnection)_db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
            await conn.OpenAsync();
        return conn;
    }

    // GET /api/virement-approval-levels/header
    [HttpGet("header")]
    public async Task<IActionResult> GetHeader()
    {
        var conn = await OpenConn();
        await using var cmd = new NpgsqlCommand(
            @"SELECT ""VirementApprovalHeader_ID"", ""IsLocked"", ""DateCaptured"" FROM ""Const_VirementApprovalRangeHeader"" LIMIT 1", conn);
        await using var rdr = await cmd.ExecuteReaderAsync();
        if (await rdr.ReadAsync())
            return Ok(new { id = rdr.GetInt32(0), isLocked = rdr.GetBoolean(1), dateCaptured = rdr.GetDateTime(2) });
        return Ok(new { id = 0, isLocked = false });
    }

    // POST /api/virement-approval-levels/header/lock
    [HttpPost("header/lock")]
    public async Task<IActionResult> ToggleLock([FromBody] ToggleLockDto dto)
    {
        var conn = await OpenConn();
        await using var cmd = new NpgsqlCommand(
            @"UPDATE ""Const_VirementApprovalRangeHeader"" SET ""IsLocked""=@v, ""ModifierID""=@mid, ""DateModified""=NOW()", conn);
        cmd.Parameters.AddWithValue("v", dto.IsLocked);
        cmd.Parameters.AddWithValue("mid", dto.UserId);
        await cmd.ExecuteNonQueryAsync();
        return Ok();
    }

    // GET /api/virement-approval-levels/level-count
    [HttpGet("level-count")]
    public async Task<IActionResult> GetLevelCount()
    {
        var conn = await OpenConn();
        await using var cmd = new NpgsqlCommand(
            @"SELECT ""KeyValue"" FROM ""AAAA_ConfigSettings"" WHERE ""KeyName""='NumberVirementApprovalLevel' LIMIT 1", conn);
        var val = await cmd.ExecuteScalarAsync();
        return Ok(new { count = val != null && int.TryParse(val.ToString(), out var n) ? n : 7 });
    }

    // GET /api/virement-approval-levels/ranges
    [HttpGet("ranges")]
    public async Task<IActionResult> GetRanges()
    {
        var conn = await OpenConn();

        var ranges = new List<RangeDto>();
        await using (var cmd = new NpgsqlCommand(
            @"SELECT ""Range_ID"", ""MinAmount"", ""MaxAmount"", ""DateCaptured"" FROM ""Const_VirementApprovalRange"" ORDER BY ""MinAmount""", conn))
        await using (var rdr = await cmd.ExecuteReaderAsync())
        {
            while (await rdr.ReadAsync())
                ranges.Add(new RangeDto(rdr.GetInt32(0), rdr.GetDecimal(1), rdr.GetDecimal(2), rdr.GetDateTime(3)));
        }

        var approvers = new List<ApproverRow>();
        await using (var cmd2 = new NpgsqlCommand(
            @"SELECT a.""Approver_ID"", a.""RangeID"", a.""LevelID"", a.""ApproverID"",
                     ud.""LastName"" || ' ' || ud.""FirstName"" || ' (' || jProfile.""JobTitle"" || ')' AS ApproverName
              FROM ""Const_VirementApprovalRangeApprover"" a
              JOIN ""User_UserDetail""    ud       ON ud.""User_ID""        = a.""ApproverID""
              JOIN ""Payroll_Employee""   emp      ON emp.""Employee_ID""   = ud.""EmpID""
              JOIN ""Payroll_Position""   pp       ON pp.""Position_ID""   = emp.""PositionID""
              JOIN ""Payroll_JobProfile"" jProfile ON jProfile.""JobProfile_ID"" = pp.""JobProfileID""
              ORDER BY a.""RangeID"", a.""LevelID""", conn))
        await using (var rdr2 = await cmd2.ExecuteReaderAsync())
        {
            while (await rdr2.ReadAsync())
                approvers.Add(new ApproverRow(rdr2.GetInt32(0), rdr2.GetInt32(1), rdr2.GetInt32(2), rdr2.GetInt32(3), rdr2.GetString(4)));
        }

        var result = ranges.Select(r => new
        {
            r.RangeId,
            r.MinAmount,
            r.MaxAmount,
            r.DateCaptured,
            approvers = approvers.Where(a => a.RangeId == r.RangeId)
                .Select(a => new { a.ApproverId, a.RangeId, a.LevelId, a.UserId, a.ApproverName })
        });

        return Ok(result);
    }

    // POST /api/virement-approval-levels/ranges
    [HttpPost("ranges")]
    public async Task<IActionResult> AddRange([FromBody] SaveRangeDto dto)
    {
        if (dto.MinAmount >= dto.MaxAmount)
            return BadRequest("Minimum amount must be less than maximum amount.");

        var conn = await OpenConn();

        var overlapError = await CheckOverlap(conn, dto.MinAmount, dto.MaxAmount, excludeId: null);
        if (overlapError != null) return BadRequest(overlapError);

        await using var cmd = new NpgsqlCommand(
            @"INSERT INTO ""Const_VirementApprovalRange"" (""MinAmount"",""MaxAmount"",""CapturerID"",""DateCaptured"")
              VALUES (@min,@max,@cid,NOW()) RETURNING ""Range_ID""", conn);
        cmd.Parameters.AddWithValue("min", dto.MinAmount);
        cmd.Parameters.AddWithValue("max", dto.MaxAmount);
        cmd.Parameters.AddWithValue("cid", dto.UserId);
        var newId = (int)(await cmd.ExecuteScalarAsync())!;
        return Ok(new { rangeId = newId });
    }

    // PUT /api/virement-approval-levels/ranges/{id}
    [HttpPut("ranges/{id}")]
    public async Task<IActionResult> UpdateRange(int id, [FromBody] SaveRangeDto dto)
    {
        if (dto.MinAmount >= dto.MaxAmount)
            return BadRequest("Minimum amount must be less than maximum amount.");

        var conn = await OpenConn();

        var overlapError = await CheckOverlap(conn, dto.MinAmount, dto.MaxAmount, excludeId: id);
        if (overlapError != null) return BadRequest(overlapError);

        await using var cmd = new NpgsqlCommand(
            @"UPDATE ""Const_VirementApprovalRange""
              SET ""MinAmount""=@min, ""MaxAmount""=@max, ""ModifierID""=@mid, ""DateModified""=NOW()
              WHERE ""Range_ID""=@id", conn);
        cmd.Parameters.AddWithValue("min", dto.MinAmount);
        cmd.Parameters.AddWithValue("max", dto.MaxAmount);
        cmd.Parameters.AddWithValue("mid", dto.UserId);
        cmd.Parameters.AddWithValue("id", id);
        await cmd.ExecuteNonQueryAsync();
        return Ok();
    }

    // DELETE /api/virement-approval-levels/ranges/{id}
    [HttpDelete("ranges/{id}")]
    public async Task<IActionResult> DeleteRange(int id)
    {
        var conn = await OpenConn();
        await using var cmd = new NpgsqlCommand(
            @"DELETE FROM ""Const_VirementApprovalRange"" WHERE ""Range_ID""=@id", conn);
        cmd.Parameters.AddWithValue("id", id);
        await cmd.ExecuteNonQueryAsync();
        return Ok();
    }

    // POST /api/virement-approval-levels/ranges/{rangeId}/approvers
    [HttpPost("ranges/{rangeId}/approvers")]
    public async Task<IActionResult> AddApprover(int rangeId, [FromBody] AddApproverDto dto)
    {
        var conn = await OpenConn();

        // Check for duplicate (same approver + same level in same range)
        await using (var chk = new NpgsqlCommand(
            @"SELECT COUNT(*) FROM ""Const_VirementApprovalRangeApprover""
              WHERE ""RangeID""=@rid AND ""LevelID""=@lid AND ""ApproverID""=@aid", conn))
        {
            chk.Parameters.AddWithValue("rid", rangeId);
            chk.Parameters.AddWithValue("lid", dto.LevelId);
            chk.Parameters.AddWithValue("aid", dto.ApproverUserId);
            var count = (long)(await chk.ExecuteScalarAsync())!;
            if (count > 0)
                return BadRequest("This approver is already assigned to this level for the selected range.");
        }

        await using var cmd = new NpgsqlCommand(
            @"INSERT INTO ""Const_VirementApprovalRangeApprover""
              (""RangeID"",""ApproverID"",""LevelID"",""CapturerID"",""DateCaptured"")
              VALUES (@rid,@aid,@lid,@cid,NOW()) RETURNING ""Approver_ID""", conn);
        cmd.Parameters.AddWithValue("rid", rangeId);
        cmd.Parameters.AddWithValue("aid", dto.ApproverUserId);
        cmd.Parameters.AddWithValue("lid", dto.LevelId);
        cmd.Parameters.AddWithValue("cid", dto.UserId);
        var newId = (int)(await cmd.ExecuteScalarAsync())!;
        return Ok(new { approverId = newId });
    }

    // DELETE /api/virement-approval-levels/approvers/{approverId}
    [HttpDelete("approvers/{approverId}")]
    public async Task<IActionResult> DeleteApprover(int approverId)
    {
        var conn = await OpenConn();
        await using var cmd = new NpgsqlCommand(
            @"DELETE FROM ""Const_VirementApprovalRangeApprover"" WHERE ""Approver_ID""=@id", conn);
        cmd.Parameters.AddWithValue("id", approverId);
        await cmd.ExecuteNonQueryAsync();
        return Ok();
    }

    // GET /api/virement-approval-levels/approver-users
    [HttpGet("approver-users")]
    public async Task<IActionResult> GetApproverUsers()
    {
        var conn = await OpenConn();
        var sql = @"
            SELECT ud.""User_ID"",
                   ud.""LastName"" || ' ' || ud.""FirstName"" || ' (' || jProfile.""JobTitle"" || ')' AS EmpJobProfile
            FROM ""Payroll_Employee"" emp
            JOIN ""Payroll_Position""   pp       ON emp.""PositionID""   = pp.""Position_ID""
            JOIN ""Payroll_JobProfile"" jProfile ON pp.""JobProfileID""  = jProfile.""JobProfile_ID""
            JOIN ""User_UserDetail""    ud       ON emp.""Employee_ID""  = ud.""EmpID""
            ORDER BY ud.""LastName"", ud.""FirstName""";
        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var rdr = await cmd.ExecuteReaderAsync();
        var list = new List<object>();
        while (await rdr.ReadAsync())
            list.Add(new { userId = rdr.GetInt32(0), label = rdr.GetString(1) });
        return Ok(list);
    }

    // ── Overlap check helper ──────────────────────────────────────────────────
    private static async Task<string?> CheckOverlap(NpgsqlConnection conn, decimal min, decimal max, int? excludeId)
    {
        var sql = excludeId.HasValue
            ? @"SELECT COUNT(*) FROM ""Const_VirementApprovalRange""
                WHERE ""Range_ID"" <> @excl AND ""MinAmount"" < @max AND ""MaxAmount"" > @min"
            : @"SELECT COUNT(*) FROM ""Const_VirementApprovalRange""
                WHERE ""MinAmount"" < @max AND ""MaxAmount"" > @min";
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("min", min);
        cmd.Parameters.AddWithValue("max", max);
        if (excludeId.HasValue) cmd.Parameters.AddWithValue("excl", excludeId.Value);
        var count = (long)(await cmd.ExecuteScalarAsync())!;
        return count > 0 ? "This range overlaps with an existing range." : null;
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────
public record ToggleLockDto(bool IsLocked, int UserId);
public record SaveRangeDto(decimal MinAmount, decimal MaxAmount, int UserId);
public record AddApproverDto(int ApproverUserId, int LevelId, int UserId);
record RangeDto(int RangeId, decimal MinAmount, decimal MaxAmount, DateTime DateCaptured);
record ApproverRow(int ApproverId, int RangeId, int LevelId, int UserId, string ApproverName);
