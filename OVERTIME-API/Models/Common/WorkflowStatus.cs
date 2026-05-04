namespace PlatinumOvertime_API.Models.Common;

/// <summary>
/// Workflow statuses for an overtime transaction.
/// Defined here for reference; transitions are not yet implemented (follow-up task).
/// </summary>
public enum WorkflowStatus
{
    Requested = 0,
    Recommended = 1,
    ApprovedForPayment = 2,
    AwaitingPayrollApproval = 3,
    Processed = 4,
    Returned = 5,
    Rejected = 99
}
