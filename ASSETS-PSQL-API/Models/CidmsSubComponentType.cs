namespace AssetManagement.Models;

public class CidmsSubComponentType
{
    public int AssetCIDMSSubComponentTypeID { get; set; }
    public string? AssetCIDMSSubComponentTypeDesc { get; set; }
    public int? AssetCIDMSComponentTypeID { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? Default { get; set; } = 1;
    public int? Infrastructure { get; set; }
    public int? Nature { get; set; }
}
