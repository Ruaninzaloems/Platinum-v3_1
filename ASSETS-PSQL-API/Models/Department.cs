namespace AssetManagement.Models;

public class Department
{
    public int Department_ID { get; set; }
    public string? DepartmentDesc { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public string? DepartmentCode { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? VatApportionment { get; set; }
    public int? ManagerPositionID { get; set; }
    public DateTime? ManagerStartDate { get; set; }
    public DateTime? ManagerEndDate { get; set; }
    public string? FinYear { get; set; }
}
