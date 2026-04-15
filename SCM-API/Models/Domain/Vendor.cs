using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("Cons_Vendor")]
public class Vendor
{
    [Key]
    [Column("Vendor_ID")]
    public int VendorId { get; set; }

    [Column("VendorName")]
    public string? VendorName { get; set; }

    [Column("TradingName")]
    public string? TradingName { get; set; }

    [Column("CompanyDirector")]
    public string? CompanyDirector { get; set; }

    [Column("RegistrationNumber")]
    public string? RegistrationNumber { get; set; }

    [Column("VendorCategoryID")]
    public int? VendorCategoryId { get; set; }

    [Column("VendorTypeID")]
    public int? VendorTypeId { get; set; }

    [Column("VatRegistered")]
    public bool? VatRegistered { get; set; }

    [Column("VatRegistrationNumber")]
    public string? VatRegistrationNumber { get; set; }

    [Column("TaxCertificateNumber")]
    public string? TaxCertificateNumber { get; set; }

    [Column("PostalAddress1")]
    public string? PostalAddress1 { get; set; }

    [Column("PostalAddress2")]
    public string? PostalAddress2 { get; set; }

    [Column("PhysicalAddress1")]
    public string? PhysicalAddress1 { get; set; }

    [Column("PhysicalAddress2")]
    public string? PhysicalAddress2 { get; set; }

    [Column("Country")]
    public string? Country { get; set; }

    [Column("Tel_Home")]
    public string? TelHome { get; set; }

    [Column("Tel_Work")]
    public string? TelWork { get; set; }

    [Column("Tel_Mobile")]
    public string? TelMobile { get; set; }

    [Column("Fax")]
    public string? Fax { get; set; }

    [Column("email")]
    public string? Email { get; set; }

    [Column("Website")]
    public string? Website { get; set; }

    [Column("BankID")]
    public int? BankId { get; set; }

    [Column("BankAccountTypeID")]
    public int? BankAccountTypeId { get; set; }

    [Column("BankAccountNumber")]
    public string? BankAccountNumber { get; set; }

    [Column("CreditLimit")]
    public decimal? CreditLimit { get; set; }

    [Column("BEEPercentage")]
    public decimal? BeePercentage { get; set; }

    [Column("HDI")]
    public bool? Hdi { get; set; }

    [Column("PDIPercentage")]
    public decimal? PdiPercentage { get; set; }

    [Column("Woman")]
    public bool? Woman { get; set; }

    [Column("Disabled")]
    public bool? Disabled { get; set; }

    [Column("VendorBBBEEContributorLevelID")]
    public int? VendorBbbeeContributorLevelId { get; set; }

    [Column("CSDSupplierNumber")]
    public string? CsdSupplierNumber { get; set; }

    [Column("IsCSDImport")]
    public bool? IsCsdImport { get; set; }

    [Column("bActivatedForSCM")]
    public bool? ActivatedForScm { get; set; }

    [Column("DiscountRate")]
    public decimal? DiscountRate { get; set; }

    [Column("QualifyingDays")]
    public int? QualifyingDays { get; set; }

    [Column("VendorCreditor")]
    public bool? VendorCreditor { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    [Column("Approved")]
    public bool? Approved { get; set; }

    [Column("Status")]
    public int? Status { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("IsNTBackList")]
    public bool? IsNtBlackList { get; set; }

    [Column("BlackListedFromDate")]
    public DateTime? BlackListedFromDate { get; set; }

    [Column("BlackListedTo")]
    public DateTime? BlackListedTo { get; set; }

    [Column("BlackListedBy")]
    public int? BlackListedBy { get; set; }

    [Column("BlackListReason")]
    public string? BlackListReason { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    public virtual ICollection<VendorBankingDetail> BankingDetails { get; set; } = new List<VendorBankingDetail>();
    public virtual ICollection<VendorContactDetail> ContactDetails { get; set; } = new List<VendorContactDetail>();
    public virtual ICollection<VendorOwner> Owners { get; set; } = new List<VendorOwner>();
}

[Table("Cons_VendorBankingDetails")]
public class VendorBankingDetail
{
    [Key]
    [Column("VendorBankingDetails_ID")]
    public int VendorBankingDetailsId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("BankID")]
    public int? BankId { get; set; }

    [Column("BankAccountTypeID")]
    public int? BankAccountTypeId { get; set; }

    [Column("BankAccountNumber")]
    public string? BankAccountNumber { get; set; }

    [Column("BankBranchCode")]
    public string? BankBranchCode { get; set; }

    [Column("CSDBankAccountID")]
    public string? CsdBankAccountId { get; set; }

    [Column("IsVerified")]
    public bool? IsVerified { get; set; }

    [ForeignKey("VendorId")]
    public virtual Vendor? Vendor { get; set; }
}

[Table("Cons_VendorContactDetails")]
public class VendorContactDetail
{
    [Key]
    [Column("VendorContactDetails_ID")]
    public int VendorContactDetailsId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("IsPrefered")]
    public bool? IsPreferred { get; set; }

