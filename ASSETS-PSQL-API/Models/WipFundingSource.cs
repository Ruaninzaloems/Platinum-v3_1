namespace AssetManagement.Models;

public class WipFundingSource
{
    public int WIPFundingSource_ID { get; set; }
    public string? WIPFundingSourceDesc { get; set; }
    public int? Enabled { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
