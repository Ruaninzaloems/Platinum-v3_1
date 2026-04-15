using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-wip-register-items")]
public class AssetWipRegisterItemController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetWipRegisterItemController(DbConnectionFactory db) => _db = db;

    private static string SelectAll => @"
        SELECT
            i.""WIPRegistrationItem_Id"" AS ""wipRegisterItemId"",
            i.""WIPRegister_ID""         AS ""wipRegisterId"",
            i.""AssetRegisterItem_ID""   AS ""assetRegisterItemId"",
            i.""ProjectId""              AS ""projectId"",
            i.""AssetId""               AS ""assetId"",
            i.""Description""            AS ""description"",
            i.""Amount""                AS ""amount"",
            i.""Rate""                  AS ""rate"",
            i.""Quantity""              AS ""quantity"",
            i.""UoM""                   AS ""uoM"",
            i.""IsAssetItem""           AS ""isAssetItem"",
            i.""AssetDescription""       AS ""assetDescription"",
            i.""CIDMSAccountingGroupID""  AS ""cidmsAccountingGroupId"",
            i.""CIDMSAccountingSubGroupID"" AS ""cidmsAccountingSubGroupId"",
            i.""CIDMSClassID""           AS ""cidmsClassId"",
            i.""CIDMSGroupTypeID""        AS ""cidmsGroupTypeId"",
            i.""CIDMSAssetTypeID""        AS ""cidmsAssetTypeId"",
            i.""CIDMSComponentTypeID""    AS ""cidmsComponentTypeId"",
            i.""CIDMSSubComponentTypeID"" AS ""cidmsSubComponentTypeId"",
            i.""AssetTypeID""            AS ""assetTypeId"",
            i.""AssetCategoryID""        AS ""assetCategoryId"",
            i.""AssetSubCategoryID""     AS ""assetSubCategoryId"",
            i.""MeasurementTypeID""      AS ""measurementTypeId"",
            i.""AssetStatusID""          AS ""assetStatusId"",
            i.""BudgetProjectID""        AS ""budgetProjectId"",
            i.""BudgetProjectItemID""    AS ""budgetProjectItemId"",
            i.""BoqGroupId""            AS ""boqGroupId"",
            i.""OrderValue""            AS ""orderValue"",
            i.""CompletionAmount""       AS ""completionAmount"",
            i.""RetentionAmount""        AS ""retentionAmount"",
            i.""DebitAmount""           AS ""debitAmount"",
            i.""CreditAmount""          AS ""creditAmount"",
            i.""DebitAccount""          AS ""debitAccount"",
            i.""SendToBilling""         AS ""sendToBilling"",
            i.""TransferDate""          AS ""transferDate"",
            i.""Status""               AS ""status"",
            i.""DateCaptured""          AS ""dateCaptured"",
            i.""DateModified""          AS ""dateModified"",
            COALESCE(p.""MainAssetDescription"", '') AS ""mainAssetDescription""
        FROM ""Asset_WIP_Register_Items"" i
        LEFT JOIN ""Asset_WIP_Register"" p ON i.""WIPRegister_ID"" = p.""WIPRegister_ID""";

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? wipRegisterId, [FromQuery] string? status)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = SelectAll + " WHERE 1=1";
        var parameters = new DynamicParameters();
        if (wipRegisterId.HasValue) { sql += @" AND i.""WIPRegister_ID"" = @wipRegisterId"; parameters.Add("wipRegisterId", wipRegisterId.Value); }
        if (!string.IsNullOrEmpty(status)) { sql += @" AND i.""Status"" = @status"; parameters.Add("status", status); }
        sql += @" ORDER BY i.""WIPRegistrationItem_Id"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE i.""WIPRegistrationItem_Id"" = @id", new { id });
        return item is null ? NotFound(new { error = "WIP register item not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        T? Get<T>(string key) { if (!model.TryGetValue(key, out var v) || v is null) return default; var s = v.ToString(); if (string.IsNullOrWhiteSpace(s)) return default; try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); } catch { return default; } }

        var qty = Get<decimal?>("quantity");
        var rate = Get<decimal?>("rate");
        var amount = (qty.HasValue && rate.HasValue) ? qty.Value * rate.Value : Get<decimal?>("amount");

        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_WIP_Register_Items"" (
                ""WIPRegister_ID"", ""AssetRegisterItem_ID"", ""ProjectId"", ""AssetId"",
                ""Description"", ""Amount"", ""Rate"", ""Quantity"", ""UoM"",
                ""IsAssetItem"", ""AssetDescription"",
                ""CIDMSAccountingGroupID"", ""CIDMSAccountingSubGroupID"", ""CIDMSClassID"",
                ""CIDMSGroupTypeID"", ""CIDMSAssetTypeID"", ""CIDMSComponentTypeID"", ""CIDMSSubComponentTypeID"",
                ""AssetTypeID"", ""AssetCategoryID"", ""AssetSubCategoryID"",
                ""MeasurementTypeID"", ""AssetStatusID"",
                ""BudgetProjectID"", ""BudgetProjectItemID"",
                ""BoqGroupId"",
                ""OrderValue"", ""CompletionAmount"", ""RetentionAmount"",
                ""DebitAmount"", ""CreditAmount"", ""DebitAccount"",
                ""SendToBilling"", ""TransferDate"", ""Status"",
                ""DateCaptured"", ""CapturerID"")
            VALUES (
                @wipRegisterId, @assetRegisterItemId, @projectId, @assetId,
                @description, @amount, @rate, @quantity, @uoM,
                COALESCE(@isAssetItem,0), @assetDescription,
                @cidmsAccountingGroupId, @cidmsAccountingSubGroupId, @cidmsClassId,
                @cidmsGroupTypeId, @cidmsAssetTypeId, @cidmsComponentTypeId, @cidmsSubComponentTypeId,
                @assetTypeId, @assetCategoryId, @assetSubCategoryId,
                @measurementTypeId, @assetStatusId,
                @budgetProjectId, @budgetProjectItemId,
                @boqGroupId,
                @orderValue, @completionAmount, @retentionAmount,
                @debitAmount, @creditAmount, @debitAccount,
                COALESCE(@sendToBilling,0), @transferDate, COALESCE(@status,'Pending'),
                NOW(), 1)
            RETURNING ""WIPRegistrationItem_Id""",
            new
            {
                wipRegisterId = Get<int?>("wipRegisterId"),
                assetRegisterItemId = Get<int?>("assetRegisterItemId"),
                projectId = Get<int?>("projectId"),
                assetId = Get<int?>("assetId"),
                description = Get<string>("description"),
                amount,
                rate,
                quantity = qty,
                uoM = Get<string?>("uoM"),
                isAssetItem = Get<int?>("isAssetItem"),
                assetDescription = Get<string>("assetDescription"),
                cidmsAccountingGroupId = Get<int?>("cidmsAccountingGroupId"),
                cidmsAccountingSubGroupId = Get<int?>("cidmsAccountingSubGroupId"),
                cidmsClassId = Get<int?>("cidmsClassId"),
                cidmsGroupTypeId = Get<int?>("cidmsGroupTypeId"),
                cidmsAssetTypeId = Get<int?>("cidmsAssetTypeId"),
                cidmsComponentTypeId = Get<int?>("cidmsComponentTypeId"),
                cidmsSubComponentTypeId = Get<int?>("cidmsSubComponentTypeId"),
                assetTypeId = Get<int?>("assetTypeId"),
                assetCategoryId = Get<int?>("assetCategoryId"),
                assetSubCategoryId = Get<int?>("assetSubCategoryId"),
                measurementTypeId = Get<int?>("measurementTypeId"),
                assetStatusId = Get<int?>("assetStatusId"),
                budgetProjectId = Get<int?>("budgetProjectId"),
                budgetProjectItemId = Get<int?>("budgetProjectItemId"),
                boqGroupId = Get<int?>("boqGroupId"),
                orderValue = Get<decimal?>("orderValue"),
                completionAmount = Get<decimal?>("completionAmount"),
                retentionAmount = Get<decimal?>("retentionAmount"),
                debitAmount = Get<decimal?>("debitAmount"),
                creditAmount = Get<decimal?>("creditAmount"),
                debitAccount = Get<string>("debitAccount"),
                sendToBilling = Get<int?>("sendToBilling"),
                transferDate = Get<DateTime?>("transferDate"),
                status = Get<string>("status")
            });
        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE i.""WIPRegistrationItem_Id"" = @id", new { id });
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        T? Get<T>(string key) { if (!model.TryGetValue(key, out var v) || v is null) return default; var s = v.ToString(); if (string.IsNullOrWhiteSpace(s)) return default; try { var u = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, u); } catch { return default; } }

        var qty = Get<decimal?>("quantity");
        var rate = Get<decimal?>("rate");
        var amount = (qty.HasValue && rate.HasValue) ? qty.Value * rate.Value : Get<decimal?>("amount");

        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_WIP_Register_Items"" SET
                ""Description""            = @description,
                ""Amount""                = @amount,
                ""Rate""                  = @rate,
                ""Quantity""              = @quantity,
                ""UoM""                   = @uoM,
                ""IsAssetItem""           = @isAssetItem,
                ""AssetDescription""       = @assetDescription,
                ""CIDMSAccountingGroupID"" = @cidmsAccountingGroupId,
                ""CIDMSAccountingSubGroupID"" = @cidmsAccountingSubGroupId,
                ""CIDMSClassID""           = @cidmsClassId,
                ""CIDMSGroupTypeID""       = @cidmsGroupTypeId,
                ""CIDMSAssetTypeID""       = @cidmsAssetTypeId,
                ""CIDMSComponentTypeID""   = @cidmsComponentTypeId,
                ""CIDMSSubComponentTypeID"" = @cidmsSubComponentTypeId,
                ""AssetTypeID""            = @assetTypeId,
                ""AssetCategoryID""        = @assetCategoryId,
                ""AssetSubCategoryID""     = @assetSubCategoryId,
                ""MeasurementTypeID""      = @measurementTypeId,
                ""AssetStatusID""          = @assetStatusId,
                ""BudgetProjectID""        = @budgetProjectId,
                ""BudgetProjectItemID""    = @budgetProjectItemId,
                ""BoqGroupId""            = @boqGroupId,
                ""OrderValue""            = @orderValue,
                ""CompletionAmount""       = @completionAmount,
                ""RetentionAmount""        = @retentionAmount,
                ""DebitAmount""           = @debitAmount,
                ""CreditAmount""          = @creditAmount,
                ""DebitAccount""          = @debitAccount,
                ""SendToBilling""         = @sendToBilling,
                ""TransferDate""          = @transferDate,
                ""Status""               = @status,
                ""DateModified""          = NOW()
            WHERE ""WIPRegistrationItem_Id"" = @id",
            new
            {
                description = Get<string>("description"),
                amount,
                rate,
                quantity = qty,
                uoM = Get<string?>("uoM"),
                isAssetItem = Get<int?>("isAssetItem"),
                assetDescription = Get<string>("assetDescription"),
                cidmsAccountingGroupId = Get<int?>("cidmsAccountingGroupId"),
                cidmsAccountingSubGroupId = Get<int?>("cidmsAccountingSubGroupId"),
                cidmsClassId = Get<int?>("cidmsClassId"),
                cidmsGroupTypeId = Get<int?>("cidmsGroupTypeId"),
                cidmsAssetTypeId = Get<int?>("cidmsAssetTypeId"),
                cidmsComponentTypeId = Get<int?>("cidmsComponentTypeId"),
                cidmsSubComponentTypeId = Get<int?>("cidmsSubComponentTypeId"),
                assetTypeId = Get<int?>("assetTypeId"),
                assetCategoryId = Get<int?>("assetCategoryId"),
                assetSubCategoryId = Get<int?>("assetSubCategoryId"),
                measurementTypeId = Get<int?>("measurementTypeId"),
                assetStatusId = Get<int?>("assetStatusId"),
                budgetProjectId = Get<int?>("budgetProjectId"),
                budgetProjectItemId = Get<int?>("budgetProjectItemId"),
                boqGroupId = Get<int?>("boqGroupId"),
                orderValue = Get<decimal?>("orderValue"),
                completionAmount = Get<decimal?>("completionAmount"),
                retentionAmount = Get<decimal?>("retentionAmount"),
                debitAmount = Get<decimal?>("debitAmount"),
                creditAmount = Get<decimal?>("creditAmount"),
                debitAccount = Get<string>("debitAccount"),
                sendToBilling = Get<int?>("sendToBilling"),
                transferDate = Get<DateTime?>("transferDate"),
                status = Get<string>("status"),
                id
            });
        if (rows == 0) return NotFound(new { error = "WIP register item not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectAll + @" WHERE i.""WIPRegistrationItem_Id"" = @id", new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"DELETE FROM ""Asset_WIP_Register_Items"" WHERE ""WIPRegistrationItem_Id"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "WIP register item not found" }) : Ok(new { success = 1 });
    }
}
