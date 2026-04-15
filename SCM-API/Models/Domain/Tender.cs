using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("SCM_Tender")]
public class Tender
{
    [Key]
    [Column("Tender_ID")]
    public int TenderId { get; set; }

    [Column("TenderNumber")]
    public string? TenderNumber { get; set; }

    [Column("TenderDescription")]
    public string? TenderDescription { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("TenderManagerID")]
    public int? TenderManagerId { get; set; }

    [Column("TenderTypeID")]
    public int? TenderTypeId { get; set; }

    [Column("TenderEstimate")]
    public decimal? TenderEstimate { get; set; }

    [Column("BidSpecification")]
    public string? BidSpecification { get; set; }

    [Column("AdvertisementDate")]
    public DateTime? AdvertisementDate { get; set; }

    [Column("ClosingDate")]
    public DateTime? ClosingDate { get; set; }

    [Column("BidEvaluationDate")]
    public DateTime? BidEvaluationDate { get; set; }

    [Column("BidAdjudicationDate")]
    public DateTime? BidAdjudicationDate { get; set; }

    [Column("ScopeOfWork")]
    public string? ScopeOfWork { get; set; }

    [Column("GeneralCondition")]
    public string? GeneralCondition { get; set; }

    [Column("SpecificCondition")]
    public string? SpecificCondition { get; set; }

    [Column("EvaluationMethodID")]
    public int? EvaluationMethodId { get; set; }

    [Column("TenderCancel")]
    public bool? TenderCancel { get; set; }

    [Column("ReferenceNumber")]
    public string? ReferenceNumber { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    [Column("SingleEnvelope")]
    public bool? SingleEnvelope { get; set; }

    [Column("TwoEnvelope")]
    public bool? TwoEnvelope { get; set; }

    [Column("RequisitionID")]
    public int? RequisitionId { get; set; }

    [Column("IsRateBasedContract")]
    public bool? IsRateBasedContract { get; set; }

    [Column("IsPanelOfVendor")]
    public bool? IsPanelOfVendor { get; set; }

    [Column("ActualBidEvalutionDate")]
    public DateTime? ActualBidEvaluationDate { get; set; }

    [Column("SysterVendorID")]
    public int? SystemVendorId { get; set; }

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

    public virtual ICollection<TenderVendor> TenderVendors { get; set; } = new List<TenderVendor>();
    public virtual ICollection<TenderDocument> TenderDocuments { get; set; } = new List<TenderDocument>();
    public virtual ICollection<TenderEvaluation> TenderEvaluations { get; set; } = new List<TenderEvaluation>();
    public virtual ICollection<TenderAdjudication> TenderAdjudications { get; set; } = new List<TenderAdjudication>();
}

[Table("SCM_TenderVendor")]
public class TenderVendor
{
    [Key]
    [Column("TenderVendor_ID")]
    public int TenderVendorId { get; set; }

    [Column("TenderID")]
    public int? TenderId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("TenderAmount")]
    public decimal? TenderAmount { get; set; }

    [Column("VatAmount")]
    public decimal? VatAmount { get; set; }

    [Column("TotalAmount")]
    public decimal? TotalAmount { get; set; }

    [Column("TenderRate")]
    public decimal? TenderRate { get; set; }

    [Column("TenderRateDescription")]
    public string? TenderRateDescription { get; set; }

    [Column("CSDVendorName")]
    public string? CsdVendorName { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [ForeignKey("TenderId")]
    public virtual Tender? Tender { get; set; }
}

[Table("SCM_TenderEvaluation")]
public class TenderEvaluation
{
    [Key]
    [Column("TenderEvaluation_ID")]
    public int TenderEvaluationId { get; set; }

    [Column("TenderID")]
    public int? TenderId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("BBBEEPoints")]
    public decimal? BbbeePoints { get; set; }

    [Column("PricePoints")]
    public decimal? PricePoints { get; set; }

    [Column("TotalPoints")]
    public decimal? TotalPoints { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("CSDVendorName")]
    public string? CsdVendorName { get; set; }

    [ForeignKey("TenderId")]
    public virtual Tender? Tender { get; set; }
}

[Table("SCM_TenderAdjudication")]
public class TenderAdjudication
{
    [Key]
    [Column("TenderAdjudication_ID")]
    public int TenderAdjudicationId { get; set; }

    [Column("TenderRequisitionLinkID")]
    public int? TenderRequisitionLinkId { get; set; }

    [Column("TenderID")]
    public int? TenderId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("BBBEEPoints")]
    public decimal? BbbeePoints { get; set; }

    [Column("PricePoints")]
    public decimal? PricePoints { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("UnitCost")]
    public decimal? UnitCost { get; set; }

    [Column("VatUnitCost")]
    public decimal? VatUnitCost { get; set; }

    [Column("TotalUnitCost")]
    public decimal? TotalUnitCost { get; set; }

    [Column("BillOfQuantityId")]
    public int? BillOfQuantityId { get; set; }

    [Column("CSDVendorName")]
    public string? CsdVendorName { get; set; }

    [Column("VATApportionmentPercentage")]
    public decimal? VatApportionmentPercentage { get; set; }

    [Column("VATApportionmentAmount")]
    public decimal? VatApportionmentAmount { get; set; }

    [ForeignKey("TenderId")]
    public virtual Tender? Tender { get; set; }
}

[Table("SCM_TenderDocuments")]
public class TenderDocument
{
    [Key]
    [Column("TenderDocument_ID")]
    public int TenderDocumentId { get; set; }

    [Column("TenderID")]
    public int? TenderId { get; set; }

    [Column("DocumentName")]
    public string? DocumentName { get; set; }

    [Column("DocumentType")]
    public string? DocumentType { get; set; }

    [Column("DocumentPath")]
    public string? DocumentPath { get; set; }

    [Column("Compulsory")]
    public bool? Compulsory { get; set; }

    [Column("FileName")]
    public string? FileName { get; set; }

    [Column("FileExtension")]
    public string? FileExtension { get; set; }

    [ForeignKey("TenderId")]
    public virtual Tender? Tender { get; set; }
}

[Table("SCM_TenderAwardedVendor")]
public class TenderAwardedVendor
{
    [Key]
    [Column("TenderAwardedVendor_ID")]
    public int TenderAwardedVendorId { get; set; }

    [Column("TenderID")]
    public int? TenderId { get; set; }

    [Column("SuccessfulVendorID")]
    public int? SuccessfulVendorId { get; set; }

    [Column("SystemRecommendedVendorID")]
    public int? SystemRecommendedVendorId { get; set; }

    [Column("NonRecommendedSPReason")]
    public string? NonRecommendedSpReason { get; set; }
}

[Table("SCM_TenderFunctionality")]
public class TenderFunctionality
{
    [Key]
    [Column("TenderFunctionality_ID")]
    public int TenderFunctionalityId { get; set; }

    [Column("TenderID")]
    public int? TenderId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("CriteriaName")]
    public string? CriteriaName { get; set; }

    [Column("Score1")]
    public decimal? Score1 { get; set; }

    [Column("Score2")]
    public decimal? Score2 { get; set; }

    [Column("Score3")]
    public decimal? Score3 { get; set; }

    [Column("Score4")]
    public decimal? Score4 { get; set; }

    [Column("Score5")]
    public decimal? Score5 { get; set; }

    [Column("AverageScore")]
    public decimal? AverageScore { get; set; }

    [Column("WeightedScore")]
    public decimal? WeightedScore { get; set; }
}
