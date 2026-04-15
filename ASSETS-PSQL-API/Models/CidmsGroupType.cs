namespace AssetManagement.Models;

public class CidmsGroupType
{
    public int AssetCIDMSGroupTypeID { get; set; }
    public string? AssetCIDMSGroupTypeDesc { get; set; }
    public int? AssetCIDMSClassID { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? Default { get; set; } = 1;
}
