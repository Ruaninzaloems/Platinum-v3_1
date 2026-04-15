using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("SCM_GRN")]
public class Grn
{
    [Key]
    [Column("GRN_ID")]
    public int GrnId { get; set; }

    [Column("OrderID")]
    public int? OrderId { get; set; }

    [Column("DocumentPath")]
    public string? DocumentPath { get; set; }

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

    [Column("Description")]
    public string? Description { get; set; }

    [Column("GRNVendorNumber")]
    public string? GrnVendorNumber { get; set; }

    [Column("GRNRecievedDate")]
    public DateTime? GrnReceivedDate { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    [Column("Comments")]
    public string? Comments { get; set; }

    [Column("VendorId")]
    public int? VendorId { get; set; }

    [Column("RecStoreId")]
    public int? RecStoreId { get; set; }

    [Column("DeliveryIndicator")]
    public string? DeliveryIndicator { get; set; }

    [Column("GoodsReceived")]
    public bool? GoodsReceived { get; set; }

    [Column("DeliveryNoteDate")]
    public DateTime? DeliveryNoteDate { get; set; }

    [Column("DeliveryNoteNumber")]
    public string? DeliveryNoteNumber { get; set; }

    [Column("CashbookId")]
    public int? CashbookId { get; set; }

    [Column("StatusId")]
    public int? StatusId { get; set; }

    [Column("ShowOnDashboard")]
    public bool? ShowOnDashboard { get; set; }

    [Column("ProcessingMonth")]
    public int? ProcessingMonth { get; set; }

    [Column("RequestedBy")]
    public int? RequestedBy { get; set; }

    [Column("CurrentApprovalLevel")]
    public int? CurrentApprovalLevel { get; set; }

    [Column("IsApproved")]
    public bool? IsApproved { get; set; }

    public virtual ICollection<GrnDetail> GrnDetails { get; set; } = new List<GrnDetail>();
    public virtual ICollection<GrnDocument> GrnDocuments { get; set; } = new List<GrnDocument>();
}

[Table("SCM_GRNDetails")]
public class GrnDetail
{
    [Key]
    [Column("GRNDetail_ID")]
    public int GrnDetailId { get; set; }

    [Column("GRNID")]
    public int? GrnId { get; set; }

    [Column("OrderDetailID")]
    public int? OrderDetailId { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("QtyOrdered")]
    public decimal? QtyOrdered { get; set; }

    [Column("QtyPreviouslyReceived")]
    public decimal? QtyPreviouslyReceived { get; set; }

    [Column("QtyReceived")]
    public decimal? QtyReceived { get; set; }

    [Column("QtyOutstanding")]
    public decimal? QtyOutstanding { get; set; }

    [Column("UnitPrice")]
    public decimal? UnitPrice { get; set; }

    [Column("Amount")]
    public decimal? Amount { get; set; }

    [Column("VATAmount")]
    public decimal? VatAmount { get; set; }

    [Column("TotalAmount")]
    public decimal? TotalAmount { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

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

    [Column("VoteID")]
    public int? VoteId { get; set; }

    [Column("UOMID")]
    public int? UomId { get; set; }

    [Column("IsVoid")]
    public bool? IsVoid { get; set; }

    [ForeignKey("GrnId")]
    public virtual Grn? Grn { get; set; }
}

[Table("SCM_GRNDocuments")]
public class GrnDocument
{
    [Key]
    [Column("Document_ID")]
    public int DocumentId { get; set; }

    [Column("GRN_ID")]
    public int? GrnId { get; set; }

    [Column("DocumentName")]
    public string? DocumentName { get; set; }

    [Column("DocumentPath")]
    public string? DocumentPath { get; set; }

    [Column("DocumentType")]
    public string? DocumentType { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("GrnId")]
    public virtual Grn? Grn { get; set; }
}

[Table("SCM_GRA")]
public class Gra
{
    [Key]
    [Column("GRA_ID")]
    public int GraId { get; set; }

    [Column("GRNID")]
    public int? GrnId { get; set; }

    [Column("OrderID")]
    public int? OrderId { get; set; }

    [Column("ReturnDate")]
    public DateTime? ReturnDate { get; set; }

    [Column("ReturnReason")]
    public string? ReturnReason { get; set; }

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

    [Column("Comments")]
    public string? Comments { get; set; }

    public virtual ICollection<GraDetail> GraDetails { get; set; } = new List<GraDetail>();
}

[Table("SCM_GRADetails")]
public class GraDetail
{
    [Key]
    [Column("GRADetail_ID")]
    public int GraDetailId { get; set; }

    [Column("GRAID")]
    public int? GraId { get; set; }

    [Column("GRNDetailID")]
    public int? GrnDetailId { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("QtyReturned")]
    public decimal? QtyReturned { get; set; }

    [Column("UnitPrice")]
    public decimal? UnitPrice { get; set; }

    [Column("Amount")]
    public decimal? Amount { get; set; }

    [Column("VATAmount")]
    public decimal? VatAmount { get; set; }

