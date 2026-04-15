using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("SCM_Invoice")]
public class Invoice
{
    [Key]
    [Column("Invoice_ID")]
    public int InvoiceId { get; set; }

    [Column("VendorInvoiceNumber")]
    public string? VendorInvoiceNumber { get; set; }

    [Column("InvoiceDate")]
    public DateTime? InvoiceDate { get; set; }

    [Column("Comments")]
    public string? Comments { get; set; }

    [Column("DiscountRate")]
    public decimal? DiscountRate { get; set; }

    [Column("DiscountToAll")]
    public bool? DiscountToAll { get; set; }

    [Column("VolumeDiscount")]
    public decimal? VolumeDiscount { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("InvoiceReceivedDate")]
    public DateTime? InvoiceReceivedDate { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    [Column("Calculated_Invoice_Amount")]
    public decimal? CalculatedInvoiceAmount { get; set; }

    [Column("DocNumber")]
    public string? DocNumber { get; set; }

    [Column("OrderID")]
    public int? OrderId { get; set; }

    [Column("GRNID")]
    public int? GrnId { get; set; }

    [Column("ContractID")]
    public int? ContractId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    public virtual ICollection<InvoiceDetail> InvoiceDetails { get; set; } = new List<InvoiceDetail>();
    public virtual ICollection<InvoiceDocument> InvoiceDocuments { get; set; } = new List<InvoiceDocument>();
}

[Table("SCM_InvoiceDetail")]
public class InvoiceDetail
{
    [Key]
    [Column("InvoiceDetail_ID")]
    public int InvoiceDetailId { get; set; }

    [Column("InvoiceID")]
    public int? InvoiceId { get; set; }

    [Column("OrderDetailID")]
    public int? OrderDetailId { get; set; }

    [Column("ServiceDescription")]
    public string? ServiceDescription { get; set; }

    [Column("InvoiceQuantity")]
    public decimal? InvoiceQuantity { get; set; }

    [Column("InvoiceUnitPrice")]
    public decimal? InvoiceUnitPrice { get; set; }

    [Column("Amount")]
    public decimal? Amount { get; set; }

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

    [Column("VoteID")]
    public int? VoteId { get; set; }

    [Column("UOMID")]
    public int? UomId { get; set; }

    [Column("VATApportionmentPercentage")]
    public decimal? VatApportionmentPercentage { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("InvoiceId")]
    public virtual Invoice? Invoice { get; set; }
}

[Table("SCM_InvoiceDetailsFund")]
public class InvoiceDetailFund
{
    [Key]
    [Column("ID")]
    public int Id { get; set; }

    [Column("InvoiceDetailID")]
    public int? InvoiceDetailId { get; set; }

    [Column("SCOAFundID")]
    public int? ScoaFundId { get; set; }

    [Column("Percentage")]
    public decimal? Percentage { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }
}

[Table("SCM_InvoiceDocuments")]
public class InvoiceDocument
{
    [Key]
    [Column("InvoiceDocuments_ID")]
    public int InvoiceDocumentsId { get; set; }

    [Column("InvoiceID")]
    public int? InvoiceId { get; set; }

    [Column("DocumentID")]
    public int? DocumentId { get; set; }

    [Column("DocumentName")]
    public string? DocumentName { get; set; }

    [Column("DocumentDate")]
    public DateTime? DocumentDate { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [ForeignKey("InvoiceId")]
    public virtual Invoice? Invoice { get; set; }
}

[Table("SCM_InvoiceCreditDebtNote")]
public class InvoiceCreditDebitNote
{
    [Key]
    [Column("CreditDebitNote_ID")]
    public int CreditDebitNoteId { get; set; }

    [Column("InvoiceID")]
    public int? InvoiceId { get; set; }

    [Column("CreditDebitType")]
    public string? CreditDebitType { get; set; }

    [Column("Reason")]
    public string? Reason { get; set; }

    [Column("Amount")]
    public decimal? Amount { get; set; }

    [Column("VATAmount")]
    public decimal? VatAmount { get; set; }

    [Column("TotalAmount")]
    public decimal? TotalAmount { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("DocNumber")]
    public string? DocNumber { get; set; }

    [Column("OrderID")]
    public int? OrderId { get; set; }

    [Column("CreditDebitNumber")]
    public string? CreditDebitNumber { get; set; }

    [Column("GRNID")]
    public int? GrnId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }
}

[Table("SCM_ServiceInvoice")]
public class ServiceInvoice
{
    [Key]
    [Column("ServiceInvoice_ID")]
    public int ServiceInvoiceId { get; set; }

    [Column("ContractID")]
    public int? ContractId { get; set; }

    [Column("ContractServiceRequestID")]
    public int? ContractServiceRequestId { get; set; }

    [Column("ServiceInvoiceNumber")]
    public string? ServiceInvoiceNumber { get; set; }

    [Column("ServiceInvoiceDate")]
    public DateTime? ServiceInvoiceDate { get; set; }

    [Column("MilestoneDescription")]
    public string? MilestoneDescription { get; set; }

    [Column("Amount")]
    public decimal? Amount { get; set; }

    [Column("VATAmount")]
    public decimal? VatAmount { get; set; }

    [Column("TotalAmount")]
    public decimal? TotalAmount { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }
}