    [Column("ContactPerson")]
    public string? ContactPerson { get; set; }

    [Column("IdentificationNumber")]
    public string? IdentificationNumber { get; set; }

    [Column("PostalAddress1")]
    public string? PostalAddress1 { get; set; }

    [Column("PostalAddress2")]
    public string? PostalAddress2 { get; set; }

    [Column("PhysicalAddress1")]
    public string? PhysicalAddress1 { get; set; }

    [Column("PhysicalAddress2")]
    public string? PhysicalAddress2 { get; set; }

    [Column("ProvinceID")]
    public int? ProvinceId { get; set; }

    [Column("Tel_Home")]
    public string? TelHome { get; set; }

    [Column("Tel_Work")]
    public string? TelWork { get; set; }

    [Column("Tel_Mobile")]
    public string? TelMobile { get; set; }

    [Column("Fax")]
    public string? Fax { get; set; }

    [Column("email")]
    public string? Email { get; set; }

    [Column("Website")]
    public string? Website { get; set; }

    [Column("Ward")]
    public string? Ward { get; set; }

    [ForeignKey("VendorId")]
    public virtual Vendor? Vendor { get; set; }
}

[Table("Cons_VendorOwners")]
public class VendorOwner
{
    [Key]
    [Column("VendorOwners_ID")]
    public int VendorOwnersId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("LastName")]
    public string? LastName { get; set; }

    [Column("FirstName")]
    public string? FirstName { get; set; }

    [Column("IdentityNumber")]
    public string? IdentityNumber { get; set; }

    [Column("HDI")]
    public bool? Hdi { get; set; }

    [Column("Disability")]
    public bool? Disability { get; set; }

    [Column("GenderID")]
    public int? GenderId { get; set; }

    [Column("OwnedPercentage")]
    public decimal? OwnedPercentage { get; set; }

    [Column("VotingPercentage")]
    public decimal? VotingPercentage { get; set; }

    [Column("IsSouthAfrican")]
    public bool? IsSouthAfrican { get; set; }

    [ForeignKey("VendorId")]
    public virtual Vendor? Vendor { get; set; }
}

[Table("SCM_VendorRegistration")]
public class VendorRegistration
{
    [Key]
    [Column("VendorRegistration_ID")]
    public int VendorRegistrationId { get; set; }

    [Column("CompanyName")]
    public string? CompanyName { get; set; }

    [Column("CompanyTypeID")]
    public int CompanyTypeId { get; set; }

    [Column("FirstName")]
    public string? FirstName { get; set; }

    [Column("LastName")]
    public string? LastName { get; set; }

    [Column("EmailAddress")]
    public string? EmailAddress { get; set; }

    [Column("UserName")]
    public string? UserName { get; set; }

    [Column("Password")]
    public string? Password { get; set; }

    [Column("ContactName")]
    public string? ContactName { get; set; }

    [Column("Status")]
    public bool? Status { get; set; }

    [Column("Reason")]
    public string? Reason { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("VendorClassificationID")]
    public int? VendorClassificationId { get; set; }

    [Column("RegistrationTypeID")]
    public int? RegistrationTypeId { get; set; }

    [Column("ServiceProviderNumber")]
    public string? ServiceProviderNumber { get; set; }

    [Column("NameofBusinessforTradingPurpose")]
    public string? TradingName { get; set; }

