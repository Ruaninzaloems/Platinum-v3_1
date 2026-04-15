using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("SCM_ContractDetails")]
public class ContractDetail
{
    [Key]
    [Column("ContractDetails_ID")]
    public int ContractDetailsId { get; set; }

    [Column("ContractID")]
    public int? ContractId { get; set; }

    [Column("TenderID")]
    public int? TenderId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("ContractNumber")]
    public string? ContractNumber { get; set; }

    [Column("ContractDescription")]
    public string? ContractDescription { get; set; }

    [Column("ContractValue")]
    public decimal? ContractValue { get; set; }

    [Column("StartDate")]
    public DateTime? StartDate { get; set; }

    [Column("EndDate")]
    public DateTime? EndDate { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("ContractType")]
    public string? ContractType { get; set; }

    [Column("RegionID")]
    public int? RegionId { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("ServiceDescription")]
    public string? ServiceDescription { get; set; }

    [Column("SCOAItemID")]
    public int? ScoaItemId { get; set; }

    [Column("SCOAFundID")]
    public int? ScoaFundId { get; set; }

    [Column("SCOAFunctionID")]
    public int? ScoaFunctionId { get; set; }

    [Column("SCOAProjectID")]
    public int? ScoaProjectId { get; set; }

    [Column("SCOACostCentreID")]
    public int? ScoaCostCentreId { get; set; }

    [Column("SCOARegionID")]
    public int? ScoaRegionId { get; set; }

    [Column("RetentionPercentage")]
    public decimal? RetentionPercentage { get; set; }

    [Column("GuaranteePercentage")]
    public decimal? GuaranteePercentage { get; set; }

    [Column("PerformanceBondPercentage")]
    public decimal? PerformanceBondPercentage { get; set; }

    [Column("IsRateBased")]
    public bool? IsRateBased { get; set; }

    [Column("PanelOfVendors")]
    public bool? PanelOfVendors { get; set; }

    [Column("QuantityDriven")]
    public bool? QuantityDriven { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    public virtual ICollection<ContractDocument> ContractDocuments { get; set; } = new List<ContractDocument>();
    public virtual ICollection<ContractMilestone> Milestones { get; set; } = new List<ContractMilestone>();
    public virtual ICollection<PaymentCertificate> PaymentCertificates { get; set; } = new List<PaymentCertificate>();
    public virtual ICollection<ContractDetailItem> DetailItems { get; set; } = new List<ContractDetailItem>();
}

[Table("SCM_ContractDocuments")]
public class ContractDocument
{
    [Key]
    [Column("ContractDocument_ID")]
    public int ContractDocumentId { get; set; }

    [Column("ContractDetails_ID")]
    public int? ContractDetailsId { get; set; }

    [Column("DocumentName")]
    public string? DocumentName { get; set; }

    [Column("DocumentDescription")]
    public string? DocumentDescription { get; set; }

    [Column("FilePath")]
    public string? FilePath { get; set; }

    [Column("FileType")]
    public string? FileType { get; set; }

    [Column("FileSize")]
    public long? FileSize { get; set; }

    [ForeignKey("ContractDetailsId")]
    public virtual ContractDetail? ContractDetail { get; set; }
}

[Table("SCM_PaymentCertificate")]
public class PaymentCertificate
{
    [Key]
    [Column("PaymentCertificate_ID")]
    public int PaymentCertificateId { get; set; }

    [Column("ContractID")]
    public int? ContractId { get; set; }

    [Column("CertificateNumber")]
    public string? CertificateNumber { get; set; }

    [Column("CertificateSequence")]
    public int? CertificateSequence { get; set; }

    [Column("GrossValue")]
    public decimal? GrossValue { get; set; }

    [Column("RetentionValue")]
    public decimal? RetentionValue { get; set; }

    [Column("PenaltyValue")]
    public decimal? PenaltyValue { get; set; }

    [Column("NetValue")]
    public decimal? NetValue { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("ApprovedBy")]
    public int? ApprovedBy { get; set; }

    [Column("ApprovedDate")]
    public DateTime? ApprovedDate { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [ForeignKey("ContractId")]
    public virtual ContractDetail? ContractDetail { get; set; }

    public virtual ICollection<PaymentCertificateDetail> Details { get; set; } = new List<PaymentCertificateDetail>();
}

[Table("SCM_PaymentCertificateDetails")]
public class PaymentCertificateDetail
{
    [Key]
    [Column("PaymentCertificateDetail_ID")]
    public int PaymentCertificateDetailId { get; set; }

    [Column("PaymentCertificate_ID")]
    public int? PaymentCertificateId { get; set; }

    [Column("ContractID")]
    public int? ContractId { get; set; }

    [Column("ItemDescription")]
    public string? ItemDescription { get; set; }

    [Column("UnitOfMeasure")]
    public string? UnitOfMeasure { get; set; }

    [Column("ContractQuantity")]
    public decimal? ContractQuantity { get; set; }

    [Column("ContractRate")]
    public decimal? ContractRate { get; set; }

    [Column("CurrentQuantity")]
    public decimal? CurrentQuantity { get; set; }

    [Column("CurrentRate")]
    public decimal? CurrentRate { get; set; }

    [Column("CurrentAmount")]
    public decimal? CurrentAmount { get; set; }

    [Column("SCOAItemID")]
    public int? ScoaItemId { get; set; }

