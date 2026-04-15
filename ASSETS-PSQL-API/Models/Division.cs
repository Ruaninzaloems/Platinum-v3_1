namespace AssetManagement.Models;

public class Division
{
    public int Division_ID { get; set; }
    public string? DivisionDesc { get; set; }
    public string? DivisionCode { get; set; }
    public int? DepartmentID { get; set; }
    public int? DivisionParentID { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? SCOAFunctionID { get; set; }
    public int? HRPayrollSCOAFundID { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? RegionID { get; set; }
    public int? ProjectID { get; set; }
    public int? ManagerPositionID { get; set; }
    public DateTime? ManagerStartDate { get; set; }
    public DateTime? ManagerEndDate { get; set; }
    public int? ConditionOfServiceID { get; set; }
    public int? DirectorateLevel { get; set; }
    public string? FinYear { get; set; }
}
