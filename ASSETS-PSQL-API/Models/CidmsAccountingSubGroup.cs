namespace AssetManagement.Models;

public class CidmsAccountingSubGroup
{
    public int AssetAccountSubGroupID { get; set; }
    public string? AssetAccountSubGroupDesc { get; set; }
    public int? AssetAccountGroupID { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? Default { get; set; } = 1;
}