    [ForeignKey("PaymentCertificateId")]
    public virtual PaymentCertificate? PaymentCertificate { get; set; }
}

[Table("SCM_ContractMileStoneDetails")]
public class ContractMilestone
{
    [Key]
    [Column("MileStone_ID")]
    public int MilestoneId { get; set; }

    [Column("ContractID")]
    public int? ContractId { get; set; }

    [Column("MileStoneDescription")]
    public string? MilestoneDescription { get; set; }

    [Column("PlannedDate")]
    public DateTime? PlannedDate { get; set; }

    [Column("ActualDate")]
    public DateTime? ActualDate { get; set; }

    [Column("MileStoneValue")]
    public decimal? MilestoneValue { get; set; }

    [Column("PercentageOfContract")]
    public decimal? PercentageOfContract { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("IsCompleted")]
    public bool? IsCompleted { get; set; }

    [Column("CompletedDate")]
    public DateTime? CompletedDate { get; set; }

    [Column("CompletedBy")]
    public int? CompletedBy { get; set; }

    [Column("SequenceNo")]
    public int? SequenceNo { get; set; }

    [ForeignKey("ContractId")]
    public virtual ContractDetail? ContractDetail { get; set; }
}

[Table("SCM_ProcurementPlanNew")]
public class ProcurementPlan
{
    [Key]
    [Column("ProcurementPlan_ID")]
    public int ProcurementPlanId { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    [Column("PlanDescription")]
    public string? PlanDescription { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_Retention_Register")]
public class RetentionRegister
{
    [Key]
    [Column("RetentionRegister_ID")]
    public int RetentionRegisterId { get; set; }

    [Column("ContractID")]
    public int? ContractId { get; set; }

    [Column("InvoiceID")]
    public int? InvoiceId { get; set; }

    [Column("RetentionAmount")]
    public decimal? RetentionAmount { get; set; }

    [Column("ReleaseDate")]
    public DateTime? ReleaseDate { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("ReleasedBy")]
    public int? ReleasedBy { get; set; }

    [Column("ReleasedDate")]
    public DateTime? ReleasedDate { get; set; }
}

[Table("SCM_ContractExtensionAndVariation")]
public class ContractExtensionAndVariation
{
    [Key]
    [Column("ExtensionVariation_ID")]
    public int ExtensionVariationId { get; set; }

    [Column("ContractID")]
    public int? ContractId { get; set; }

    [Column("VariationType")]
    public string? VariationType { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("OriginalValue")]
    public decimal? OriginalValue { get; set; }

    [Column("VariationValue")]
    public decimal? VariationValue { get; set; }

    [Column("NewContractValue")]
    public decimal? NewContractValue { get; set; }

    [Column("OriginalEndDate")]
    public DateTime? OriginalEndDate { get; set; }

    [Column("NewEndDate")]
    public DateTime? NewEndDate { get; set; }

    [Column("Reason")]
    public string? Reason { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("ApprovedBy")]
    public int? ApprovedBy { get; set; }

    [Column("ApprovedDate")]
    public DateTime? ApprovedDate { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_ContractPerformance")]
public class ContractPerformance
{
    [Key]
    [Column("ContractPerformance_ID")]
    public int ContractPerformanceId { get; set; }

    [Column("ContractID")]
    public int? ContractId { get; set; }

    [Column("EvaluationDate")]
    public DateTime? EvaluationDate { get; set; }

    [Column("QualityScore")]
    public int? QualityScore { get; set; }

    [Column("DeliveryScore")]
    public int? DeliveryScore { get; set; }

    [Column("CostScore")]
    public int? CostScore { get; set; }

    [Column("ServiceScore")]
    public int? ServiceScore { get; set; }

    [Column("OverallScore")]
    public int? OverallScore { get; set; }

    [Column("Comments")]
    public string? Comments { get; set; }

    [Column("EvaluatedBy")]
    public int? EvaluatedBy { get; set; }

    [Column("Period")]
    public string? Period { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_ContractServiceRequest")]
public class ContractServiceRequest
{
    [Key]
    [Column("ContractServiceRequest_ID")]
    public int ContractServiceRequestId { get; set; }

    [Column("ContractID")]
    public int? ContractId { get; set; }

    [Column("RequestNumber")]
    public string? RequestNumber { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("RequestedValue")]
    public decimal? RequestedValue { get; set; }

    [Column("ApprovedValue")]
    public decimal? ApprovedValue { get; set; }

    [Column("RequestDate")]
    public DateTime? RequestDate { get; set; }

    [Column("RequiredDate")]
    public DateTime? RequiredDate { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("RequestedBy")]
    public int? RequestedBy { get; set; }

    [Column("ApprovedBy")]
    public int? ApprovedBy { get; set; }

    [Column("ApprovedDate")]
    public DateTime? ApprovedDate { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_ContractDetailItems")]
public class ContractDetailItem
{
    [Key]
    [Column("ContractDetailItem_ID")]
    public int ContractDetailItemId { get; set; }

    [Column("ContractDetails_ID")]
    public int? ContractDetailsId { get; set; }

    [Column("ItemDescription")]
    public string? ItemDescription { get; set; }

    [Column("UnitOfMeasure")]
    public string? UnitOfMeasure { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("UnitRate")]
    public decimal? UnitRate { get; set; }

    [Column("TotalAmount")]
    public decimal? TotalAmount { get; set; }

    [Column("SCOAItemID")]
    public int? ScoaItemId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("ContractDetailsId")]
    public virtual ContractDetail? ContractDetail { get; set; }
}
