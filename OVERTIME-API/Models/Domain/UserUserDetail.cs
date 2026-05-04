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
/// Sensitive columns (<c>Password</c>, <c>TransactionPassword</c>,
/// <c>SignatureImage</c>) are mapped for completeness but MUST NEVER be
/// logged or exposed via the API. Source seed data has these fields null.
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

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? LastLoginDate { get; set; }

    public bool? SendSMS { get; set; }
    public bool? SuperUser { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? DateCaptured { get; set; }

    public int? CapturerId { get; set; }
    public bool? PasswordNeverExpire { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? PasswordLastChangedDate { get; set; }

    public int? ModifierId { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? DateModified { get; set; }

    public bool? TemporaryPassword { get; set; }
    public decimal? CashFloat { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? StartDate { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? EndDate { get; set; }

    public bool? HistoricUser { get; set; }
    public string? TransactionPassword { get; set; }
    public string? SignatureFilePath { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? SignatureUploadedOn { get; set; }

    public string? SignatureImage { get; set; }
    public string? SignatureImageMimeType { get; set; }
}
