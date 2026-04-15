using System.Data;
using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Repositories;

public class ScmContractDetailItemsRepository : IScmContractDetailItemsRepository
{
    private readonly DbConnectionFactory _db;

    public ScmContractDetailItemsRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ScmContractDetailItems>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<ScmContractDetailItems>("SELECT * FROM [SCM_ContractDetailItems]");
    }

    public async Task<ScmContractDetailItems?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<ScmContractDetailItems>("SELECT * FROM [SCM_ContractDetailItems] WHERE [ContractDetailItems_ID] = @id", new { id });
    }

    public async Task<int> CreateAsync(ScmContractDetailItems entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "INSERT INTO [SCM_ContractDetailItems] ([ContractID], [RequisitionDetailID], [Cost], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID], [VatAmount], [TotalAmount], [VatExempt], [ServiceItem], [GoodsItem], [PreviousContractDetailItemsID], [BillOfQuantityID], [VariationAmount], [OriginalTotalAmount], [VoidAmount], [OriginalVATAmount], [VoidVATAmount], [PlanProjectItemId], [IsScopedExtensionVariation]) OUTPUT INSERTED.[ContractDetailItems_ID] VALUES (@ContractID, @RequisitionDetailID, @Cost, @Enabled, @DateCaptured, @CapturerID, @DateModified, @ModifierID, @VatAmount, @TotalAmount, @VatExempt, @ServiceItem, @GoodsItem, @PreviousContractDetailItemsID, @BillOfQuantityID, @VariationAmount, @OriginalTotalAmount, @VoidAmount, @OriginalVATAmount, @VoidVATAmount, @PlanProjectItemId, @IsScopedExtensionVariation)";
        return await conn.ExecuteScalarAsync<int>(sql, entity);
    }

    public async Task<bool> UpdateAsync(ScmContractDetailItems entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "UPDATE [SCM_ContractDetailItems] SET [ContractID] = @ContractID, [RequisitionDetailID] = @RequisitionDetailID, [Cost] = @Cost, [Enabled] = @Enabled, [DateCaptured] = @DateCaptured, [CapturerID] = @CapturerID, [DateModified] = @DateModified, [ModifierID] = @ModifierID, [VatAmount] = @VatAmount, [TotalAmount] = @TotalAmount, [VatExempt] = @VatExempt, [ServiceItem] = @ServiceItem, [GoodsItem] = @GoodsItem, [PreviousContractDetailItemsID] = @PreviousContractDetailItemsID, [BillOfQuantityID] = @BillOfQuantityID, [VariationAmount] = @VariationAmount, [OriginalTotalAmount] = @OriginalTotalAmount, [VoidAmount] = @VoidAmount, [OriginalVATAmount] = @OriginalVATAmount, [VoidVATAmount] = @VoidVATAmount, [PlanProjectItemId] = @PlanProjectItemId, [IsScopedExtensionVariation] = @IsScopedExtensionVariation WHERE [ContractDetailItems_ID] = @ContractDetailItems_ID";
        return await conn.ExecuteAsync(sql, entity) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM [SCM_ContractDetailItems] WHERE [ContractDetailItems_ID] = @id", new { id }) > 0;
    }
}