    [Column("CompensationCommisioner")]
    public string? CompensationCommissioner { get; set; }

    [Column("VATRegistrationNo")]
    public string? VatRegistrationNo { get; set; }

    [Column("IncomeTaxRefNumber")]
    public string? IncomeTaxRefNumber { get; set; }

    [Column("PAYENumber")]
    public string? PayeNumber { get; set; }

    [Column("CIPROCompanyNo")]
    public string? CiproCompanyNo { get; set; }

    [Column("DidyourBusinessExist")]
    public bool? DidBusinessExist { get; set; }

    [Column("PreviousBusinessName")]
    public string? PreviousBusinessName { get; set; }

    [Column("BankID")]
    public int? BankId { get; set; }

    [Column("BranchCodeID")]
    public int? BranchCodeId { get; set; }

    [Column("AccountNumber")]
    public string? AccountNumber { get; set; }

    [Column("BBBEEContributorID")]
    public int? BbbeeContributorId { get; set; }

    [Column("ContractPerson")]
    public string? ContractPerson { get; set; }

    [Column("TelephoneNumber")]
    public string? TelephoneNumber { get; set; }

    [Column("CellphoneNumber")]
    public string? CellphoneNumber { get; set; }

    [Column("FaxNumber")]
    public string? FaxNumber { get; set; }

    [Column("Email")]
    public string? Email { get; set; }

    [Column("PostalAddress")]
    public string? PostalAddress { get; set; }

    [Column("TownID")]
    public int? TownId { get; set; }

    [Column("PostalCode")]
    public string? PostalCode { get; set; }

    [Column("PhysicalAddress")]
    public string? PhysicalAddress { get; set; }

    [Column("ProvinceID")]
    public int? ProvinceId { get; set; }

    [Column("PhysicalTownID")]
    public int? PhysicalTownId { get; set; }

    [Column("PhysicalPostalCode")]
    public string? PhysicalPostalCode { get; set; }

    [Column("EasternCapeOffice")]
    public string? EasternCapeOffice { get; set; }

    [Column("NationalOffices")]
    public string? NationalOffices { get; set; }

    [Column("WebsiteAddress")]
    public string? WebsiteAddress { get; set; }

    [Column("PrefferedMethodID")]
    public int? PreferredMethodId { get; set; }

    [Column("Varified")]
    public bool? Verified { get; set; }

    [Column("VAT")]
    public bool? Vat { get; set; }

    [Column("Income")]
    public bool? Income { get; set; }

    [Column("ExpiryDate")]
    public DateTime? ExpiryDate { get; set; }

    [Column("Approved")]
    public bool? Approved { get; set; }

    [Column("NTBackList")]
    public bool? NtBlackList { get; set; }

    [Column("VATRegistration")]
    public bool? VatRegistration { get; set; }

    [Column("VendorNumber")]
    public string? VendorNumber { get; set; }

    [Column("DirectiveOrderID")]
    public int? DirectiveOrderId { get; set; }

    public virtual ICollection<VendorShareHolderDetail> ShareHolders { get; set; } = new List<VendorShareHolderDetail>();
    public virtual ICollection<VendorBusinessArea> BusinessAreas { get; set; } = new List<VendorBusinessArea>();
}

[Table("SCM_VendorDocumentDetails")]
public class VendorDocumentDetail
{
    [Key]
    [Column("DocumentDetails_ID")]
    public int DocumentDetailsId { get; set; }

    [Column("VendorID")]
    public int VendorId { get; set; }

    [Column("DocumentTypeID")]
    public int DocumentTypeId { get; set; }

    [Column("DocumentPath")]
    public string? DocumentPath { get; set; }

    [Column("ExpiryDate")]
    public DateTime? ExpiryDate { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("BusinessAreaID")]
    public int? BusinessAreaId { get; set; }

    [Column("ExpireEmailSend")]
    public bool? ExpireEmailSend { get; set; }

    [Column("DocumentNumber")]
    public string? DocumentNumber { get; set; }

    [Column("IsDocReceived")]
    public bool? IsDocReceived { get; set; }

    [Column("IsRequired")]
    public bool? IsRequired { get; set; }

    [Column("DoStatusID")]
    public int? DoStatusId { get; set; }

