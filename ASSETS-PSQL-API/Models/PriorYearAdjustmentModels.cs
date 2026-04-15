namespace AssetManagement.Models;

public class PriorYearAdjustment
{
    public int PriorYearAdjustment_ID { get; set; }
    public int? AssetRegisterItem_ID { get; set; }
    public string? AdjustmentTypeCode { get; set; }
    public string? Status { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public string? FinYear { get; set; }

    public decimal? NewCostAmount { get; set; }
    public decimal? NewValuationAmount { get; set; }
    public decimal? NewRUL { get; set; }
    public DateTime? NewAcquisitionDate { get; set; }
    public decimal? NewResidualValue { get; set; }
    public DateTime? ResidualValueEffectiveDate { get; set; }
    public decimal? NewImpairmentAmount { get; set; }
    public DateTime? ImpairmentEffectiveDate { get; set; }
    public DateTime? DisposalDate { get; set; }
    public string? DisposalReason { get; set; }
    public decimal? DisposalProceeds { get; set; }

    public decimal? SnapshotCost { get; set; }
    public decimal? SnapshotAccDep { get; set; }
    public decimal? SnapshotAccImp { get; set; }
    public decimal? SnapshotCarryingAmount { get; set; }
    public decimal? SnapshotResidualValue { get; set; }
    public decimal? SnapshotRUL { get; set; }
    public decimal? SnapshotRR { get; set; }
    public decimal? SnapshotEUL { get; set; }

    public decimal? CurrentPeriod_CostDelta { get; set; }
    public decimal? CurrentPeriod_AccDepDelta { get; set; }
    public decimal? CurrentPeriod_AccImpDelta { get; set; }
    public decimal? CurrentPeriod_RRDelta { get; set; }
    public decimal? CurrentPeriod_DepChargeDelta { get; set; }

    public decimal? ComparativePeriod_CostDelta { get; set; }
    public decimal? ComparativePeriod_AccDepDelta { get; set; }
    public decimal? ComparativePeriod_AccImpDelta { get; set; }
    public decimal? ComparativePeriod_RRDelta { get; set; }
    public decimal? ComparativePeriod_DepChargeDelta { get; set; }

    public decimal? PriorPeriods_CostDelta { get; set; }
    public decimal? PriorPeriods_AccDepDelta { get; set; }
    public decimal? PriorPeriods_AccImpDelta { get; set; }
    public decimal? PriorPeriods_RRDelta { get; set; }
    public decimal? PriorPeriods_DepChargeDelta { get; set; }

    public bool? HasResidualValueWarning { get; set; }
    public bool? HasImpairmentWarning { get; set; }

    public int? DrPlanProjectItemID { get; set; }
    public int? CrPlanProjectItemID { get; set; }

    public int? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? RejectionReason { get; set; }
    public int? RejectedBy { get; set; }
    public DateTime? RejectedDate { get; set; }
    public string? Comments { get; set; }

    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }

    public string? AssetDescription { get; set; }
    public decimal? AssetCost { get; set; }
    public decimal? AssetAccDep { get; set; }
    public decimal? AssetAccImp { get; set; }
    public decimal? AssetCarryingAmount { get; set; }
    public decimal? AssetRR { get; set; }
    public decimal? AssetRUL { get; set; }
    public decimal? AssetResidualValue { get; set; }
}

public class PriorYearAdjustmentDocument
{
    public int Document_ID { get; set; }
    public int? PriorYearAdjustment_ID { get; set; }
    public string? FileName { get; set; }
    public string? StoredFileName { get; set; }
    public int? FileSizeBytes { get; set; }
    public string? ContentType { get; set; }
    public DateTime? UploadedDate { get; set; }
    public int? UploadedBy { get; set; }
}

