namespace MssqlApi.Models;

public class Employee
{
    public int Employee_ID { get; set; }
    public string? EmpCode { get; set; }
    public string IdNo { get; set; } = "";
    public int? TitleID { get; set; }
    public string? Initials { get; set; }
    public string FirstName { get; set; } = "";
    public string? SecondName { get; set; }
    public string Surname { get; set; } = "";
    public string? KnownAsName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public int GenderID { get; set; }
    public int? LanguageID { get; set; }
    public int? MarriedID { get; set; }
    public int? Dependants { get; set; }
    public string? PassportNumber { get; set; }
    public int? PassportCountryID { get; set; }
    public string? EmailAddress { get; set; }
    public string? HomeNumber { get; set; }
    public string? WorkNumber { get; set; }
    public string? CellNumber { get; set; }
    public string? FaxNumber { get; set; }
    public DateTime? JoiningDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? WorkOutside { get; set; }
    public string? IncomeTaxNumber { get; set; }
    public bool? ExcludeUIF { get; set; }
    public bool? ExcludeSDL { get; set; }
    public string? PhysicalAddress1 { get; set; }
    public string? PhysicalAddress2 { get; set; }
    public string? PhysicalPostalCode { get; set; }
    public int? PhysicalCountryID { get; set; }
    public int? PhysicalProvinceID { get; set; }
    public int? PhysicalTownID { get; set; }
    public bool? PostalSameAsPhysical { get; set; }
    public string? PostalAddress1 { get; set; }
    public string? PostalAddress2 { get; set; }
    public string? PostalPostalCode { get; set; }
    public int? PostalCountryID { get; set; }
    public int? PostalProvinceID { get; set; }
    public int? PostalTownID { get; set; }
    public int? PaymentTypeID { get; set; }
    public int? AccountTypeID { get; set; }
    public string? AccountHolderName { get; set; }
    public int? AccountHolderRelationshipID { get; set; }
    public string? AccountNumber { get; set; }
    public int? BankID { get; set; }
    public int? BranchID { get; set; }
    public decimal? AnnualSalary { get; set; }
    public decimal? FixedSalary { get; set; }
    public bool? Enabled { get; set; }
    public int CapturerID { get; set; }
    public DateTime DateCaptured { get; set; }
    public int? ModifierID { get; set; }
    public DateTime? DateModified { get; set; }
    public bool IsDummy { get; set; }
    public int? MunicipalityID { get; set; }
    public int? CycleID { get; set; }
    public int? PayrollDefinitionGroupID { get; set; }
    public int? EthnicGroupID { get; set; }
    public int? JobProfileID { get; set; }
    public int? TerminationReasonID { get; set; }
    public int? LeaveSchemeID { get; set; }
    public int? ConditionOfServiceID { get; set; }
    public bool? Isforeigner { get; set; }
    public int? TaxCalculationType { get; set; }
}
