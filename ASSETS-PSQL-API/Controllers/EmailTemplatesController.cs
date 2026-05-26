using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/email-templates")]
public class EmailTemplatesController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public EmailTemplatesController(DbConnectionFactory db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? transactionType)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""Asset_EmailTemplates"" WHERE 1=1";
        if (!string.IsNullOrEmpty(transactionType))
            sql += @" AND ""TransactionType"" = @transactionType";
        sql += @" ORDER BY ""id"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, new { transactionType });
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""Asset_EmailTemplates"" WHERE ""id"" = @id", new { id });
        return item is null ? NotFound(new { error = "Template not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] EmailTemplateRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_EmailTemplates"" (""TransactionType"", ""TemplateTitle"", ""RecipientEmails"", ""MessageContent"", ""IsActive"")
            VALUES (@TransactionType, @TemplateTitle, @RecipientEmails, @MessageContent, @IsActive)
            RETURNING ""id""",
            new { request.TransactionType, request.TemplateTitle, request.RecipientEmails, request.MessageContent, request.IsActive });
        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""Asset_EmailTemplates"" WHERE ""id"" = @id", new { id });
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] EmailTemplateRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_EmailTemplates""
            SET ""TransactionType"" = @TransactionType, ""TemplateTitle"" = @TemplateTitle,
                ""RecipientEmails"" = @RecipientEmails, ""MessageContent"" = @MessageContent,
                ""IsActive"" = @IsActive, ""DateModified"" = NOW(), ""ModifierID"" = 1
            WHERE ""id"" = @id",
            new { request.TransactionType, request.TemplateTitle, request.RecipientEmails, request.MessageContent, request.IsActive, id });
        if (rows == 0) return NotFound(new { error = "Template not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""Asset_EmailTemplates"" WHERE ""id"" = @id", new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"DELETE FROM ""Asset_EmailTemplates"" WHERE ""id"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Template not found" }) : Ok(new { success = 1 });
    }
}

public class EmailTemplateRequest
{
    public string? TransactionType { get; set; }
    public string? TemplateTitle { get; set; }
    public string? RecipientEmails { get; set; }
    public string? MessageContent { get; set; }
    public int IsActive { get; set; } = 1;
}
