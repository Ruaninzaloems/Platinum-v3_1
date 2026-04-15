using System.Data;
using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Repositories;

public class ScmUnbundlingDetailRepository : IScmUnbundlingDetailRepository
{
    private readonly DbConnectionFactory _db;

    public ScmUnbundlingDetailRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ScmUnbundlingDetail>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<ScmUnbundlingDetail>("SELECT * FROM [SCM_AssetUnbundling_Detail]");
    }

    public async Task<ScmUnbundlingDetail?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<ScmUnbundlingDetail>("SELECT * FROM [SCM_AssetUnbundling_Detail] WHERE [AssetContractDetail_ID] = @id", new { id });
    }

    public async Task<int> CreateAsync(ScmUnbundlingDetail entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "INSERT INTO [SCM_AssetUnbundling_Detail] ([AssetContractHeaderId], [RegisterItemsId], [RequisitionBillOfQuantityId], [QuotationServiceDetailId], [InformalTenderServiceDetailId], [InvoiceDetailId], [CreditDebtNoteDetailId], [ProjectItemId], [SCOAItem], [GoodsServiceDescription], [UOM], [Quantity], [Rate], [Amount], [IsAsset], [AssetDescription], [CIDMS_Sub_Component_Type], [Asset_Type], [Asset_Category], [Asset_Sub_Category], [Measurement_Type], [Asset_Status], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID], [ContractDetailItemId]) OUTPUT INSERTED.[AssetContractDetail_ID] VALUES (@AssetContractHeaderId, @RegisterItemsId, @RequisitionBillOfQuantityId, @QuotationServiceDetailId, @InformalTenderServiceDetailId, @InvoiceDetailId, @CreditDebtNoteDetailId, @ProjectItemId, @SCOAItem, @GoodsServiceDescription, @UOM, @Quantity, @Rate, @Amount, @IsAsset, @AssetDescription, @CIDMS_Sub_Component_Type, @Asset_Type, @Asset_Category, @Asset_Sub_Category, @Measurement_Type, @Asset_Status, @Enabled, @DateCaptured, @CapturerID, @DateModified, @ModifierID, @ContractDetailItemId)";
        return await conn.ExecuteScalarAsync<int>(sql, entity);
    }

    public async Task<bool> UpdateAsync(ScmUnbundlingDetail entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "UPDATE [SCM_AssetUnbundling_Detail] SET [AssetContractHeaderId] = @AssetContractHeaderId, [RegisterItemsId] = @RegisterItemsId, [RequisitionBillOfQuantityId] = @RequisitionBillOfQuantityId, [QuotationServiceDetailId] = @QuotationServiceDetailId, [InformalTenderServiceDetailId] = @InformalTenderServiceDetailId, [InvoiceDetailId] = @InvoiceDetailId, [CreditDebtNoteDetailId] = @CreditDebtNoteDetailId, [ProjectItemId] = @ProjectItemId, [SCOAItem] = @SCOAItem, [GoodsServiceDescription] = @GoodsServiceDescription, [UOM] = @UOM, [Quantity] = @Quantity, [Rate] = @Rate, [Amount] = @Amount, [IsAsset] = @IsAsset, [AssetDescription] = @AssetDescription, [CIDMS_Sub_Component_Type] = @CIDMS_Sub_Component_Type, [Asset_Type] = @Asset_Type, [Asset_Category] = @Asset_Category, [Asset_Sub_Category] = @Asset_Sub_Category, [Measurement_Type] = @Measurement_Type, [Asset_Status] = @Asset_Status, [Enabled] = @Enabled, [DateCaptured] = @DateCaptured, [CapturerID] = @CapturerID, [DateModified] = @DateModified, [ModifierID] = @ModifierID, [ContractDetailItemId] = @ContractDetailItemId WHERE [AssetContractDetail_ID] = @AssetContractDetail_ID";
        return await conn.ExecuteAsync(sql, entity) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM [SCM_AssetUnbundling_Detail] WHERE [AssetContractDetail_ID] = @id", new { id }) > 0;
    }
}
