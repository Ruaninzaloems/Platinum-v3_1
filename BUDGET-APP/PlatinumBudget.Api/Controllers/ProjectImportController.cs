using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;
using System.Text.Json;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/project-import")]
public class ProjectImportController : ControllerBase
{
    private readonly BudgetDbContext _db;
    public ProjectImportController(BudgetDbContext db) { _db = db; }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        [FromForm] string financialYear,
        [FromForm] string importType,
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
            return BadRequest(new { error = "CSV file must have a header row and at least one data row." });

        var headers = ParseCsvLine(lines[0]);
        var rows = new List<Dictionary<string, string>>();
        var errors = new List<string>();
        decimal totalY1 = 0, totalY2 = 0, totalY3 = 0;

        for (int i = 1; i < lines.Length; i++)
        {
            var cols = ParseCsvLine(lines[i]);
            if (cols.Length == 0) continue;

            var row = new Dictionary<string, string>();
            for (int j = 0; j < headers.Length; j++)
                row[headers[j].Trim()] = j < cols.Length ? cols[j].Trim() : "";

            if (!row.ContainsKey("ProjectCode") || string.IsNullOrWhiteSpace(row.GetValueOrDefault("ProjectCode")))
                errors.Add($"Row {i}: Missing ProjectCode.");

            totalY1 += TryParseAmount(row, "Y1Amount", "Year1Amount", "BudgetY1", "Year1");
            totalY2 += TryParseAmount(row, "Y2Amount", "Year2Amount", "BudgetY2", "Year2");
            totalY3 += TryParseAmount(row, "Y3Amount", "Year3Amount", "BudgetY3", "Year3");

            rows.Add(row);
        }

        var batch = new ProjectImportBatch
        {
            FinancialYear = financialYear,
            ImportType = importType,
            FileName = file.FileName,
            Status = errors.Count == 0 ? "Staged" : "StagedWithErrors",
            CreatedOn = DateTime.UtcNow,
            CsvData = JsonSerializer.Serialize(rows),
            RowCount = rows.Count,
            ErrorRecords = errors.Count,
            TotalBudgetY1 = totalY1,
            TotalBudgetY2 = totalY2,
            TotalBudgetY3 = totalY3
        };

