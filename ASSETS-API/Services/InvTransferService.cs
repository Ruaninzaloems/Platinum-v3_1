using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class InvTransferService : IInvTransferService
{
    private readonly DbConnectionFactory _db;
    public InvTransferService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(string? finYear)
    {
        using var conn = _db.CreateConnection();
        var sql = "SELECT * FROM [Asset_InvTransfer] WHERE 1=1";
        var p = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(finYear)) { sql += " AND [FinYear] = @finYear"; p.Add("finYear", finYear); }
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT * FROM [Asset_InvTransfer] WHERE [InvTransfer_ID] = @id", new { id });
    }

    public async Task<IEnumerable<dynamic>> GetPendingAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>(@"
            SELECT
                i.[InvTransfer_ID]             AS itemId,
                i.[InventoryID]                AS inventoryId,
                i.[Description]                AS description,
                i.[PurchaseAmount]             AS purchaseAmount,
                i.[AssetCategory_ID]           AS assetCategoryId,
                COALESCE(cat.[AssetCategoryDesc], '-') AS categoryDescription,
                i.[AssetClass_ID]              AS assetClassId,
                COALESCE(cls.[AssetClassDesc], '-') AS classDescription,
                i.[AssetCondition_ID]          AS assetConditionId,
                i.[AssetStatus_ID]             AS assetStatusId,
                i.[InvoiceDate]                AS invoiceDate,
                i.[UsefulLifeMonthComponent]   AS usefulLifeMonths,
                i.[HighValueID]                AS highValueId,
                i.[Quantity]                   AS quantity,
                i.[DateCaptured]               AS dateCaptured
            FROM [Asset_InvTransfer] i
            LEFT JOIN [Const_AssetCategory_sys] cat ON i.[AssetCategory_ID] = cat.[AssetCategoryID]
            LEFT JOIN [Const_AssetClass_sys]    cls ON i.[AssetClass_ID]   = cls.[AssetClass_ID]
            WHERE i.[AssetRegisterItem_ID] IS NULL
            ORDER BY i.[InvTransfer_ID] ASC");
    }
}
