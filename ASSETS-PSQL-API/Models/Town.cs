namespace AssetManagement.Models;

public class Town
{
    public int Town_ID { get; set; }
    public string? Town_Name { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? FallswithinMunicipality { get; set; }
    public string? TownCode { get; set; }
    public int? ProvinceID { get; set; }
    public string? Code { get; set; }
}
