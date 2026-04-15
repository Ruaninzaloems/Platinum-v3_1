using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("SCM_Order")]
public class Order
{
    [Key]
    [Column("Order_ID")]
    public int OrderId { get; set; }

    [Column("OrderNumber")]
    public string? OrderNumber { get; set; }

    [Column("ReferenceTo")]
    public int ReferenceTo { get; set; }

    [Column("QuotationId")]
    public int? QuotationId { get; set; }

    [Column("TenderId")]
    public int? TenderId { get; set; }

    [Column("RequisitionId")]
    public int? RequisitionId { get; set; }

    [Column("VoteId")]
    public int? VoteId { get; set; }

    [Column("OrderTypeId")]
    public int? OrderTypeId { get; set; }

    [Column("RegionId")]
    public int? RegionId { get; set; }

    [Column("ApproveStatus")]
    public int? ApproveStatus { get; set; }

    [Column("ApprovedBy")]
    public int? ApprovedBy { get; set; }

    [Column("ApprovedDate")]
    public DateTime? ApprovedDate { get; set; }

    [Column("FundAvailable")]
    public bool? FundAvailable { get; set; }

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

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("IsForwardedtoVendor")]
    public bool? IsForwardedToVendor { get; set; }

    [Column("CancelReason")]
    public string? CancelReason { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    [Column("Comments")]
    public string? Comments { get; set; }

    [Column("VendorId")]
    public int? VendorId { get; set; }

    [Column("Contract_ID")]
    public int? ContractId { get; set; }

    [Column("ContactPerson")]
    public string? ContactPerson { get; set; }

    [Column("PhysicalAddress")]
    public string? PhysicalAddress { get; set; }

    [Column("PhysicalTownID")]
    public int? PhysicalTownId { get; set; }

    [Column("PostalCode")]
    public string? PostalCode { get; set; }

    [Column("Tel_Work")]
    public string? TelWork { get; set; }

    [Column("DeliveryAddress")]
    public bool? DeliveryAddress { get; set; }

    [Column("IsVoid")]
    public bool? IsVoid { get; set; }

    [Column("VoidedDate")]
    public DateTime? VoidedDate { get; set; }

    [Column("VoidedReason")]
    public string? VoidedReason { get; set; }

    [Column("VoidedBy")]
    public int? VoidedBy { get; set; }

    [Column("InformalTenderID")]
    public int? InformalTenderId { get; set; }

    [Column("ContactId")]
    public int? ContactId { get; set; }

    [Column("EmailAddress")]
    public string? EmailAddress { get; set; }

    [Column("isTakeOn")]
    public bool? IsTakeOn { get; set; }

    [Column("Vendor_ID")]
    public int? VendorIdAlt { get; set; }

    [Column("IsMailSentToVendor")]
    public bool IsMailSentToVendor { get; set; }

    [Column("VoidedQuantity")]
    public decimal? VoidedQuantity { get; set; }

    public virtual ICollection<OrderTypeDetail> OrderDetails { get; set; } = new List<OrderTypeDetail>();
    public virtual ICollection<OrderDocument> OrderDocuments { get; set; } = new List<OrderDocument>();
    public virtual ICollection<OrderSplitDetail> SplitDetails { get; set; } = new List<OrderSplitDetail>();
    public virtual Vendor? Vendor { get; set; }
}

[Table("SCM_OrderTypeDetail")]
public class OrderTypeDetail
{
    [Key]
    [Column("OrderDetailID")]
    public int OrderDetailId { get; set; }

    [Column("OrderID")]
    public int? OrderId { get; set; }

    [Column("RequisitionDelID")]
    public int? RequisitionDelId { get; set; }

    [Column("QuotationServiceDelID")]
    public int? QuotationServiceDelId { get; set; }

    [Column("OrderTypeID")]
    public int? OrderTypeId { get; set; }

    [Column("Item")]
    public string? Item { get; set; }

    [Column("ServiceDescription")]
    public string? ServiceDescription { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("UnitPrice")]
    public decimal? UnitPrice { get; set; }

    [Column("Amount")]
    public decimal? Amount { get; set; }

    [Column("VatInclude")]
    public bool? VatInclude { get; set; }

