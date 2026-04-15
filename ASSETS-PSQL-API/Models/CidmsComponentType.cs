namespace AssetManagement.Models;

public class CidmsComponentType
{
    public int AssetCIDMSComponentTypeID { get; set; }
    public string? AssetCIDMSComponentTypeDesc { get; set; }
    public int? AssetCIDMSAssetTypeID { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? Default { get; set; } = 1;
}
