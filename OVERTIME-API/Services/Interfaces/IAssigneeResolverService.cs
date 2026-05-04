using PlatinumOvertime_API.Services.Implementations;

namespace PlatinumOvertime_API.Services.Interfaces;

/// <summary>
/// Walks the position-approval graph + dev user directory to figure out
/// which person fills each role for a given employee's overtime claim.
/// Returned users are dev directory entries; in production this same
/// interface would resolve to real Platinum employee records via the same
/// PositionApprovalConfig data.
/// </summary>
public interface IAssigneeResolverService
{
    Task<AssigneeBundle> ResolveAsync(string capturedForPositionId, CancellationToken ct = default);
}

public class AssigneeBundle
{
    public DevUser? Recommender { get; set; }
    public DevUser? Approver { get; set; }
    public DevUser? ExcessApprover { get; set; }
    public DevUser? PayrollCapturer { get; set; }
    public DevUser? PayrollApprover { get; set; }
}
