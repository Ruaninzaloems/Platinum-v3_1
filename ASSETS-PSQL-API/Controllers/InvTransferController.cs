using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/inv-transfers")]
public class InvTransferController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly AssetManagement.Services.EmailService _emailService;
    public InvTransferController(DbConnectionFactory db, AssetManagement.Services.EmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear)
    {
        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            var items = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""Asset_InvTransfer""");
            return Ok(items);
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
                @"SELECT * FROM ""Asset_InvTransfer"" WHERE ""InvTransferID"" = @id", new { id });
            return item is null ? NotFound() : Ok(item);
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT
                i.""InvTransferID""            AS ""itemId"",
                i.""InventoryID""              AS ""inventoryId"",
                i.""Description""              AS ""description"",
                i.""PurchaseAmount""           AS ""purchaseAmount"",
                i.""AssetCategory_ID""         AS ""assetCategoryId"",
                COALESCE(cat.""AssetCategoryDesc"", '-') AS ""categoryDescription"",
                i.""AssetClass_ID""            AS ""assetClassId"",
                COALESCE(cls.""AssetClassDesc"", '-') AS ""classDescription"",
                i.""AssetCondition_ID""        AS ""assetConditionId"",
                i.""AssetStatus_ID""           AS ""assetStatusId"",
                i.""InvoiceDate""              AS ""invoiceDate"",
                i.""UsefulLifeMonthComponent"" AS ""usefulLifeMonths"",
                i.""HighValueID""              AS ""highValueId"",
                i.""Quantity""                 AS ""quantity"",
                i.""DateCaptured""             AS ""dateCaptured""
            FROM ""Asset_InvTransfer"" i
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON i.""AssetCategory_ID"" = cat.""AssetCategoryID""
            LEFT JOIN ""Const_AssetClass_sys"" cls ON i.""AssetClass_ID"" = cls.""AssetClass_ID""
            WHERE i.""AssetRegisterItem_ID"" IS NULL
            ORDER BY i.""InvTransferID"" ASC");
        return Ok(rows);
    }

    [HttpPatch("{id:int}/assign-asset")]
    public async Task<IActionResult> AssignAsset(int id, [FromBody] System.Text.Json.JsonElement body)
    {
        if (!body.TryGetProperty("assetRegisterItemId", out var assetProp) ||
            assetProp.ValueKind == System.Text.Json.JsonValueKind.Null)
            return BadRequest(new { error = "assetRegisterItemId is required" });

        int assetId = assetProp.GetInt32();
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"UPDATE ""Asset_InvTransfer"" SET ""AssetRegisterItem_ID"" = @assetId WHERE ""InvTransferID"" = @id",
            new { assetId, id });
        if (rows == 0) return NotFound(new { error = $"Inventory transfer {id} not found" });
        try
        {
            var tfrTokens = await _emailService.BuildAssetBaseTokensAsync(conn, assetId);
            var assetDept = await conn.QueryFirstOrDefaultAsync<dynamic>(
                @"SELECT COALESCE(""MunicipalDepartment_ID""::text, '') AS dept FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetId",
                new { assetId });
            tfrTokens["FromLocation"] = "Inventory";
            tfrTokens["ToLocation"]   = (string?)(assetDept?.dept) ?? "";
            _ = _emailService.SendTransactionEmailsAsync("Transfer", tfrTokens);
        }
        catch (Exception ex) { Console.Error.WriteLine($"[InvTransferController] Email dispatch failed for Transfer approval {id}: {ex.Message}"); }
        return Ok(new { success = true });
    }
}
