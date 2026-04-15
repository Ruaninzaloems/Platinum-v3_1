namespace MssqlApi.Models;

public class ScmInvoiceDetail
{
    public int InvoiceDetail_ID { get; set; }
    public int? InvoiceID { get; set; }
    public string? Description { get; set; }
    public decimal? Amount { get; set; }
    public bool? Enabled { get; set; }
}
