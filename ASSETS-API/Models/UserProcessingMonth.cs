namespace MssqlApi.Models;

public class UserProcessingMonth
{
    public int UserProcessingMonth_ID { get; set; }
    public int? UserID { get; set; }
    public string? ProcessingMonth { get; set; }
    public DateTime? DateCaptured { get; set; }
    public DateTime? DateModified { get; set; }
}
