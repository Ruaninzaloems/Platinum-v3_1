namespace PlatinumAFS.Api.Models;

public class DocumentEntry
{
    public string? DocumentNumber { get; set; }
    public string? DocumentType { get; set; }
    public int? TransactionTypeID { get; set; }
    public string? TransactionType { get; set; }
    public string? FinYear { get; set; }
    public int? ProcessingMonth { get; set; }
    public DateTime? PostingDate { get; set; }
    public DateTime? DateCaptured { get; set; }
    public string? CapturedBy { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? VendorInvoiceNumber { get; set; }
    public string? PaymentDocumentNumber { get; set; }
    public string? OrderNumber { get; set; }
    public string? SupplierNo { get; set; }
    public string? SupplierName { get; set; }
    public string? Department { get; set; }
    public string? Division { get; set; }
    public string? ProjectCode { get; set; }
    public string? ProjectDescription { get; set; }
    public int LineItemCount { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal NetAmount { get; set; }
    public decimal AbsoluteAmount { get; set; }
    public string? TransactionDetails { get; set; }
    public string? OrderDescription { get; set; }
    public decimal? VATRate { get; set; }
    public string? VATIndicator { get; set; }
    public Guid? MatchTranGuid { get; set; }
}

public class DocumentLineItem
{
    public int GenLedgerId { get; set; }
    public string? DocumentNumber { get; set; }
    public DateTime PostingDate { get; set; }
    public int ProcessingMonth { get; set; }
    public string? FinYear { get; set; }
    public string? TransactionType { get; set; }
    public string? TransactionDetails { get; set; }
    public decimal? Debit { get; set; }
    public decimal? Credit { get; set; }
    public decimal? Balance { get; set; }
    public int? VoteID { get; set; }
    public string? VoteNumber { get; set; }
    public string? VoteDescription { get; set; }
    public string? AccountNo { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaItemDescription { get; set; }
    public string? ScoaFundsCode { get; set; }
    public string? ScoaFundsDescription { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string? ScoaFunctionDescription { get; set; }
    public string? ScoaProjectCode { get; set; }
    public string? ScoaProjectDescription { get; set; }
    public string? ScoaCostingCode { get; set; }
    public string? ScoaCostingDescription { get; set; }
    public string? ScoaRegionCode { get; set; }
    public string? ScoaRegionDescription { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? SupplierNo { get; set; }
    public string? SupplierName { get; set; }
    public string? OrderNumber { get; set; }
    public string? OrderLine { get; set; }
    public string? OrderDescription { get; set; }
    public string? VendorInvoiceNumber { get; set; }
    public string? PaymentDocumentNumber { get; set; }
    public decimal? VATRate { get; set; }
    public string? VATIndicator { get; set; }
    public string? CapturedBy { get; set; }
    public DateTime? DateCaptured { get; set; }
    public Guid? MatchTranGuid { get; set; }
    public string? ItemType { get; set; }
}

public class DocumentSchemaSummary
{
    public string? TableName { get; set; }
    public string? TableSchema { get; set; }
    public long RowCount { get; set; }
    public int ColumnCount { get; set; }
    public List<string> Columns { get; set; } = new();
}

public class AuditSampleResult
{
    public int TotalPopulation { get; set; }
    public int SampleSize { get; set; }
    public decimal TotalPopulationAmount { get; set; }
    public decimal SampleAmount { get; set; }
    public decimal CoveragePercentage { get; set; }
    public string SamplingMethod { get; set; } = "";
    public List<DocumentEntry> SampleItems { get; set; } = new();
}
