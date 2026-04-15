namespace MssqlApi.Models;

public class FundingSource
{
    public int FundingSource_ID { get; set; }
    public string? FundingSourceDesc { get; set; }
    public bool Enabled { get; set; }
    public DateTime DateCaptured { get; set; }
    public int CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public string? FinYear { get; set; }
    public int? PreviousReferenceId { get; set; }
}
