using PlatinumOvertime_API.Models.Common;

namespace PlatinumOvertime_API.Models.Domain;

public class OvertimeWorkflowState
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OvertimeTransactionId { get; set; }
    public OvertimeTransaction? OvertimeTransaction { get; set; }

    public WorkflowStatus FromStatus { get; set; }
    public WorkflowStatus ToStatus { get; set; }

    public string? ActionedBy { get; set; }
    public string? Comments { get; set; }
    public DateTime ActionedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Snapshotted label for the chain position role at the time of action.
    /// Set to "Override Approver" when the action was taken by the master-approver
    /// override user (who has no chain-assigned position on the transaction).
    /// Null for normal workflow participants.
    /// </summary>
    public string? ChainPositionNote { get; set; }
}
