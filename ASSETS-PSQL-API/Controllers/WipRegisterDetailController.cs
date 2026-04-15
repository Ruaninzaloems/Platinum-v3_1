using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;
using System.Data.Common;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/wip-register-details")]
public class WipRegisterDetailController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;

    public WipRegisterDetailController(DbConnectionFactory db, TransactionService txnService)
    {
        _db = db;
        _txnService = txnService;
    }

    private static string SelectAll => @"
        SELECT
            ""WIPRegisterDetails_ID"" AS ""wipRegisterDetailId"",
            ""WIPRegister_ID""        AS ""wipRegisterId"",
            ""InvoiceId""             AS ""invoiceId"",
            ""InvoiceNumber""         AS ""invoiceNumber"",
            ""InvoiceDate""           AS ""invoiceDate"",
            ""VendorID""              AS ""vendorId"",
            ""Description""           AS ""description"",
            ""Amount""                AS ""amount"",
            ""VatAmount""             AS ""vatAmount"",
            ""TotalAmount""           AS ""totalAmount"",
            ""TransactionDate""       AS ""transactionDate"",
            ""ReferenceNumber""       AS ""referenceNumber"",
            ""DocumentNumber""        AS ""documentNumber"",
            ""PaymentReference""      AS ""paymentReference"",
            ""DateCaptured""          AS ""dateCaptured"",
            ""DateModified""          AS ""dateModified""
        FROM ""Asset_WIP_Register_Details""";

    private static async Task RecalculateParent(DbConnection conn, int wipRegisterId)
    {
        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register"" SET
                ""TotalExpenditure"" = COALESCE((
                    SELECT SUM(COALESCE(""Amount"", 0))
                    FROM ""Asset_WIP_Register_Details""
                    WHERE ""WIPRegister_ID"" = @wipId
                ), 0),
                ""Additions"" = COALESCE((
                    SELECT SUM(COALESCE(""Amount"", 0))
                    FROM ""Asset_WIP_Register_Details""
                    WHERE ""WIPRegister_ID"" = @wipId
                ), 0),
                ""WIPClosingBalance"" = COALESCE(""WIPOpeningBalance"", 0)
                    + COALESCE((
                        SELECT SUM(COALESCE(""Amount"", 0))
                        FROM ""Asset_WIP_Register_Details""
                        WHERE ""WIPRegister_ID"" = @wipId
                    ), 0)
                    - COALESCE(""TransferOfAssets"", 0)
                    - COALESCE(""WriteOff"", 0)
                    - COALESCE(""Impairment"", 0)
                    + COALESCE(""PriorYearAdjustment"", 0),
                ""FinancialProgress"" = CASE
                    WHEN COALESCE(""ContractValue"", 0) > 0 THEN ROUND((
                        COALESCE(""WIPOpeningBalance"", 0)
                        + COALESCE((
                            SELECT SUM(COALESCE(""Amount"", 0))
                            FROM ""Asset_WIP_Register_Details""
                            WHERE ""WIPRegister_ID"" = @wipId
                        ), 0)
                        - COALESCE(""TransferOfAssets"", 0)
                        - COALESCE(""WriteOff"", 0)
                        - COALESCE(""Impairment"", 0)
                        + COALESCE(""PriorYearAdjustment"", 0)
                    ) / ""ContractValue"" * 100, 1)
                    ELSE 0
                END,
                ""DateModified"" = NOW()
            WHERE ""WIPRegister_ID"" = @wipId",
            new { wipId = wipRegisterId });
    }

    private async Task RebuildAssetSummary(DbConnection conn, int wipRegisterId)
    {
        var wip = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""AssetRegisterItem_ID"", ""FinYear"", ""WIPClosingBalance"",
                   ""ProjectName"", ""ProjectNo"", ""DepartmentID"", ""DivisionID"",
                   ""Latitude"", ""Longitude"", ""ContractStartDate""
            FROM ""Asset_WIP_Register""
            WHERE ""WIPRegister_ID"" = @wipId AND ""AssetRegisterItem_ID"" IS NOT NULL",
            new { wipId = wipRegisterId });

        if (wip == null) return;

        int assetId = (int)wip.AssetRegisterItem_ID;
        decimal wipClosing = (decimal)(wip.WIPClosingBalance ?? 0m);
        string finYear = (string)(wip.FinYear ?? DateTime.UtcNow.Year.ToString());

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_Register_Items"" SET
                ""CurrentAmount""                 = @wipClosing,
                ""PurchaseAmount""                = @wipClosing,
                ""CurrentReplacementCostCRC""     = @wipClosing,
                ""DepreciatedReplacementCostDRC"" = @wipClosing,
                ""DateModified""                  = NOW()
            WHERE ""AssetRegisterItem_ID"" = @assetId",
            new { wipClosing, assetId });

        try
        {
            await _txnService.PopulateTransactionSummarySingle(assetId, finYear, 1);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ATS rebuild failed for WIP asset {assetId}: {ex.Message}");
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? wipRegisterId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = SelectAll + " WHERE 1=1";
        var parameters = new DynamicParameters();
        if (wipRegisterId.HasValue) { sql += @" AND ""WIPRegister_ID"" = @wipRegisterId"; parameters.Add("wipRegisterId", wipRegisterId.Value); }
        sql += @" ORDER BY ""WIPRegisterDetails_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE ""WIPRegisterDetails_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "WIP register detail not found" }) : Ok(item);
    }

    [HttpGet("by-wip-register/{wipRegisterId:int}")]
    public async Task<IActionResult> GetByWipRegisterId(int wipRegisterId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            SelectAll + @" WHERE ""WIPRegister_ID"" = @wipRegisterId ORDER BY ""WIPRegisterDetails_ID""",
            new { wipRegisterId });
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        T? Get<T>(string key) { if (!model.TryGetValue(key, out var v) || v is null) return default; var s = v.ToString(); if (string.IsNullOrWhiteSpace(s)) return default; try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); } catch { return default; } }
        var wipRegisterId = Get<int?>("wipRegisterId");
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_WIP_Register_Details"" (
                ""WIPRegister_ID"", ""InvoiceId"", ""InvoiceNumber"", ""InvoiceDate"",
                ""VendorID"", ""Description"", ""Amount"", ""VatAmount"", ""TotalAmount"",
                ""TransactionDate"", ""ReferenceNumber"", ""DocumentNumber"", ""PaymentReference"",
                ""DateCaptured"", ""CapturerID"")
            VALUES (
                @wipRegisterId, @invoiceId, @invoiceNumber, @invoiceDate,
                @vendorId, @description, @amount, @vatAmount, @totalAmount,
                @transactionDate, @referenceNumber, @documentNumber, @paymentReference,
                NOW(), 1)
            RETURNING ""WIPRegisterDetails_ID""",
            new
            {
                wipRegisterId,
                invoiceId = Get<int?>("invoiceId"),
                invoiceNumber = Get<string>("invoiceNumber"),
                invoiceDate = Get<DateTime?>("invoiceDate"),
                vendorId = Get<int?>("vendorId"),
                description = Get<string>("description"),
                amount = Get<decimal?>("amount"),
                vatAmount = Get<decimal?>("vatAmount"),
                totalAmount = Get<decimal?>("totalAmount"),
                transactionDate = Get<DateTime?>("transactionDate"),
                referenceNumber = Get<string>("referenceNumber"),
                documentNumber = Get<string>("documentNumber"),
                paymentReference = Get<string>("paymentReference")
            });
        if (wipRegisterId.HasValue)
        {
            await RecalculateParent(conn, wipRegisterId.Value);
            await RebuildAssetSummary(conn, wipRegisterId.Value);
        }
        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE ""WIPRegisterDetails_ID"" = @id", new { id });
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        T? Get<T>(string key) { if (!model.TryGetValue(key, out var v) || v is null) return default; var s = v.ToString(); if (string.IsNullOrWhiteSpace(s)) return default; try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); } catch { return default; } }
        var wipRegisterId = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT ""WIPRegister_ID"" FROM ""Asset_WIP_Register_Details"" WHERE ""WIPRegisterDetails_ID"" = @id", new { id });
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register_Details"" SET
                ""InvoiceNumber""   = @invoiceNumber,
                ""InvoiceDate""     = @invoiceDate,
                ""VendorID""        = @vendorId,
                ""Description""     = @description,
                ""Amount""          = @amount,
                ""VatAmount""       = @vatAmount,
                ""TotalAmount""     = @totalAmount,
                ""TransactionDate"" = @transactionDate,
                ""ReferenceNumber"" = @referenceNumber,
                ""DocumentNumber""  = @documentNumber,
                ""PaymentReference""= @paymentReference,
                ""DateModified""    = NOW()
            WHERE ""WIPRegisterDetails_ID"" = @id",
            new
            {
                invoiceNumber = Get<string>("invoiceNumber"),
                invoiceDate = Get<DateTime?>("invoiceDate"),
                vendorId = Get<int?>("vendorId"),
                description = Get<string>("description"),
                amount = Get<decimal?>("amount"),
                vatAmount = Get<decimal?>("vatAmount"),
                totalAmount = Get<decimal?>("totalAmount"),
                transactionDate = Get<DateTime?>("transactionDate"),
                referenceNumber = Get<string>("referenceNumber"),
                documentNumber = Get<string>("documentNumber"),
                paymentReference = Get<string>("paymentReference"),
                id
            });
        if (rows == 0) return NotFound(new { error = "WIP register detail not found" });
        if (wipRegisterId.HasValue)
        {
            await RecalculateParent(conn, wipRegisterId.Value);
            await RebuildAssetSummary(conn, wipRegisterId.Value);
        }
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE ""WIPRegisterDetails_ID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var wipRegisterId = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT ""WIPRegister_ID"" FROM ""Asset_WIP_Register_Details"" WHERE ""WIPRegisterDetails_ID"" = @id", new { id });
        var rows = await conn.ExecuteAsync(
            @"DELETE FROM ""Asset_WIP_Register_Details"" WHERE ""WIPRegisterDetails_ID"" = @id", new { id });
        if (rows == 0) return NotFound(new { error = "WIP register detail not found" });
        if (wipRegisterId.HasValue)
        {
            await RecalculateParent(conn, wipRegisterId.Value);
            await RebuildAssetSummary(conn, wipRegisterId.Value);
        }
        return Ok(new { success = 1 });
    }
}
