using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/monthly-approval")]
public class MonthlyApprovalController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public MonthlyApprovalController(DbConnectionFactory db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MonthlyApprovalRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_MonthlyApproval""
                (""Financial_Year"", ""Financial_Period"", ""User_Id"", ""IsApproved"", ""DateCreated"",
                 ""VerifiedRevaluation"", ""VerifiedImpairment"", ""VerifiedImpairmentReversal"", ""VerifiedDisposal"")
            VALUES (@FinancialYear, @FinancialPeriod, @UserId, TRUE, GETDATE(),
                    @VerifiedRevaluation, @VerifiedImpairment, @VerifiedImpairmentReversal, @VerifiedDisposal)
            RETURNING ""MonthlyApproval_ID""", request);

        return Ok(new { id, success = 1 });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear, [FromQuery] int? period)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var sql = @"SELECT * FROM ""Asset_MonthlyApproval"" WHERE 1=1";
        var p = new DynamicParameters();
        if (!string.IsNullOrEmpty(finYear)) { sql += @" AND ""Financial_Year"" = @finYear"; p.Add("finYear", finYear); }
        if (period.HasValue) { sql += @" AND ""Financial_Period"" = @period"; p.Add("period", period.Value); }
        sql += @" ORDER BY ""DateCreated"" DESC";

        var rows = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(rows);
    }

    [HttpGet("check")]
    public async Task<IActionResult> Check([FromQuery] string finYear, [FromQuery] int period)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var count = await conn.QuerySingleAsync<int>(
            @"SELECT COUNT(*) FROM ""Asset_MonthlyApproval""
              WHERE ""Financial_Year"" = @finYear AND ""Financial_Period"" = @period AND ""IsApproved"" = TRUE",
            new { finYear, period });

        return Ok(new { exists = count > 0 });
    }

    [HttpGet("min-transaction-date")]
    public async Task<IActionResult> GetMinTransactionDate()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var last = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""Financial_Year"" AS ""FinancialYear"", ""Financial_Period"" AS ""FinancialPeriod""
              FROM ""Asset_MonthlyApproval""
              WHERE ""IsApproved"" = TRUE
              ORDER BY ""Financial_Year"" DESC, ""Financial_Period"" DESC
              LIMIT 1");

        if (last == null)
            return Ok(new { minTransactionDate = (string?)null });

        int lastPeriod = (int)last.FinancialPeriod;
        string lastFy = (string)last.FinancialYear;

        // Compute the next period (first period after the last approved one)
        int nextPeriod = lastPeriod + 1;
        string nextFy;
        if (nextPeriod > 12)
        {
            nextPeriod = 1;
            var parts = lastFy.Split('/');
            int startYear = int.TryParse(parts[0], out var sy) ? sy : DateTime.Now.Year;
            nextFy = $"{startYear + 1}/{startYear + 2}";
        }
        else
        {
            nextFy = lastFy;
        }

        // Convert next period to calendar month (FY starts July = month 7)
        int month = ((6 + nextPeriod - 1) % 12) + 1;

        // Parse FY start year
        var fyParts = nextFy.Split('/');
        int fyStartYear = int.TryParse(fyParts[0], out var parsedStart) ? parsedStart : DateTime.Now.Year;
        int calYear = month >= 7 ? fyStartYear : fyStartYear + 1;

        // Return the FIRST day of the next period's month (so the entire closed month is blocked)
        var minDate = new DateTime(calYear, month, 1);
        return Ok(new { minTransactionDate = minDate.ToString("yyyy-MM-dd") });
    }
}

public class MonthlyApprovalRequest
{
    public string? FinancialYear { get; set; }
    public int FinancialPeriod { get; set; }
    public int UserId { get; set; } = 1;
    public bool VerifiedRevaluation { get; set; }
    public bool VerifiedImpairment { get; set; }
    public bool VerifiedImpairmentReversal { get; set; }
    public bool VerifiedDisposal { get; set; }
}
