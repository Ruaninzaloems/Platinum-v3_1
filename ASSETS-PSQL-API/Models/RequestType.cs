namespace AssetManagement.Models;

public class RequestType
{
    public int RequestType_ID { get; set; }
    public string RequestDesc { get; set; } = "";
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
