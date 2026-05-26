namespace AssetManagement.Models;

public class LedGlCreateRequest
{
    public DateTime PostingDate { get; set; }
    public int ProcessingMonth { get; set; }
    public int? VoteId { get; set; }
    public string FinYear { get; set; } = "";
    public int? TransactionTypeId { get; set; }
    public string? TransactionDetails { get; set; }
    public string? DocumentNumber { get; set; }
    public decimal? Debit { get; set; }
    public decimal? Credit { get; set; }
    public Guid? MatchTranGuid { get; set; }
    public int? JournalTransactionTypeId { get; set; }
    public int? AssetLinkId { get; set; }
    public int? ScoaFundsId { get; set; }
    public int? ScoaRegionId { get; set; }
    public int? ScoaCostingId { get; set; }
    public int? ScoaProjectId { get; set; }
    public int? ScoaFunctionId { get; set; }
    public int ScoaItemId { get; set; }
    public int? DivisionId { get; set; }
    public int? ProjectId { get; set; }
    public int? PlanProjectItemId { get; set; }
    public int CapturerId { get; set; } = 1;
}
