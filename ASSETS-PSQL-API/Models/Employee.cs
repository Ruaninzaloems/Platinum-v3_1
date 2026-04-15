namespace AssetManagement.Models;

public class Employee
{
    public int Employee_ID { get; set; }
    public string? EmpCode { get; set; }
    public string? IdNo { get; set; }
    public int? TitleID { get; set; }
    public string? Initials { get; set; }
    public string? FirstName { get; set; }
    public string? SecondName { get; set; }
    public string? Surname { get; set; }
    public string? KnownAsName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public int? GenderID { get; set; }
    public string? EmailAddress { get; set; }
    public string? CellNumber { get; set; }
    public DateTime? JoiningDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Enabled { get; set; } = 1;
    public int? CapturerID { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? ModifierID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? IsDummy { get; set; }
    public int? PositionID { get; set; }
    public int? EmployeeTypeID { get; set; }
    public int? MunicipalityID { get; set; }
}