        _db.ProjectImportBatches.Add(batch);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            batchId = batch.Id,
            fileName = batch.FileName,
            financialYear = batch.FinancialYear,
            importType = batch.ImportType,
            totalProjectsImported = batch.RowCount,
            totalBudgetY1 = batch.TotalBudgetY1,
            totalBudgetY2 = batch.TotalBudgetY2,
            totalBudgetY3 = batch.TotalBudgetY3,
            errorRecords = batch.ErrorRecords,
            status = batch.Status,
            errors,
            headers = headers.Select(h => h.Trim()).ToArray(),
            rows
        });
    }

    [HttpGet("batches")]
    public IActionResult GetBatches()
    {
        var batches = _db.ProjectImportBatches
            .Where(b => b.ImportType != "Zero Budget Item")
            .OrderByDescending(b => b.CreatedOn)
            .Select(b => new
            {
                id = b.Id,
                fileName = b.FileName,
                importDate = b.CreatedOn,
                financialYear = b.FinancialYear,
                importType = b.ImportType,
                projectsImported = b.RowCount,
                totalBudgetY1 = b.TotalBudgetY1,
                totalBudgetY2 = b.TotalBudgetY2,
                totalBudgetY3 = b.TotalBudgetY3,
                registrationStatus = b.Status == "Registered" ? "Registered" : "Pending",
                createdBy = b.CreatedBy
            })
            .ToList();
        return Ok(batches);
    }

    [HttpPost("batches/register")]
    public async Task<IActionResult> RegisterBatches([FromBody] RegisterBatchesRequest request)
    {
        var batches = _db.ProjectImportBatches
            .Where(b => request.BatchIds.Contains(b.Id) && b.Status != "Registered")
            .ToList();

        foreach (var batch in batches)
        {
            var rows = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, string>>>(batch.CsvData) ?? new();
            foreach (var row in rows)
            {
                var code = row.GetValueOrDefault("ProjectCode", "");
                if (string.IsNullOrWhiteSpace(code)) continue;
                var existing = _db.Projects.FirstOrDefault(p => p.ProjectCode == code);
                if (existing == null)
                {
                    _db.Projects.Add(new Project
                    {
                        ProjectCode = code,
                        ProjectName = row.GetValueOrDefault("ProjectName", code),
                        Description = row.GetValueOrDefault("Description"),
                        FundingSource = row.GetValueOrDefault("FundingSource"),
                        Ward = row.GetValueOrDefault("Ward"),
                        ProjectManager = row.GetValueOrDefault("ProjectManager"),
                        Status = ProjectStatus.Active,
                        Type = ProjectType.Capital,
                        IsRegistered = true,
                        TotalProjectCost = decimal.TryParse(row.GetValueOrDefault("TotalProjectCost"), out var cost) ? cost : null
                    });
                }
            }
            batch.Status = "Registered";
        }

        await _db.SaveChangesAsync();
        return Ok(new { registered = batches.Count, message = $"Registered {batches.Count} batch(es)." });
    }

    [HttpGet("{id}/results")]
    public async Task<IActionResult> GetResults(int id)
    {
        var batch = await _db.ProjectImportBatches.FindAsync(id);
        if (batch == null) return NotFound();

        var rows = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(batch.CsvData) ?? new();
        return Ok(new
        {
            batchId = batch.Id,
            financialYear = batch.FinancialYear,
            importType = batch.ImportType,
            fileName = batch.FileName,
            status = batch.Status,
            totalProjectsImported = batch.RowCount,
            totalBudgetY1 = batch.TotalBudgetY1,
            totalBudgetY2 = batch.TotalBudgetY2,
            totalBudgetY3 = batch.TotalBudgetY3,
            errorRecords = batch.ErrorRecords,
            rows
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

    [HttpPost("{id}/register")]
    public async Task<IActionResult> Register(int id, [FromBody] RegisterImportRequest request)
    {
        var batch = await _db.ProjectImportBatches.FindAsync(id);
        if (batch == null) return NotFound();

        var rows = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(batch.CsvData) ?? new();
        int registered = 0;

        foreach (var row in rows)
        {
            var code = row.GetValueOrDefault("ProjectCode", "");
            if (string.IsNullOrWhiteSpace(code)) continue;

            var existing = _db.Projects.FirstOrDefault(p => p.ProjectCode == code);
            if (existing == null)
            {
                _db.Projects.Add(new Project
                {
                    ProjectCode = code,
                    ProjectName = row.GetValueOrDefault("ProjectName", code),
                    Description = row.GetValueOrDefault("Description"),
                    FundingSource = row.GetValueOrDefault("FundingSource"),
                    Ward = row.GetValueOrDefault("Ward"),
                    ProjectManager = row.GetValueOrDefault("ProjectManager"),
                    Status = ProjectStatus.Active,
                    Type = ProjectType.Capital,
                    IsRegistered = true,
                    TotalProjectCost = decimal.TryParse(row.GetValueOrDefault("TotalProjectCost"), out var cost) ? cost : null
                });
                registered++;
            }
        }

        batch.Status = "Registered";
        await _db.SaveChangesAsync();

        return Ok(new { registered, message = $"Successfully registered {registered} project(s)." });
    }

    private static decimal TryParseAmount(Dictionary<string, string> row, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (row.TryGetValue(key, out var val) && decimal.TryParse(val.Replace(",", ""), out var d))
                return d;
        }
        return 0;
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

public class RegisterImportRequest
{
    public string VersionNumber { get; set; } = string.Empty;
    public string VersionName { get; set; } = string.Empty;
    public string Comments { get; set; } = string.Empty;
}

public class RegisterBatchesRequest
{
    public List<int> BatchIds { get; set; } = new();
}