    [Column("LastVerificationDate")]
    public DateTime? LastVerificationDate { get; set; }

    [Column("Comments")]
    public string? Comments { get; set; }
}

[Table("SCM_VendorIssueRegister")]
public class VendorIssueRegister
{
    [Key]
    [Column("Issue_Id")]
    public int IssueId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("IssueNo")]
    public string? IssueNo { get; set; }

    [Column("IssueDescription")]
    public string? IssueDescription { get; set; }

    [Column("LoggedBy")]
    public int? LoggedBy { get; set; }

    [Column("LoggedDate")]
    public DateTime? LoggedDate { get; set; }

    [Column("ResolvedDate")]
    public DateTime? ResolvedDate { get; set; }

    [Column("IssueStatusId")]
    public int? IssueStatusId { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    public virtual ICollection<VendorIssueRegisterDetail> Details { get; set; } = new List<VendorIssueRegisterDetail>();
}

[Table("SCM_VendorIssueRegisterDetails")]
public class VendorIssueRegisterDetail
{
    [Key]
    [Column("Contact_ID")]
    public int ContactId { get; set; }

    [Column("IssueID")]
    public int? IssueId { get; set; }

    [Column("ContactNo")]
    public string? ContactNo { get; set; }

    [Column("ContactDate")]
    public DateTime? ContactDate { get; set; }

    [Column("Comments")]
    public string? Comments { get; set; }

    [Column("ContactType")]
    public int? ContactType { get; set; }

    [Column("ContactBy")]
    public int? ContactBy { get; set; }

    [Column("ElapsedDays")]
    public int? ElapsedDays { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("ContactTypeText")]
    public string? ContactTypeText { get; set; }

    [Column("FAX")]
    public bool? Fax { get; set; }

    [Column("Email")]
    public bool? Email { get; set; }

    [ForeignKey("IssueId")]
    public virtual VendorIssueRegister? Issue { get; set; }
}

[Table("SCM_VendorShareHolderDetails")]
public class VendorShareHolderDetail
{
    [Key]
    [Column("ShareHolder_ID")]
    public int ShareHolderId { get; set; }

    [Column("VendorID")]
    public int VendorId { get; set; }

    [Column("Name")]
    public string? Name { get; set; }

    [Column("IDNumber")]
    public string? IdNumber { get; set; }

    [Column("PassportNumber")]
    public string? PassportNumber { get; set; }

    [Column("Citizenship")]
    public string? Citizenship { get; set; }

    [Column("DateofOwnership")]
    public DateTime? DateOfOwnership { get; set; }

    [Column("Owned")]
    public decimal? Owned { get; set; }

    [Column("Voting")]
    public decimal? Voting { get; set; }

    [Column("HDI")]
    public bool? Hdi { get; set; }

    [Column("Disability")]
    public bool? Disability { get; set; }

    [Column("Female")]
    public bool? Female { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [ForeignKey("VendorId")]
    public virtual VendorRegistration? Registration { get; set; }
}

[Table("SCM_VendorBusinessArea")]
public class VendorBusinessArea
{
    [Key]
    [Column("VendorBusinessArea_ID")]
    public int VendorBusinessAreaId { get; set; }

    [Column("VendorID")]
    public int VendorId { get; set; }

    [Column("SectorID")]
    public int SectorId { get; set; }

    [Column("BusinessAreaID")]
    public int BusinessAreaId { get; set; }

    [Column("SubSectorID")]
    public int SubSectorId { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [ForeignKey("VendorId")]
    public virtual VendorRegistration? Registration { get; set; }
}

[Table("Cons_VendorProfessionalBody")]
public class VendorProfessionalBody
{
    [Key]
    [Column("VendorProfBody_ID")]
    public int VendorProfBodyId { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("ProfessionalBodyID")]
    public int? ProfessionalBodyId { get; set; }

    [Column("RegistrationNumber")]
    public string? RegistrationNumber { get; set; }

    [Column("ContractorGrading")]
    public string? ContractorGrading { get; set; }

    [Column("AccreditationExpiryDate")]
    public DateTime? AccreditationExpiryDate { get; set; }

    [Column("AccreditationGrade")]
    public string? AccreditationGrade { get; set; }
}
