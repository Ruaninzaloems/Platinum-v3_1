using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/email-log")]
public class EmailLogController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public EmailLogController(DbConnectionFactory db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] string? status,
        [FromQuery] string? transactionType)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var where = "WHERE 1=1";
        var p = new DynamicParameters();

        if (!string.IsNullOrEmpty(status))
        {
            where += @" AND ""Status"" = @status";
            p.Add("status", status);
        }
        if (!string.IsNullOrEmpty(transactionType))
        {
            where += @" AND ""TransactionType"" = @transactionType";
            p.Add("transactionType", transactionType);
        }

        var sql = $@"
            SELECT
                COUNT(*) FILTER (WHERE ""Status"" = 'Success') AS ""totalSent"",
                COUNT(*) FILTER (WHERE ""Status"" = 'Failed')  AS ""totalFailed"",
                COUNT(*) FILTER (WHERE ""Status"" = 'Success' AND ""SentAt"" >= NOW() - INTERVAL '30 days') AS ""last30DaysSent"",
                COUNT(*) FILTER (WHERE ""Status"" = 'Failed'  AND ""SentAt"" >= NOW() - INTERVAL '30 days') AS ""last30DaysFailed""
            FROM ""Asset_EmailLog""
            {where}";

        var row = await conn.QuerySingleAsync<dynamic>(sql, p);
        return Ok(row);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] string? transactionType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 200) pageSize = 50;
        var offset = (page - 1) * pageSize;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var where = "WHERE 1=1";
        var p = new DynamicParameters();

        if (!string.IsNullOrEmpty(status))
        {
            where += @" AND ""Status"" = @status";
            p.Add("status", status);
        }
        if (!string.IsNullOrEmpty(transactionType))
        {
            where += @" AND ""TransactionType"" = @transactionType";
            p.Add("transactionType", transactionType);
        }

        p.Add("pageSize", pageSize);
        p.Add("offset", offset);

        var countSql = $@"SELECT COUNT(*) FROM ""Asset_EmailLog"" {where}";
        var totalCount = await conn.QuerySingleAsync<int>(countSql, p);

        var dataSql = $@"
            SELECT ""id"", ""TemplateID"", ""TransactionType"", ""Recipients"",
                   ""Subject"", ""Status"", ""ErrorMessage"", ""SentAt""
            FROM ""Asset_EmailLog""
            {where}
            ORDER BY ""SentAt"" DESC
            LIMIT @pageSize OFFSET @offset";

        var rows = await conn.QueryAsync<dynamic>(dataSql, p);

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            data = rows
        });
    }
}
