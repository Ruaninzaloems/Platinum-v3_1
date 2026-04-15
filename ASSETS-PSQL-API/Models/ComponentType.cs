namespace AssetManagement.Models;

public class ComponentType
{
    public int Asset_Component_ID { get; set; }
    public string? Asset_Component_Description { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? Default { get; set; } = 1;
}
