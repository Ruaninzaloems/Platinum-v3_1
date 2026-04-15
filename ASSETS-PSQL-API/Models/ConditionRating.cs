namespace AssetManagement.Models;

public class ConditionRating
{
    public int AssetConditionRating_ID { get; set; }
    public string? AssetConditionRatingDesc { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