public class PriorYearCalculateRequest
{
    public string? AdjustmentTypeCode { get; set; }
    public int AssetRegisterItemId { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public string? FinYear { get; set; }

    public decimal? NewCostAmount { get; set; }
    public decimal? NewValuationAmount { get; set; }
    public decimal? NewRUL { get; set; }
    public DateTime? NewAcquisitionDate { get; set; }
    public decimal? NewResidualValue { get; set; }
    public DateTime? ResidualValueEffectiveDate { get; set; }
    public decimal? NewImpairmentAmount { get; set; }
    public DateTime? ImpairmentEffectiveDate { get; set; }
    public DateTime? DisposalDate { get; set; }
    public string? DisposalReason { get; set; }
    public decimal? DisposalProceeds { get; set; }
}

public class PriorYearCalculationResult
{
    public decimal CurrentPeriod_CostDelta { get; set; }
    public decimal CurrentPeriod_AccDepDelta { get; set; }
    public decimal CurrentPeriod_AccImpDelta { get; set; }
    public decimal CurrentPeriod_RRDelta { get; set; }
    public decimal CurrentPeriod_DepChargeDelta { get; set; }

    public decimal ComparativePeriod_CostDelta { get; set; }
    public decimal ComparativePeriod_AccDepDelta { get; set; }
    public decimal ComparativePeriod_AccImpDelta { get; set; }
    public decimal ComparativePeriod_RRDelta { get; set; }
    public decimal ComparativePeriod_DepChargeDelta { get; set; }

    public decimal PriorPeriods_CostDelta { get; set; }
    public decimal PriorPeriods_AccDepDelta { get; set; }
    public decimal PriorPeriods_AccImpDelta { get; set; }
    public decimal PriorPeriods_RRDelta { get; set; }
    public decimal PriorPeriods_DepChargeDelta { get; set; }

    public bool HasResidualValueWarning { get; set; }
    public bool HasImpairmentWarning { get; set; }

    public List<PriorYearJournalLine> JournalLines { get; set; } = new();
}

public class PriorYearJournalLine
{
    public string Period { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal? Debit { get; set; }
    public decimal? Credit { get; set; }
    public string Account { get; set; } = "";
}

public class PriorYearSubmitRequest
{
    public int AssetRegisterItemId { get; set; }
    public string? AdjustmentTypeCode { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public string? FinYear { get; set; }

    public decimal? NewCostAmount { get; set; }
    public decimal? NewValuationAmount { get; set; }
    public decimal? NewRUL { get; set; }
    public DateTime? NewAcquisitionDate { get; set; }
    public decimal? NewResidualValue { get; set; }
    public DateTime? ResidualValueEffectiveDate { get; set; }
    public decimal? NewImpairmentAmount { get; set; }
    public DateTime? ImpairmentEffectiveDate { get; set; }
    public DateTime? DisposalDate { get; set; }
    public string? DisposalReason { get; set; }
    public decimal? DisposalProceeds { get; set; }

    public PriorYearCalculationResult? CalculationResult { get; set; }

    public int? DrPlanProjectItemID { get; set; }
    public int? CrPlanProjectItemID { get; set; }
    public string? Comments { get; set; }
}

public class PriorYearApproveRequest
{
    public string? Comments { get; set; }
}

public class PriorYearRejectRequest
{
    public string? RejectionReason { get; set; }
}

public class AssetDetailsForPriorYear
{
    public int AssetRegisterItem_ID { get; set; }
    public string? Description { get; set; }
    public decimal PurchaseAmount { get; set; }
    public decimal AccumulatedDepreciationClosingBalance { get; set; }
    public decimal AccumulatedImpairmentClosingBalance { get; set; }
    public decimal CarryingAmountClosingBalance { get; set; }
    public decimal ResidualValue { get; set; }
    public decimal RemainingUsefulLife { get; set; }
    public decimal UsefullLife { get; set; }
    public decimal RevaluationReserveClosingBalance { get; set; }
    public decimal CurrentReplacementCostCRC { get; set; }
    public DateTime? InserviceDate { get; set; }
    public DateTime? AcquisitionDate { get; set; }
    public int? AssetType_ID { get; set; }
    public int? AssetCategory_ID { get; set; }
    public int? Asset_SubCategory_ID { get; set; }
    public int? MeasurementType_ID { get; set; }
    public string? AssetTypeDesc { get; set; }
    public string? AssetCategoryDesc { get; set; }
    public string? AssetSubCategoryDescription { get; set; }
    public string? MeasurementTypeDesc { get; set; }
    public string? FinancialStatusDesc { get; set; }
}
