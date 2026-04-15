namespace AssetManagement.Models;

public class InspectionCondition
{
    public int InspectionCondition_ID { get; set; }
    public string? InspectionConditionDesc { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
