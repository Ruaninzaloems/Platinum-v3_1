using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Repositories;

public class ScmContractRepository : IScmContractRepository
{
    private readonly DbConnectionFactory _db;
    public ScmContractRepository(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>(@"
            SELECT cd.[Contract_ID] AS contractId,
                   cd.[ContractNumber] AS contractNumber,
                   cd.[ContractDescription] AS contractDescription,
                   cd.[Contractvalue] AS contractValue,
                   cd.[VendorID] AS vendorId,
                   v.[VendorName] AS vendorName,
                   cd.[FinancialYear] AS financialYear,
                   cd.[PlannedStartDate] AS plannedStartDate,
                   cd.[PlannedEndDate] AS plannedEndDate,
                   cd.[ContractManagerID] AS contractManagerId,
                   COALESCE(e.[FirstName],'') + ' ' + COALESCE(e.[Surname],'') AS contractManagerName
            FROM [SCM_ContractDetails] cd
            LEFT JOIN [Cons_Vendor] v ON v.[Vendor_ID]=cd.[VendorID]
            LEFT JOIN [Payroll_Employee] e ON e.[Employee_ID]=cd.[ContractManagerID]
            WHERE cd.[Enabled]=1
            ORDER BY cd.[ContractNumber]");
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT cd.[Contract_ID] AS contractId,
                   cd.[ContractNumber] AS contractNumber,
                   cd.[ContractDescription] AS contractDescription,
                   cd.[Contractvalue] AS contractValue,
                   cd.[VendorID] AS vendorId,
                   v.[VendorName] AS vendorName,
                   cd.[FinancialYear] AS financialYear,
                   cd.[PlannedStartDate] AS plannedStartDate,
                   cd.[PlannedEndDate] AS plannedEndDate,
                   cd.[ContractManagerID] AS contractManagerId
            FROM [SCM_ContractDetails] cd
            LEFT JOIN [Cons_Vendor] v ON v.[Vendor_ID]=cd.[VendorID]
            WHERE cd.[Contract_ID]=@id", new { id });
    }

    public async Task<IEnumerable<dynamic>> GetUnbundlingItemsAsync(int contractId)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>(@"
            SELECT d.[AssetContractDetail_ID] AS assetContractDetailId,
                   d.[AssetContractHeaderId] AS assetContractHeaderId,
                   d.[ContractDetailItemId] AS contractDetailItemId,
                   d.[GoodsServiceDescription] AS goodsServiceDescription,
                   d.[UOM] AS uom,
                   d.[Quantity] AS quantity,
                   d.[Rate] AS rate,
                   d.[Amount] AS amount,
                   d.[IsAsset] AS isAsset,
                   d.[AssetDescription] AS assetDescription,
                   d.[CIDMS_Sub_Component_Type] AS cidmsSubComponentType,
                   d.[Asset_Type] AS assetType,
                   d.[Asset_Category] AS assetCategory,
                   d.[Asset_Sub_Category] AS assetSubCategory,
                   d.[Measurement_Type] AS measurementType,
                   d.[Asset_Status] AS assetStatus,
                   i.[BillOfQuantityID] AS billOfQuantityId
            FROM [SCM_AssetUnbundling_Detail] d
            INNER JOIN [SCM_ContractDetailItems] i ON i.[ContractDetailItems_ID]=d.[ContractDetailItemId]
            INNER JOIN [SCM_AssetUnbundling_Header] h ON h.[AssetContractHeader_ID]=d.[AssetContractHeaderId]
            WHERE i.[ContractID]=@contractId AND d.[Enabled]=1
            ORDER BY d.[AssetContractDetail_ID]", new { contractId });
    }
}