    [Column("VATAmount")]
    public decimal? VatAmount { get; set; }

    [Column("TotalAmount")]
    public decimal? TotalAmount { get; set; }

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

    [Column("VoteID")]
    public int? VoteId { get; set; }

    [Column("UOMID")]
    public int? UomId { get; set; }

    [Column("InformalTenderServiceDel_ID")]
    public int? InformalTenderServiceDelId { get; set; }

    [Column("VATApportionmentPercentage")]
    public decimal? VatApportionmentPercentage { get; set; }

    [Column("VATApportionmentAmount")]
    public decimal? VatApportionmentAmount { get; set; }

    [Column("PlanProjectItemID")]
    public int? PlanProjectItemId { get; set; }

    [Column("ContractDetailItemsID")]
    public int? ContractDetailItemsId { get; set; }

    [Column("DeliveryAddress")]
    public string? DeliveryAddress { get; set; }

    [Column("DeliveryDate")]
    public DateTime? DeliveryDate { get; set; }

    [Column("IsVoid")]
    public bool? IsVoid { get; set; }

    [Column("VatExempt")]
    public bool? VatExempt { get; set; }

    [ForeignKey("OrderId")]
    public virtual Order? Order { get; set; }
}

[Table("SCM_OrderTypeDetailsFund")]
public class OrderTypeDetailFund
{
    [Key]
    [Column("ID")]
    public int Id { get; set; }

    [Column("OrderDetailID")]
    public int? OrderDetailId { get; set; }

    [Column("SCOAFundID")]
    public int? ScoaFundId { get; set; }

    [Column("Percentage")]
    public decimal? Percentage { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }
}

[Table("SCM_OrderSplitDetails")]
public class OrderSplitDetail
{
    [Key]
    [Column("OrderSplitDetail_ID")]
    public int OrderSplitDetailId { get; set; }

    [Column("OrderId")]
    public int? OrderId { get; set; }

    [Column("OrderDetailID")]
    public int? OrderDetailId { get; set; }

    [Column("RequisitionDetail_ID")]
    public int? RequisitionDetailId { get; set; }

    [Column("ServiceDescription")]
    public string? ServiceDescription { get; set; }

    [Column("Quantity")]
    public decimal? Quantity { get; set; }

    [Column("Cost")]
    public decimal? Cost { get; set; }

    [Column("DeliveryDate")]
    public DateTime? DeliveryDate { get; set; }

    [Column("DeliveryAddress")]
    public string? DeliveryAddress { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("Default")]
    public bool? IsDefault { get; set; }

    [ForeignKey("OrderId")]
    public virtual Order? Order { get; set; }
}

[Table("SCM_OrderDocument")]
public class OrderDocument
{
    [Key]
    [Column("Document_ID")]
    public int DocumentId { get; set; }

    [Column("OrderID")]
    public int? OrderId { get; set; }

    [Column("DocumentName")]
    public string? DocumentName { get; set; }

    [Column("DocumentPath")]
    public string? DocumentPath { get; set; }

    [Column("DocumentDate")]
    public DateTime? DocumentDate { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [ForeignKey("OrderId")]
    public virtual Order? Order { get; set; }
}

[Table("SCM_CessionAgreement")]
public class CessionAgreement
{
    [Key]
    [Column("CessionAgreement_ID")]
    public int CessionAgreementId { get; set; }

    [Column("BeneficiaryVendorID")]
    public int? BeneficiaryVendorId { get; set; }

    [Column("BeneficiaryPercentage")]
    public decimal? BeneficiaryPercentage { get; set; }

    [Column("CeedantVendorID")]
    public int? CeedantVendorId { get; set; }

    [Column("CeedantPercentage")]
    public decimal? CeedantPercentage { get; set; }

    [Column("CessionAgreementTypeID")]
    public int? CessionAgreementTypeId { get; set; }

    [Column("AgreementDate")]
    public DateTime? AgreementDate { get; set; }

    [Column("ClaimAmount")]
    public decimal? ClaimAmount { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("ContractID")]
    public int? ContractId { get; set; }

    [Column("Comments")]
    public string? Comments { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("OrderID")]
    public int? OrderId { get; set; }

    [Column("SundryPaymentID")]
    public int? SundryPaymentId { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }
}