    [Column("TotalAmount")]
    public decimal? TotalAmount { get; set; }

    [Column("ReturnReason")]
    public string? ReturnReason { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [ForeignKey("GraId")]
    public virtual Gra? Gra { get; set; }
}

[Table("SCM_GRNApprovalSetup")]
public class GrnApprovalSetup
{
    [Key]
    [Column("GRNApprovalSetup_ID")]
    public int GrnApprovalSetupId { get; set; }

    [Column("ApprovalLevel")]
    public int? ApprovalLevel { get; set; }

    [Column("ApproverRoleID")]
    public int? ApproverRoleId { get; set; }

    [Column("ApproverEmployeeID")]
    public int? ApproverEmployeeId { get; set; }

    [Column("MinAmount")]
    public decimal? MinAmount { get; set; }

    [Column("MaxAmount")]
    public decimal? MaxAmount { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("IsActive")]
    public bool? IsActive { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("TolerancePercentage")]
    public decimal? TolerancePercentage { get; set; }

    [Column("AllowOverDelivery")]
    public bool? AllowOverDelivery { get; set; }
}

[Table("SCM_ServiceEntrySheet")]
public class ServiceEntrySheet
{
    [Key]
    [Column("ServiceEntry_ID")]
    public int ServiceEntryId { get; set; }

    [Column("OrderID")]
    public int? OrderId { get; set; }

    [Column("GRNID")]
    public int? GrnId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("ServiceDescription")]
    public string? ServiceDescription { get; set; }

    [Column("ServiceDate")]
    public DateTime? ServiceDate { get; set; }

    [Column("CompletionDate")]
    public DateTime? CompletionDate { get; set; }

    [Column("CompletionPercentage")]
    public decimal? CompletionPercentage { get; set; }

    [Column("TotalAmount")]
    public decimal? TotalAmount { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("CertifiedBy")]
    public int? CertifiedBy { get; set; }

    [Column("CertifiedDate")]
    public DateTime? CertifiedDate { get; set; }

    [Column("ApprovedBy")]
    public int? ApprovedBy { get; set; }

    [Column("ApprovedDate")]
    public DateTime? ApprovedDate { get; set; }

    [Column("Comments")]
    public string? Comments { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    public virtual ICollection<ServiceEntrySheetDetail> Details { get; set; } = new List<ServiceEntrySheetDetail>();
}

[Table("SCM_ServiceEntrySheetDetail")]
public class ServiceEntrySheetDetail
{
    [Key]
    [Column("ServiceEntryDetail_ID")]
    public int ServiceEntryDetailId { get; set; }

    [Column("ServiceEntryID")]
    public int? ServiceEntryId { get; set; }

    [Column("OrderDetailID")]
    public int? OrderDetailId { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("QuantityOrdered")]
    public decimal? QuantityOrdered { get; set; }

    [Column("QuantityDelivered")]
    public decimal? QuantityDelivered { get; set; }

    [Column("UnitPrice")]
    public decimal? UnitPrice { get; set; }

    [Column("Amount")]
    public decimal? Amount { get; set; }

    [Column("CompletionPercentage")]
    public decimal? CompletionPercentage { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [ForeignKey("ServiceEntryId")]
    public virtual ServiceEntrySheet? ServiceEntry { get; set; }
}

[Table("SCM_AssetUnbundling_Header")]
public class AssetUnbundlingHeader
{
    [Key]
    [Column("AssetUnbundling_ID")]
    public int AssetUnbundlingId { get; set; }

    [Column("GRNID")]
    public int? GrnId { get; set; }

    [Column("OrderID")]
    public int? OrderId { get; set; }

    [Column("AssetDescription")]
    public string? AssetDescription { get; set; }

    [Column("TotalValue")]
    public decimal? TotalValue { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("CreatedBy")]
    public int? CreatedBy { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    public virtual ICollection<AssetUnbundlingDetail> Details { get; set; } = new List<AssetUnbundlingDetail>();
}

[Table("SCM_AssetUnbundling_Detail")]
public class AssetUnbundlingDetail
{
    [Key]
    [Column("AssetUnbundlingDetail_ID")]
    public int AssetUnbundlingDetailId { get; set; }

    [Column("AssetUnbundlingID")]
    public int? AssetUnbundlingId { get; set; }

    [Column("ComponentDescription")]
    public string? ComponentDescription { get; set; }

    [Column("ComponentValue")]
    public decimal? ComponentValue { get; set; }

    [Column("AssetCategoryID")]
    public int? AssetCategoryId { get; set; }

    [Column("SerialNumber")]
    public string? SerialNumber { get; set; }

    [Column("BarCode")]
    public string? BarCode { get; set; }

    [Column("LocationID")]
    public int? LocationId { get; set; }

    [Column("IsCapitalItem")]
    public bool? IsCapitalItem { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [ForeignKey("AssetUnbundlingId")]
    public virtual AssetUnbundlingHeader? Header { get; set; }
}
