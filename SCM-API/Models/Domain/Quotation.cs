using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("SCM_Quotation")]
public class Quotation
{
    [Key]
    [Column("Quotation_ID")]
    public int QuotationId { get; set; }

    [Column("QuotationNumber")]
    public string? QuotationNumber { get; set; }

    [Column("QuotationDescription")]
    public string? QuotationDescription { get; set; }

    [Column("Comments")]
    public string? Comments { get; set; }

    [Column("ServiceTypeID")]
    public int? ServiceTypeId { get; set; }

    [Column("RegionID")]
    public int? RegionId { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("SubDepartmentID")]
    public int? SubDepartmentId { get; set; }

    [Column("ProvenceID")]
    public int? ProvinceId { get; set; }

    [Column("TownID")]
    public int? TownId { get; set; }

    [Column("SubSectorID")]
    public int? SubSectorId { get; set; }

    [Column("ClosingDate")]
    public DateTime? ClosingDate { get; set; }

    [Column("ClosingTime")]
    public string? ClosingTime { get; set; }

    [Column("PersonName")]
    public string? PersonName { get; set; }

    [Column("PersonEmail")]
    public string? PersonEmail { get; set; }

    [Column("EstimatedCost")]
    public decimal? EstimatedCost { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    [Column("StatusId")]
    public int? StatusId { get; set; }

    [Column("ReQuotation")]
    public bool? ReQuotation { get; set; }

    [Column("PreviousQuotationId")]
    public int? PreviousQuotationId { get; set; }

    [Column("Approved")]
    public bool? Approved { get; set; }

    [Column("Cancel")]
    public bool? Cancel { get; set; }

    [Column("ApprovedReason")]
    public string? ApprovedReason { get; set; }

    [Column("CancelReason")]
    public string? CancelReason { get; set; }

    [Column("ApprovedBy")]
    public int? ApprovedBy { get; set; }

    [Column("ApprovedDate")]
    public DateTime? ApprovedDate { get; set; }

    [Column("CancelBy")]
    public int? CancelBy { get; set; }

    [Column("CancelDate")]
    public DateTime? CancelDate { get; set; }

    [Column("OrderNo")]
    public string? OrderNo { get; set; }

    [Column("CompulsoryCertifications")]
    public string? CompulsoryCertifications { get; set; }

    [Column("ServiceContract")]
    public bool? ServiceContract { get; set; }

    [Column("IsLocalProductContent")]
    public bool? IsLocalProductContent { get; set; }

    [Column("IsCIDB")]
    public bool? IsCidb { get; set; }

    [Column("SiteInspectionDate")]
    public DateTime? SiteInspectionDate { get; set; }

    [Column("TechnicalContact")]
    public string? TechnicalContact { get; set; }

    [Column("TechnicalContactEmail")]
    public string? TechnicalContactEmail { get; set; }

    [Column("TechnicalContactPhone")]
    public string? TechnicalContactPhone { get; set; }

    [Column("SCMContactId")]
    public int? ScmContactId { get; set; }

    [Column("SCMContactPerson")]
    public string? ScmContactPerson { get; set; }

    [Column("SCMContactEmail")]
    public string? ScmContactEmail { get; set; }

    [Column("SCMContactPhone")]
    public string? ScmContactPhone { get; set; }

    [Column("QuotationTOE")]
    public string? QuotationToe { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerId")]
    public int? CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierId")]
    public int? ModifierId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    public virtual ICollection<QuotationServiceDetail> ServiceDetails { get; set; } = new List<QuotationServiceDetail>();
    public virtual ICollection<QuotationVendor> Vendors { get; set; } = new List<QuotationVendor>();
}

[Table("SCM_QuotationServiceDetail")]
public class QuotationServiceDetail
{
    [Key]
    [Column("QuotationServiceDel_ID")]
    public int QuotationServiceDelId { get; set; }

    [Column("QuotationID")]
    public int? QuotationId { get; set; }

    [Column("RequisitionDetailID")]
    public int? RequisitionDetailId { get; set; }

    [Column("ServiceDetailDesc")]
    public string? ServiceDetailDesc { get; set; }

    [Column("UnitPrice")]
    public decimal? UnitPrice { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("EstimatedCost")]
    public decimal? EstimatedCost { get; set; }

    [Column("SCOAFunctionID")]
    public int? ScoaFunctionId { get; set; }

    [Column("SCOAItemID")]
    public int? ScoaItemId { get; set; }

    [Column("SCOARegionID")]
    public int? ScoaRegionId { get; set; }

    [Column("SCOACostingID")]
    public int? ScoaCostingId { get; set; }

    [Column("SCOAProjectID")]
    public int? ScoaProjectId { get; set; }

    [Column("UOMID")]
    public int? UomId { get; set; }

    [Column("ReasonForLessVend")]
    public string? ReasonForLessVend { get; set; }

    [Column("PlanProjectItemID")]
    public int? PlanProjectItemId { get; set; }

    [Column("PreviousQuotationServiceDelID")]
    public int? PreviousQuotationServiceDelId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerId")]
    public int? CapturerId { get; set; }

    [ForeignKey("QuotationId")]
    public virtual Quotation? Quotation { get; set; }
}

[Table("SCM_QuotationServiceDetailsFund")]
public class QuotationServiceDetailFund
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("QuotationServiceDetailID")]
    public int? QuotationServiceDetailId { get; set; }

