using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;
using AssetManagement.Services;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-config-transaction-types")]
public class AssetConfigTransactionTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetConfigTransactionTypeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<TransactionType>(@"SELECT * FROM ""AssetConfig_TransactionType"" ORDER BY ""AssetConfig_TransactionType_ID""");
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<TransactionType>(@"SELECT * FROM ""AssetConfig_TransactionType"" WHERE ""AssetConfig_TransactionType_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Transaction type not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TransactionType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""AssetConfig_TransactionType"" WHERE ""Name"" ILIKE @Name", new { model.Name }) > 0;
        if (dup) return Conflict(new { error = $"Transaction type '{model.Name}' already exists" });
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""AssetConfig_TransactionType"" (""Name"", ""Enabled"", ""CreatedDate"", ""CreatedByID"", ""Default"")
            VALUES (@Name, @Enabled, GETDATE(), @CreatedByID, @Default)
            RETURNING ""AssetConfig_TransactionType_ID""", model);
        model.AssetConfig_TransactionType_ID = id;
        return CreatedAtAction(nameof(GetById), new { id }, model);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TransactionType model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""AssetConfig_TransactionType"" WHERE ""Name"" ILIKE @Name AND ""AssetConfig_TransactionType_ID"" <> @id", new { model.Name, id }) > 0;
        if (dup) return Conflict(new { error = $"Transaction type '{model.Name}' already exists" });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""AssetConfig_TransactionType""
            SET ""Name"" = @Name, ""Enabled"" = @Enabled, ""ModiefiedDate"" = GETDATE(), ""Default"" = @Default
            WHERE ""AssetConfig_TransactionType_ID"" = @id", new { model.Name, model.Enabled, model.Default, id });
        return rows == 0 ? NotFound(new { error = "Transaction type not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""AssetConfig_TransactionType"" WHERE ""AssetConfig_TransactionType_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Transaction type not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"SELECT ""AssetConfig_TransactionType_ID"" AS id, ""Name"" AS name, CAST(""Default"" AS INT) AS isDefault, CAST(""Enabled"" AS INT) AS enabled FROM ""AssetConfig_TransactionType"" ORDER BY ""AssetConfig_TransactionType_ID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Transaction Types");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Name";
        ws.Cell(1, 3).Value = "Default";
        ws.Cell(1, 4).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.id;
            ws.Cell(r, 2).Value = (string?)row.name ?? "";
            ws.Cell(r, 3).Value = row.isDefault == null ? "No" : ((int)row.isDefault == 1 ? "Yes" : "No");
            ws.Cell(r, 4).Value = (int)row.enabled == 1 ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "TransactionTypes_Export.xlsx");
    }

    [HttpGet("import-template")]
    public IActionResult GetTemplate()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Transaction Types");
        ws.Cell(1, 1).Value = "Name";
        ws.Cell(2, 1).Value = "Addition";
        ws.Row(1).Style.Font.Bold = true;
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "TransactionTypes_Template.xlsx");
    }

    [HttpPost("import")]
    public async Task<IActionResult> Import(IFormFile file)
    {
        var validation = ImportHelper.ValidateFile(file);
        if (validation != null) return BadRequest(validation);

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream);
        stream.Position = 0;
        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheets.First();
        var errors = new List<ImportError>();
        var rowNums = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var rows = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (int r = 2; r <= ws.LastRowUsed()?.RowNumber(); r++)
        {
            var val = ws.Cell(r, 1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Name", Value = val, Message = "Required field 'Name' is empty" });
                continue;
            }
            if (!seen.Add(val))
            {
                errors.Add(new ImportError { Row = r, Column = "Name", Value = val, Message = $"Duplicate: 'Name' value '{val}' in file" });
                continue;
            }
            rows.Add(val);
            rowNums[val] = r;
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var dbErrors = new List<ImportError>();
        await using var txn = await conn.BeginTransactionAsync();

        foreach (var val in rows)
        {
            var exists = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM ""AssetConfig_TransactionType"" WHERE ""Name"" ILIKE @val", new { val }, txn) > 0;
            if (exists) { dbErrors.Add(new ImportError { Row = rowNums.TryGetValue(val, out var rn) ? rn : 0, Column = "Name", Value = val, Message = $"Duplicate: '{val}' already exists in the database" }); continue; }
            await conn.ExecuteAsync(@"
                INSERT INTO ""AssetConfig_TransactionType"" (""Name"", ""Enabled"", ""CreatedDate"", ""CreatedByID"", ""Default"")
                VALUES (@val, 1, GETDATE(), 1, 1)", new { val }, txn);
        }

        if (dbErrors.Count > 0)
        {
            await txn.RollbackAsync();
            return BadRequest(new ImportResult { Success = false, Errors = dbErrors });
        }
        await txn.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = rows.Count });
    }
}
