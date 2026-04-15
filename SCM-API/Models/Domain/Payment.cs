using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("SCM_PaymentHeader")]
public class PaymentHeader
{
    [Key]
    [Column("PaymentHeader_ID")]
    public int PaymentHeaderId { get; set; }

    [Column("VendorCreditorID")]
    public int? VendorCreditorId { get; set; }

    [Column("PaymentTypeID")]
    public int? PaymentTypeId { get; set; }

    [Column("AllocationStatusID")]
    public int? AllocationStatusId { get; set; }

    [Column("Amount")]
    public decimal? Amount { get; set; }

    [Column("VATAmount")]
    public decimal? VatAmount { get; set; }

    [Column("SupervisorApproved")]
    public bool? SupervisorApproved { get; set; }

    [Column("HODApproved")]
    public bool? HodApproved { get; set; }

    [Column("IsVoid")]
    public bool? IsVoid { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("PaymentReferenceNumber")]
    public string? PaymentReferenceNumber { get; set; }

    [Column("SupervisorID")]
    public int? SupervisorId { get; set; }

    [Column("HODID")]
    public int? HodId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    public virtual ICollection<PaymentDetail> PaymentDetails { get; set; } = new List<PaymentDetail>();
}

[Table("SCM_PaymentDetail1")]
public class PaymentDetail
{
    [Key]
    [Column("PaymentDetail1_ID")]
    public int PaymentDetailId { get; set; }

    [Column("PaymentHeader_ID")]
    public int? PaymentHeaderId { get; set; }

    [Column("VendorCreditorID")]
    public int? VendorCreditorId { get; set; }

    [Column("InvoiceID")]
    public int? InvoiceId { get; set; }

    [Column("SundryPaymentID")]
    public int? SundryPaymentId { get; set; }

    [Column("Amount")]
    public decimal? Amount { get; set; }

    [Column("VATAmount")]
    public decimal? VatAmount { get; set; }

    [Column("SettlementDiscount")]
    public decimal? SettlementDiscount { get; set; }

    [Column("QualifyingDays")]
    public int? QualifyingDays { get; set; }

    [Column("PaymentDueDate")]
    public DateTime? PaymentDueDate { get; set; }

    [Column("LatePaymentReason")]
    public string? LatePaymentReason { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [ForeignKey("PaymentHeaderId")]
    public virtual PaymentHeader? PaymentHeader { get; set; }
}

[Table("SCM_Cashbook")]
public class Cashbook
{
    [Key]
    [Column("SCMTransaction_ID")]
    public int ScmTransactionId { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("ProcessingMonth")]
    public int? ProcessingMonth { get; set; }

    [Column("TransactionTypeID")]
    public int? TransactionTypeId { get; set; }

    [Column("TransactionDate")]
    public DateTime? TransactionDate { get; set; }

    [Column("Vendor_CreditorID")]
    public int? VendorCreditorId { get; set; }

    [Column("CashbookID")]
    public int? CashbookId { get; set; }

    [Column("DocNumber")]
    public string? DocNumber { get; set; }

    [Column("DocTypeCode")]
    public string? DocTypeCode { get; set; }

    [Column("IsAuthorised")]
    public bool? IsAuthorised { get; set; }

    [Column("IsReconciled")]
    public bool? IsReconciled { get; set; }

    [Column("EFTFileID")]
    public int? EftFileId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_CashbookVote")]
public class CashbookVote
{
    [Key]
    [Column("CashbookVote_ID")]
    public int CashbookVoteId { get; set; }

    [Column("SCMTransactionID")]
    public int? ScmTransactionId { get; set; }

    [Column("InvoiceID")]
    public int? InvoiceId { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("VoteID")]
    public int? VoteId { get; set; }

    [Column("VoteAmount")]
    public decimal? VoteAmount { get; set; }

    [Column("VoteVATIndicator")]
    public bool? VoteVatIndicator { get; set; }

    [Column("VoteVATAmount")]
    public decimal? VoteVatAmount { get; set; }

    [Column("ItemDescription")]
    public string? ItemDescription { get; set; }

    [Column("ReferenceNumber")]
    public string? ReferenceNumber { get; set; }
}

[Table("Led_EFTFile")]
public class EftFile
{
    [Key]
    [Column("EFTFile_ID")]
    public int EftFileId { get; set; }

    [Column("FileName")]
    public string? FileName { get; set; }

    [Column("GeneratedDate")]
    public DateTime? GeneratedDate { get; set; }

    [Column("GeneratedBy")]
    public int? GeneratedBy { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("TotalAmount")]
    public decimal? TotalAmount { get; set; }

    [Column("TotalRecords")]
    public int? TotalRecords { get; set; }

    [Column("BankID")]
    public int? BankId { get; set; }

    [Column("CashbookID")]
    public int? CashbookId { get; set; }

    [Column("ProcessingMonth")]
    public int? ProcessingMonth { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }
}

[Table("SCM_SundryPayment")]
public class SundryPayment
{
    [Key]
    [Column("SundryPayment_ID")]
    public int SundryPaymentId { get; set; }

    [Column("SundryPaymentNumber")]
    public string? SundryPaymentNumber { get; set; }

    [Column("ServiceDescription")]
    public string? ServiceDescription { get; set; }

    [Column("RequestedBy")]
    public int? RequestedBy { get; set; }

    [Column("RequestedDate")]
    public DateTime? RequestedDate { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("DivisionID")]
    public int? DivisionId { get; set; }

    [Column("SupervisorApproval")]
    public bool? SupervisorApproval { get; set; }

    [Column("HODApproval")]
    public bool? HodApproval { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("IsVoid")]
    public bool? IsVoid { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_RemittanceAdvice")]
public class RemittanceAdvice
{
    [Key]
    [Column("RemittanceAdvice_ID")]
    public int RemittanceAdviceId { get; set; }

    [Column("VendorCreditorID")]
    public int? VendorCreditorId { get; set; }

    [Column("PaymentHeader_ID")]
    public int? PaymentHeaderId { get; set; }

    [Column("RemittanceDate")]
    public DateTime? RemittanceDate { get; set; }

    [Column("TotalAmount")]
    public decimal? TotalAmount { get; set; }

    [Column("VATAmount")]
    public decimal? VatAmount { get; set; }

    [Column("ActiveIndicator")]
    public bool? ActiveIndicator { get; set; }

    [Column("DateSent")]
    public DateTime? DateSent { get; set; }
}

[Table("SCM_CreditorsInterest")]
public class CreditorsInterest
{
    [Key]
    [Column("CreditorsInterest_ID")]
    public int CreditorsInterestId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("InvoiceID")]
    public int? InvoiceId { get; set; }

    [Column("InvoiceDate")]
    public DateTime? InvoiceDate { get; set; }

    [Column("DueDate")]
    public DateTime? DueDate { get; set; }

    [Column("DaysOverdue")]
    public int? DaysOverdue { get; set; }

    [Column("InterestRate")]
    public decimal? InterestRate { get; set; }

    [Column("InterestAmount")]
    public decimal? InterestAmount { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }
}
