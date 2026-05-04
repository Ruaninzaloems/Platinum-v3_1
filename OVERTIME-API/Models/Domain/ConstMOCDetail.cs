namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Const_MOCDetail table. Holds the
/// actual Formula string evaluated by the overtime amount calculator
/// (e.g. "OverTimeHour * ((PrevSalary/ WHPM_Monthly) * 1.5)"). Active rows
/// are filtered by Enabled = true AND today between StartDate/EndDate
/// (Excel-serial date numbers in dev; real datetime2 in prod).
/// </summary>
public class ConstMOCDetail
{
    public int MOCDetailId { get; set; }
    public int MOCId { get; set; }
    public bool? Enabled { get; set; }
    public decimal? StartDate { get; set; }
    public decimal? EndDate { get; set; }
    public string? Formula { get; set; }
}
