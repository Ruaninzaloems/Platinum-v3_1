namespace AssetManagement.Models;

public class FundingSource
{
    public int FundingSource_ID { get; set; }
    public string? FundingSourceDesc { get; set; }
    public string? FundingSourceCode { get; set; }
    public int? Enabled { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public string? FinYear { get; set; }
}
