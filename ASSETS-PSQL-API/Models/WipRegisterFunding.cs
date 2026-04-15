namespace AssetManagement.Models;

public class WipRegisterFunding
{
    public int WIPRegisterFunding_ID { get; set; }
    public int? WIPRegister_ID { get; set; }
    public int? FundingSource_ID { get; set; }
    public int? FundingType_ID { get; set; }
    public decimal? Amount { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
