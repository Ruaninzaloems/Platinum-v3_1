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
    /// <param name="asOf">
    /// Date to use when evaluating reporting relationships and acting appointments.
    /// Defaults to <see cref="DateTime.UtcNow"/> when null, but callers should pass
    /// the overtime claim date so the chain is resolved against the relevant point in time.
    /// </param>
    Task<AssigneeBundle> ResolveAsync(string capturedForPositionId, DateTime? asOf = null, CancellationToken ct = default);
}

public class AssigneeBundle
{
    public DevUser? Recommender { get; set; }
    /// <summary>True when the recommender slot was filled by an active TemporaryActingAppointment.</summary>
    public bool RecommenderIsActing { get; set; }
    /// <summary>The approval-chain position (PositionApprovalConfig) the recommender was resolved from.</summary>
    public string? RecommenderPositionId { get; set; }
    public string? RecommenderPositionDescription { get; set; }

    public DevUser? Approver { get; set; }
    /// <summary>True when the approver slot was filled by an active TemporaryActingAppointment.</summary>
    public bool ApproverIsActing { get; set; }
    /// <summary>The approval-chain position (PositionApprovalConfig) the approver was resolved from.</summary>
    public string? ApproverPositionId { get; set; }
    public string? ApproverPositionDescription { get; set; }

    public DevUser? ExcessApprover { get; set; }
    public DevUser? PayrollCapturer { get; set; }
    public DevUser? PayrollApprover { get; set; }

    /// <summary>
    /// Non-null when the approval chain could not be fully resolved for the given position.
    /// Contains a human-readable explanation suitable for surfacing directly to the user.
    /// When set, <see cref="Recommender"/> and/or <see cref="Approver"/> will be null and
    /// the submission must be rejected.
    /// </summary>
    public string? ChainError { get; set; }
}
