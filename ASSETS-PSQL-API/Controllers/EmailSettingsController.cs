using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/email-settings")]
public class EmailSettingsController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly EmailService _emailService;

    public EmailSettingsController(DbConnectionFactory db, EmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var row = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""id"", ""smtp_host"", ""smtp_port"", ""from_name"", ""from_email"", ""smtp_username"", ""use_tls"", ""DateCaptured"", ""DateModified""
              FROM ""Asset_EmailSettings"" LIMIT 1");
        return row is null ? NotFound(new { error = "No email settings configured" }) : Ok(row);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] EmailSettingsRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var existing = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT ""id"" FROM ""Asset_EmailSettings"" LIMIT 1");

        if (existing.HasValue)
        {
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_EmailSettings""
                SET ""smtp_host"" = @SmtpHost, ""smtp_port"" = @SmtpPort, ""from_name"" = @FromName,
                    ""from_email"" = @FromEmail, ""smtp_username"" = @SmtpUsername,
                    ""smtp_password"" = CASE WHEN @SmtpPassword IS NULL OR @SmtpPassword = '' THEN ""smtp_password"" ELSE @SmtpPassword END,
                    ""use_tls"" = @UseTls, ""DateModified"" = NOW()
                WHERE ""id"" = @id",
                new { request.SmtpHost, request.SmtpPort, request.FromName, request.FromEmail, request.SmtpUsername, request.SmtpPassword, request.UseTls, id = existing.Value });
        }
        else
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_EmailSettings"" (""smtp_host"", ""smtp_port"", ""from_name"", ""from_email"", ""smtp_username"", ""smtp_password"", ""use_tls"")
                VALUES (@SmtpHost, @SmtpPort, @FromName, @FromEmail, @SmtpUsername, @SmtpPassword, @UseTls)",
                new { request.SmtpHost, request.SmtpPort, request.FromName, request.FromEmail, request.SmtpUsername, request.SmtpPassword, request.UseTls });
        }

        var row = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""id"", ""smtp_host"", ""smtp_port"", ""from_name"", ""from_email"", ""smtp_username"", ""use_tls"", ""DateCaptured"", ""DateModified""
              FROM ""Asset_EmailSettings"" LIMIT 1");
        return Ok(row);
    }

    [HttpPost("test")]
    public async Task<IActionResult> Test([FromBody] EmailTestRequest request)
    {
        try
        {
            await _emailService.TestConnectionAsync(request.ToEmail ?? "test@example.com");
            return Ok(new { success = true, message = "Test email sent successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public class EmailSettingsRequest
{
    [System.Text.Json.Serialization.JsonPropertyName("smtp_host")]
    public string? SmtpHost { get; set; }
    [System.Text.Json.Serialization.JsonPropertyName("smtp_port")]
    public int SmtpPort { get; set; } = 587;
    [System.Text.Json.Serialization.JsonPropertyName("from_name")]
    public string? FromName { get; set; }
    [System.Text.Json.Serialization.JsonPropertyName("from_email")]
    public string? FromEmail { get; set; }
    [System.Text.Json.Serialization.JsonPropertyName("smtp_username")]
    public string? SmtpUsername { get; set; }
    [System.Text.Json.Serialization.JsonPropertyName("smtp_password")]
    public string? SmtpPassword { get; set; }
    [System.Text.Json.Serialization.JsonPropertyName("use_tls")]
    public int UseTls { get; set; } = 1;
}

public class EmailTestRequest
{
    public string? ToEmail { get; set; }
}
