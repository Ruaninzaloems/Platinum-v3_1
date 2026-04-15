namespace AssetManagement.Models;

public class AssetImpairmentPosting
{
    public int ImpairmentPosting_ID { get; set; }
    public int? AssetImpairment_ID { get; set; }
    public int? Impairment_ID { get; set; }
    public DateTime? PostingDate { get; set; }
    public int? PostedByID { get; set; }
    public string? Status { get; set; }
    public decimal? FairValueAmt { get; set; }
    public decimal? CostToSell { get; set; }
    public decimal? PresentValue { get; set; }
    public decimal? ImpairmentLostAmt { get; set; }
    public decimal? AmountFromRevaluationReserve { get; set; }
    public short? Approved { get; set; }
    public short? IsReversal { get; set; }
    public int? ID { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
}
