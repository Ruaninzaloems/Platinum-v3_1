namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy User_UserDetail table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// One row per Platinum portal user. Carries credential, contact and
/// authorisation flags plus an optional link to a Payroll_Employee row
/// via <see cref="EmpId"/>. The overtime module reads usernames + the
/// EmpId link when surfacing approver / capturer identities.
///
/// Sensitive columns (Password, TransactionPassword, SignatureImage) are
/// mapped for completeness but MUST NEVER be logged or exposed via the API.
/// Source seed data has these fields null.
///
/// Production SQL Server column types (verified 2026-05-11):
///   User_ID int, UserName varchar, Password varchar, Company varchar,
///   TelNo varchar, eMail varchar, FirstName varchar, LastName varchar,
///   EmpID int, DepartmentID int, Enabled bit, TotalLogin int,
///   LastLoginDate datetime, sendSMS bit, SuperUser bit,
///   DateCaptured datetime, CapturerID int, PasswordNeverExpire bit,
///   PasswordLastChangedDate datetime, ModifierID int,
///   DateModified datetime, TemporaryPassword bit, CashFloat decimal,
///   StartDate datetime, EndDate datetime, HistoricUser varchar,
///   TransactionPassword varchar, SignatureFilePath varchar,
///   SignatureUploadedOn datetime, SignatureImage varbinary,
///   SignatureImageMimeType nvarchar.
/// </summary>
public class UserUserDetail
{
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public string? Password { get; set; }
    public string? Company { get; set; }
    public string? TelNo { get; set; }
    public string? EMail { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public int? EmpId { get; set; }
    public int? DepartmentId { get; set; }
    public bool? Enabled { get; set; }
    public int? TotalLogin { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public bool? SendSMS { get; set; }
    public bool? SuperUser { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerId { get; set; }
    public bool? PasswordNeverExpire { get; set; }
    public DateTime? PasswordLastChangedDate { get; set; }
    public int? ModifierId { get; set; }
    public DateTime? DateModified { get; set; }
    public bool? TemporaryPassword { get; set; }
    public decimal? CashFloat { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? HistoricUser { get; set; }
    public string? TransactionPassword { get; set; }
    public string? SignatureFilePath { get; set; }
    public DateTime? SignatureUploadedOn { get; set; }
    public byte[]? SignatureImage { get; set; }
    public string? SignatureImageMimeType { get; set; }
}
