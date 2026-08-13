using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;
using System.Text.Json;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/zero-budget-import")]
public class ZeroBudgetImportController : ControllerBase
{
    private readonly BudgetDbContext _db;
    public ZeroBudgetImportController(BudgetDbContext db) { _db = db; }

    [HttpGet("template")]
    public IActionResult DownloadTemplate()
    {
        var csv = "ScoaCode,Description,Fund,Department\r\n";
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", "ZeroBudgetItemTemplate.csv");
    }

    [HttpGet("template-sample")]
    public IActionResult DownloadTemplateSample()
    {
        var csv = "ScoaCode,Description,Fund,Department\r\n" +
                  "IR001001001000000000000000000000000000,Operating Expenditure Item,General Fund,Administration\r\n" +
                  "IR001002001000000000000000000000000000,Capital Project Item,Grant Fund,Finance\r\n";
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", "ZeroBudgetItemTemplate_Sample.csv");
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        [FromForm] string financialYear,
        IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only .csv files are allowed." });

        using var reader = new StreamReader(file.OpenReadStream());
        var content = await reader.ReadToEndAsync();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        if (lines.Length < 2)
            return BadRequest(new { error = "CSV must have a header row and at least one data row." });

        var headers = ParseCsvLine(lines[0]);
        var rows = new List<Dictionary<string, string>>();
        var errors = new List<string>();

        for (int i = 1; i < lines.Length; i++)
        {
            var cols = ParseCsvLine(lines[i]);
            if (cols.Length == 0) continue;

            var row = new Dictionary<string, string>();
            for (int j = 0; j < headers.Length; j++)
                row[headers[j].Trim()] = j < cols.Length ? cols[j].Trim() : "";

            if (!row.ContainsKey("ScoaCode") || string.IsNullOrWhiteSpace(row.GetValueOrDefault("ScoaCode")))
                errors.Add($"Row {i}: Missing ScoaCode.");

            rows.Add(row);
        }

        var batch = new ProjectImportBatch
        {
            FinancialYear = financialYear,
            ImportType = "Zero Budget Item",
            FileName = file.FileName,
            Status = errors.Count == 0 ? "Staged" : "StagedWithErrors",
            CreatedOn = DateTime.UtcNow,
            CsvData = JsonSerializer.Serialize(rows),
            RowCount = rows.Count,
            ErrorRecords = errors.Count,
            TotalBudgetY1 = 0,
            TotalBudgetY2 = 0,
            TotalBudgetY3 = 0
        };

        _db.ProjectImportBatches.Add(batch);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            batchId = batch.Id,
            fileName = batch.FileName,
            financialYear = batch.FinancialYear,
            totalItemsImported = batch.RowCount,
            errorRecords = batch.ErrorRecords,
            status = batch.Status,
            errors
        });
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var batch = await _db.ProjectImportBatches.FindAsync(id);
        if (batch == null) return NotFound();

        var rows = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(batch.CsvData) ?? new();
        if (rows.Count == 0) return NotFound();

        var hdrs = rows[0].Keys.ToList();
        var sb = new System.Text.StringBuilder();
        sb.AppendLine(string.Join(",", hdrs));
        foreach (var row in rows)
            sb.AppendLine(string.Join(",", hdrs.Select(h => $"\"{row.GetValueOrDefault(h, "")}\"")));

        return File(System.Text.Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", batch.FileName);
    }

    private static string[] ParseCsvLine(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var current = new System.Text.StringBuilder();
        foreach (char c in line)
        {
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ',' && !inQuotes) { result.Add(current.ToString()); current.Clear(); }
            else { current.Append(c); }
        }
        result.Add(current.ToString().TrimEnd('\r'));
        return result.ToArray();
    }
}