    [Column("SCOAFundID")]
    public int? ScoaFundId { get; set; }

    [Column("Percentage")]
    public decimal? Percentage { get; set; }

    [Column("CapturerId")]
    public int? CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }
}

[Table("SCM_QuotationVendor")]
public class QuotationVendor
{
    [Key]
    [Column("Email_ID")]
    public int EmailId { get; set; }

    [Column("QuotationID")]
    public int? QuotationId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("EmailText")]
    public string? EmailText { get; set; }

    [Column("EmailSubject")]
    public string? EmailSubject { get; set; }

    [Column("Cost")]
    public decimal? Cost { get; set; }

    [Column("Successful")]
    public bool? Successful { get; set; }

    [Column("NoResponse")]
    public bool? NoResponse { get; set; }

    [Column("NonCompliant")]
    public bool? NonCompliant { get; set; }

    [Column("NonComplianceReason")]
    public string? NonComplianceReason { get; set; }

    [Column("Resend")]
    public bool? Resend { get; set; }

    [Column("Send")]
    public bool? Send { get; set; }

    [Column("IsHistory")]
    public bool? IsHistory { get; set; }

    [Column("SystemGenerated")]
    public bool? SystemGenerated { get; set; }

    [Column("ReasonForSelectingVendor")]
    public string? ReasonForSelectingVendor { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerId")]
    public int? CapturerId { get; set; }

    [ForeignKey("QuotationId")]
    public virtual Quotation? Quotation { get; set; }

    [ForeignKey("VendorId")]
    public virtual Vendor? Vendor { get; set; }
}

[Table("SCM_QuotationServiceVendorDetail")]
public class QuotationServiceVendorDetail
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("QuotationID")]
    public int? QuotationId { get; set; }

    [Column("QuotationVendorID")]
    public int? QuotationVendorId { get; set; }

    [Column("QuotationServiceDetailID")]
    public int? QuotationServiceDetailId { get; set; }

    [Column("Cost")]
    public decimal? Cost { get; set; }

    [Column("UnitCost")]
    public decimal? UnitCost { get; set; }

    [Column("VatAmount")]
    public decimal? VatAmount { get; set; }

    [Column("TotalAmount")]
    public decimal? TotalAmount { get; set; }

    [Column("VatExempt")]
    public bool? VatExempt { get; set; }

    [Column("VATApportionmentPercentage")]
    public decimal? VatApportionmentPercentage { get; set; }

    [Column("VATApportionmentAmount")]
    public decimal? VatApportionmentAmount { get; set; }

    [Column("Successful")]
    public bool? Successful { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerId")]
    public int? CapturerId { get; set; }
}

[Table("SCM_QuotationRequistion")]
public class QuotationRequisition
{
    [Key]
    [Column("QuotationReq_ID")]
    public int QuotationReqId { get; set; }

    [Column("QuotationID")]
    public int? QuotationId { get; set; }

    [Column("RequisitionID")]
    public int? RequisitionId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerId")]
    public int? CapturerId { get; set; }
}
