namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Const_MOCDetail table. Holds the
/// actual Formula string evaluated by the overtime amount calculator
/// (e.g. "OverTimeHour * ((PrevSalary/ WHPM_Monthly) * 1.5)"). Active rows
/// are filtered by Enabled = true AND today between StartDate/EndDate.
///
/// Production SQL Server column types (verified 2026-05-11):
///   MOCDetail_ID int, MOCID int, Enabled bit,
///   StartDate datetime, EndDate datetime, Formula nvarchar.
/// </summary>
public class ConstMOCDetail
{
    public int MOCDetailId { get; set; }
    public int MOCId { get; set; }
    public bool? Enabled { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Formula { get; set; }
}
