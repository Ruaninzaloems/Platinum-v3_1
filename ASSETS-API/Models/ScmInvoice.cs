namespace MssqlApi.Models;

public class ScmInvoice
{
    public int Invoice_ID { get; set; }
    public int? ContractID { get; set; }
    public string? InvoiceNumber { get; set; }
    public decimal? InvoiceAmount { get; set; }
    public string? FinancialYear { get; set; }
    public DateTime? InvoiceDate { get; set; }
    public bool? Enabled { get; set; }
}
