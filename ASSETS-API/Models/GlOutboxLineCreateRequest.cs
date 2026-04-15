namespace MssqlApi.Models;

public class GlOutboxLineCreateRequest
{
    public Guid OutboxId { get; set; }
    public int ProcessingMonth { get; set; }
    public string FinYear { get; set; } = "";
    public string? TransactionDetails { get; set; }
    public int SourceModuleId { get; set; } = 8;
    public decimal Debit { get; set; } = 0;
    public decimal Credit { get; set; } = 0;
    public int CapturerId { get; set; } = 1;
    public int PlanProjectItemID { get; set; } = 0;
    public decimal? VATRate { get; set; }
    public int VATRateID { get; set; } = 0;
}
