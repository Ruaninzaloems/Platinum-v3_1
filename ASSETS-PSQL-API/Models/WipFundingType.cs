namespace AssetManagement.Models;

public class WipFundingType
{
    public int WIPFundingType_ID { get; set; }
    public string? WIPFundingTypeDesc { get; set; }
    public int? Enabled { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
