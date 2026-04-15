using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class ScmTransferService : IScmTransferService
{
    private readonly DbConnectionFactory _db;
    public ScmTransferService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(string? finYear)
    {
        using var conn = _db.CreateConnection();
        var sql = "SELECT * FROM [Asset_SCMTransfer] WHERE 1=1";
        var p = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(finYear)) { sql += " AND [FinYear] = @finYear"; p.Add("finYear", finYear); }
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT * FROM [Asset_SCMTransfer] WHERE [SCMTransfer_ID] = @id", new { id });
    }

    public async Task<IEnumerable<dynamic>> GetPendingAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>(@"
            SELECT
                s.[SCMTransfer_ID]             AS transferId,
                s.[GRN_ID]                     AS grnId,
                COALESCE(cat.[AssetCategoryDesc], '') AS categoryDescription,
                COALESCE(cls.[AssetClassDesc], '')    AS classDescription,
                s.[Description]                AS description,
                s.[CurrentAmount]              AS currentAmount,
                s.[AssetCategory_ID]           AS assetCategoryId,
                s.[AssetClass_ID]              AS assetClassId,
                s.[Asset_SubCategory_ID]       AS assetSubCategoryId,
                s.[AssetType_ID]               AS assetTypeId,
                s.[AssetStatus_ID]             AS assetStatusId,
                s.[AssetCondition_ID]          AS assetConditionId,
                s.[MunicipalDepartment_ID]     AS municipalDepartmentId,
                s.[Custodian_ID]               AS custodianId,
                s.[Town_ID]                    AS townId,
                s.[Street_ID]                  AS streetId,
                s.[Building_ID]                AS buildingId,
                s.[Ward_ID]                    AS wardId,
                s.[Room_ID]                    AS roomId,
                s.[Barcode]                    AS barcode,
                s.[SerialNumber]               AS serialNumber,
                s.[RegistrationNumber]         AS registrationNumber,
                s.[Make]                       AS make,
                s.[Model]                      AS model,
                s.[SupplierName]               AS supplierName,
                s.[SupplierCode]               AS supplierCode,
                s.[InvoiceNumber]              AS invoiceNo,
                s.[InvoiceDate]                AS invoiceDate,
                s.[OrderNumber]                AS orderNumber,
                s.[UsefulLifeYearComponent]    AS usefulLifeYears,
                s.[UsefulLifeMonthComponent]   AS usefulLifeMonths,
                s.[SCMItem_ID]                 AS scmItemId,
                s.[DateCaptured]               AS dateCaptured,
                cls.[TypeID]                   AS classTypeId,
                cls.[AssetCategoryID]          AS classCategoryId,
                cls.[Asset_SubCategory_ID]     AS classSubCategoryId,
                cls.[AssetMeasurement_ID]      AS classMeasurementTypeId,
                cls.[AssetStatus_ID]           AS classAssetStatusId,
                cls.[UsefulLifeInMonths]       AS classUsefulLifeMonths
            FROM [Asset_SCMTransfer] s
            LEFT JOIN [Const_AssetCategory_sys] cat ON cat.[AssetCategoryID] = s.[AssetCategory_ID]
            LEFT JOIN [Const_AssetClass_sys]    cls ON cls.[AssetClass_ID]   = s.[AssetClass_ID]
            WHERE s.[CurrentAmount] IS NOT NULL
              AND s.[AssetRegisterItem_ID] IS NULL
            ORDER BY s.[SCMTransfer_ID] ASC");
    }
}
