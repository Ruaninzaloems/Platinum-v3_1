namespace MssqlApi.Models;

public class MonthLookup
{
    public int Month_ID { get; set; }
    public string? Month { get; set; }
    public bool Enabled { get; set; }
    public DateTime DateCaptured { get; set; }
    public int CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
