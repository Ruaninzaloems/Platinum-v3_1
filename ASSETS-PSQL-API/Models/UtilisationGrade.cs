namespace AssetManagement.Models;

public class UtilisationGrade
{
    public int UtilisationGrade_ID { get; set; }
    public string? UtilisationGradeDesc { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? Default { get; set; } = 1;
}
