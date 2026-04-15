namespace AssetManagement.Models;

public class CidmsAssetType
{
    public int AssetCIDMSAssetTypeID { get; set; }
    public string? AssetCIDMSAssetTypeDesc { get; set; }
    public int? AssetCIDMSGroupTypeID { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? Default { get; set; } = 1;
}
