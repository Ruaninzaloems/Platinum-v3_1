namespace MssqlApi.Models;

public class TownLookup
{
    public int Town_ID { get; set; }
    public string? Town { get; set; }
    public bool Enabled { get; set; }
    public DateTime DateCaptured { get; set; }
    public int CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public bool? FallswithinMunicipality { get; set; }
    public string? TownCode { get; set; }
    public int ProvinceID { get; set; }
    public string? Code { get; set; }
}
