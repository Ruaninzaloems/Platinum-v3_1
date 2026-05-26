namespace PlatinumOvertime_API.DTOs.Responses;

/// <summary>
/// Per-user action counts returned by GET /api/dashboard/summary.
/// Every authenticated user may call this endpoint regardless of module permissions.
/// Counts are 0 when the user does not hold the relevant workflow role.
/// </summary>
public class DashboardSummaryDto
{
    public int AwaitingMyRecommendation  { get; init; }
    public int AwaitingMyApproval        { get; init; }
    public int AwaitingPayrollCapture    { get; init; }
    public int AwaitingPayrollApproval   { get; init; }
    public int CapturedByMeInProgress    { get; init; }
    public int ReturnedToMe              { get; init; }
}
