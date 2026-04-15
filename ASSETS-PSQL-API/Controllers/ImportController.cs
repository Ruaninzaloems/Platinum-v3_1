using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/import")]
public class ImportController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public ImportController(DbConnectionFactory db) => _db = db;

    [HttpGet("batches")]
    public async Task<IActionResult> GetBatches()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""Asset_ImportBatches"" ORDER BY ""imported_at"" DESC OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY");
        return Ok(items);
    }

    [HttpGet("template")]
    public IActionResult GetTemplate()
    {
        var headers = new[] {
            "Description", "AssetCategory_ID", "AssetClass_ID", "AssetType_ID",
            "AcquisitionDate", "PurchaseAmount", "ResidualValue", "UsefulLifeYearComponent",
            "AssetCondition_ID", "MunicipalDepartment",
            "SerialNumber", "Barcode", "Make", "Model", "Ward_ID",
            "latitude", "longitude", "Custodian_ID", "FundingSource"
        };
        var sampleRow = new[] {
            "Office Desk - Wooden", "1", "1", "1",
            "2024-07-01", "15000.00", "500.00", "10",
            "1", "Corporate Services",
            "SN-12345", "BAR-001", "DEMA", "Executive Desk", "1",
            "-32.0833", "28.1500", "1", "1"
        };
        var csv = string.Join(",", headers) + "\n" + string.Join(",", sampleRow) + "\n";
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", "asset_import_template.csv");
    }

    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ImportValidateRequest request)
    {
        var errors = new List<object>();
        var validIndexes = new List<int>();
        var requiredFields = new[] { "Description", "AcquisitionDate", "PurchaseAmount" };
        var rows = request.Rows ?? new List<Dictionary<string, string>>();

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var rowErrors = new List<string>();
            foreach (var field in requiredFields)
            {
                if (!row.ContainsKey(field) || string.IsNullOrWhiteSpace(row[field]))
                    rowErrors.Add($"{field} is required");
            }
            if (row.ContainsKey("PurchaseAmount") && !string.IsNullOrWhiteSpace(row["PurchaseAmount"]) && !decimal.TryParse(row["PurchaseAmount"], out _))
                rowErrors.Add("PurchaseAmount must be a number");
            if (rowErrors.Count > 0)
                errors.Add(new { row = i + 1, errors = rowErrors });
            else
                validIndexes.Add(i);
        }

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var batch = await conn.QueryFirstAsync<dynamic>(@"
            INSERT INTO ""Asset_ImportBatches"" (""file_name"", ""total_rows"", ""valid_rows"", ""error_rows"", ""status"", ""errors"", ""imported_by"", ""data"")
            VALUES (@FileName, @Total, @Valid, @ErrorCount, 'validated', @Errors, 1, @Data) RETURNING *",
            new
            {
                request.FileName,
                Total = rows.Count,
                Valid = validIndexes.Count,
                ErrorCount = errors.Count,
                Errors = System.Text.Json.JsonSerializer.Serialize(errors),
                Data = System.Text.Json.JsonSerializer.Serialize(new { rows, validIndexes })
            });

        return Ok(new { batch, errors, validRows = validIndexes.Count, totalRows = rows.Count });
    }

    [HttpPost("commit/{batchId:int}")]
    public async Task<IActionResult> Commit(int batchId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var batch = await conn.QueryFirstOrDefaultAsync<dynamic>(@"SELECT * FROM ""Asset_ImportBatches"" WHERE ""id"" = @batchId", new { batchId });
        if (batch is null) return NotFound(new { error = "Batch not found" });
        if ((string)batch.status == "completed") return BadRequest(new { error = "Batch already imported" });

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_ImportBatches"" SET ""status"" = 'completed', ""committed_at"" = GETDATE(), ""committed_rows"" = ""valid_rows"" WHERE ""id"" = @batchId", new { batchId });

        return Ok(new { success = 1, imported = (int)(batch.valid_rows ?? 0), batchId });
    }
}

public class ImportValidateRequest
{
    public string? FileName { get; set; }
    public List<Dictionary<string, string>>? Rows { get; set; }
}
