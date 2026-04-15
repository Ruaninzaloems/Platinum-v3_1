using System.Data;
using Dapper;
using MssqlApi.Data;
using MssqlApi.Models;

namespace MssqlApi.Repositories;

public class ScmContractDetailsRepository : IScmContractDetailsRepository
{
    private readonly DbConnectionFactory _db;

    public ScmContractDetailsRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ScmContractDetails>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<ScmContractDetails>("SELECT * FROM [SCM_ContractDetails]");
    }

    public async Task<ScmContractDetails?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<ScmContractDetails>("SELECT * FROM [SCM_ContractDetails] WHERE [Contract_ID] = @id", new { id });
    }

    public async Task<int> CreateAsync(ScmContractDetails entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "INSERT INTO [SCM_ContractDetails] ([ContractNumber], [ContractDescription], [TenderQuotation], [TenderQuotationID], [ContractManagerID], [ServiceTypeID], [VoteID], [OrderNumber], [Contractvalue], [PlannedStartDate], [PlannedEndDate], [RevisedStartDate], [RevisedEndDate], [ActualStartDate], [ActualEndDate], [Enabled], [DateCaptured], [CapturerID], [DateModified], [ModifierID], [FinancialYear], [ContractStatusId], [Comments], [QuantityDriven], [VendorID], [ProcurementID], [RetentionIndicator], [RetentionRate], [ContractTypeID], [CurrentPeriodCommitment], [InvoicedAmount], [RevisedContractValue], [ContractType_ID], [Status_ID], [Milestone_ID], [VariationLimitID], [DebitOrderRef], [DebitOrderExpiryDate], [IsVoid], [VoidedDate], [VoidedReason], [VoidedBy], [ReferenceToID], [RetentionStartDate], [RetentionEndDate], [PayCertificateRequired], [LoanRegisterID], [LoanContract], [GuaranteeRate], [GuaranteeRateStartDate], [GuaranteeRateEndDate], [GuaranteeQuantityDriven], [GuaranteeIndicator], [SocialResponsibilityIndicator], [SocialResponsibilityRate], [TotalRetentionReleased], [TotalRetentionRetained], [TotalGuaranteeReleased], [TotalGuaranteeRetained], [PreviousContractID], [FinalApprovedBy], [FinalApprovedDate], [PanelOfVendors], [TotalRetentionWithholding], [TotalGuaranteeWithholding], [isContractTakeOn]) OUTPUT INSERTED.[Contract_ID] VALUES (@ContractNumber, @ContractDescription, @TenderQuotation, @TenderQuotationID, @ContractManagerID, @ServiceTypeID, @VoteID, @OrderNumber, @Contractvalue, @PlannedStartDate, @PlannedEndDate, @RevisedStartDate, @RevisedEndDate, @ActualStartDate, @ActualEndDate, @Enabled, @DateCaptured, @CapturerID, @DateModified, @ModifierID, @FinancialYear, @ContractStatusId, @Comments, @QuantityDriven, @VendorID, @ProcurementID, @RetentionIndicator, @RetentionRate, @ContractTypeID, @CurrentPeriodCommitment, @InvoicedAmount, @RevisedContractValue, @ContractType_ID, @Status_ID, @Milestone_ID, @VariationLimitID, @DebitOrderRef, @DebitOrderExpiryDate, @IsVoid, @VoidedDate, @VoidedReason, @VoidedBy, @ReferenceToID, @RetentionStartDate, @RetentionEndDate, @PayCertificateRequired, @LoanRegisterID, @LoanContract, @GuaranteeRate, @GuaranteeRateStartDate, @GuaranteeRateEndDate, @GuaranteeQuantityDriven, @GuaranteeIndicator, @SocialResponsibilityIndicator, @SocialResponsibilityRate, @TotalRetentionReleased, @TotalRetentionRetained, @TotalGuaranteeReleased, @TotalGuaranteeRetained, @PreviousContractID, @FinalApprovedBy, @FinalApprovedDate, @PanelOfVendors, @TotalRetentionWithholding, @TotalGuaranteeWithholding, @isContractTakeOn)";
        return await conn.ExecuteScalarAsync<int>(sql, entity);
    }

    public async Task<bool> UpdateAsync(ScmContractDetails entity)
    {
        using var conn = _db.CreateConnection();
        var sql = "UPDATE [SCM_ContractDetails] SET [ContractNumber] = @ContractNumber, [ContractDescription] = @ContractDescription, [TenderQuotation] = @TenderQuotation, [TenderQuotationID] = @TenderQuotationID, [ContractManagerID] = @ContractManagerID, [ServiceTypeID] = @ServiceTypeID, [VoteID] = @VoteID, [OrderNumber] = @OrderNumber, [Contractvalue] = @Contractvalue, [PlannedStartDate] = @PlannedStartDate, [PlannedEndDate] = @PlannedEndDate, [RevisedStartDate] = @RevisedStartDate, [RevisedEndDate] = @RevisedEndDate, [ActualStartDate] = @ActualStartDate, [ActualEndDate] = @ActualEndDate, [Enabled] = @Enabled, [DateCaptured] = @DateCaptured, [CapturerID] = @CapturerID, [DateModified] = @DateModified, [ModifierID] = @ModifierID, [FinancialYear] = @FinancialYear, [ContractStatusId] = @ContractStatusId, [Comments] = @Comments, [QuantityDriven] = @QuantityDriven, [VendorID] = @VendorID, [ProcurementID] = @ProcurementID, [RetentionIndicator] = @RetentionIndicator, [RetentionRate] = @RetentionRate, [ContractTypeID] = @ContractTypeID, [CurrentPeriodCommitment] = @CurrentPeriodCommitment, [InvoicedAmount] = @InvoicedAmount, [RevisedContractValue] = @RevisedContractValue, [ContractType_ID] = @ContractType_ID, [Status_ID] = @Status_ID, [Milestone_ID] = @Milestone_ID, [VariationLimitID] = @VariationLimitID, [DebitOrderRef] = @DebitOrderRef, [DebitOrderExpiryDate] = @DebitOrderExpiryDate, [IsVoid] = @IsVoid, [VoidedDate] = @VoidedDate, [VoidedReason] = @VoidedReason, [VoidedBy] = @VoidedBy, [ReferenceToID] = @ReferenceToID, [RetentionStartDate] = @RetentionStartDate, [RetentionEndDate] = @RetentionEndDate, [PayCertificateRequired] = @PayCertificateRequired, [LoanRegisterID] = @LoanRegisterID, [LoanContract] = @LoanContract, [GuaranteeRate] = @GuaranteeRate, [GuaranteeRateStartDate] = @GuaranteeRateStartDate, [GuaranteeRateEndDate] = @GuaranteeRateEndDate, [GuaranteeQuantityDriven] = @GuaranteeQuantityDriven, [GuaranteeIndicator] = @GuaranteeIndicator, [SocialResponsibilityIndicator] = @SocialResponsibilityIndicator, [SocialResponsibilityRate] = @SocialResponsibilityRate, [TotalRetentionReleased] = @TotalRetentionReleased, [TotalRetentionRetained] = @TotalRetentionRetained, [TotalGuaranteeReleased] = @TotalGuaranteeReleased, [TotalGuaranteeRetained] = @TotalGuaranteeRetained, [PreviousContractID] = @PreviousContractID, [FinalApprovedBy] = @FinalApprovedBy, [FinalApprovedDate] = @FinalApprovedDate, [PanelOfVendors] = @PanelOfVendors, [TotalRetentionWithholding] = @TotalRetentionWithholding, [TotalGuaranteeWithholding] = @TotalGuaranteeWithholding, [isContractTakeOn] = @isContractTakeOn WHERE [Contract_ID] = @Contract_ID";
        return await conn.ExecuteAsync(sql, entity) > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.ExecuteAsync("DELETE FROM [SCM_ContractDetails] WHERE [Contract_ID] = @id", new { id }) > 0;
    }
}
