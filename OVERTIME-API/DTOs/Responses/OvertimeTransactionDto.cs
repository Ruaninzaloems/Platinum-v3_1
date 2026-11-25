using PlatinumOvertime_API.Models.Common;

namespace PlatinumOvertime_API.DTOs.Responses;

public class OvertimeTransactionDto
{
    public Guid Id { get; set; }

    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    /// <summary>Division from the employee's position at capture time.</summary>
    public string? DivisionName { get; set; }
    public string PositionId { get; set; } = string.Empty;

    // Legacy payroll classification snapshots (Const_*/Payroll_*).
    // Null for transactions captured before the dropdowns shipped.
    public int? LegacyDepartmentId { get; set; }
    public string? LegacyDepartmentName { get; set; }
    public int? LegacyDivisionId { get; set; }
    public string? LegacyDivisionName { get; set; }

    public DateTime OvertimeDate { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public decimal Hours { get; set; }
    public decimal HoursAlreadyCapturedThisMonth { get; set; }
    public bool IsExcess { get; set; }

    public int SalaryHeadId { get; set; }
    public string SalaryHeadName { get; set; } = string.Empty;
    public string FormulaSnapshot { get; set; } = string.Empty;
    /// <summary>
    /// Formula with variable names substituted by their captured values, e.g.
    /// "4 * ((45 650,00 / 160,00) * 1.5)".  Null for rows captured before this
    /// column was added.
    /// </summary>
    public string? FormulaWithValuesSnapshot { get; set; }
    public decimal Amount { get; set; }

    public string? Reason { get; set; }
    public WorkflowStatus Status { get; set; }
    public string StatusLabel { get; set; } = string.Empty;

    public string? RecommenderEmployeeName { get; set; }
    /// <summary>
    /// The approval-chain position label (e.g. "Dep Dir: Expenditure &amp; SCM (681)").
    /// Sourced from the snapshotted chain position, NOT the employee's home position,
    /// so it is correct even when an acting appointee fills the seat.
    /// Falls back to the employee's home position for legacy rows that pre-date the chain-position snapshot.
    /// </summary>
    public string? RecommenderPositionDescription { get; set; }
    /// <summary>True when the snapshotted recommender was assigned via an acting appointment
    /// (i.e. they are covering the chain position, not the permanent holder).</summary>
    public bool RecommenderIsActing { get; set; }
    /// <summary>Name of the permanent position holder when RecommenderIsActing is true.</summary>
    public string? RecommenderPrimaryHolderName { get; set; }
    public string? RecommenderActingEmployeeId { get; set; }
    public string? RecommenderActingEmployeeName { get; set; }
    public string? ApproverEmployeeName { get; set; }
    /// <summary>
    /// The approval-chain position label (e.g. "Dep Dir: Expenditure &amp; SCM (681)").
    /// Sourced from the snapshotted chain position, NOT the employee's home position.
    /// Falls back to the employee's home position for legacy rows that pre-date the chain-position snapshot.
    /// </summary>
    public string? ApproverPositionDescription { get; set; }
    /// <summary>True when the snapshotted approver was assigned via an acting appointment.</summary>
    public bool ApproverIsActing { get; set; }
    /// <summary>Name of the permanent position holder when ApproverIsActing is true.</summary>
    public string? ApproverPrimaryHolderName { get; set; }
    public string? ApproverActingEmployeeId { get; set; }
    public string? ApproverActingEmployeeName { get; set; }
    public string? ExcessApproverEmployeeId { get; set; }
    public string? ExcessApproverEmployeeName { get; set; }
    public string? ExcessApproverPositionDescription { get; set; }
    public string? PayrollCapturerEmployeeName { get; set; }
    public string? PayrollApproverEmployeeName { get; set; }

    public string? CurrentAssigneeUserId { get; set; }

    public string? CapturedBy { get; set; }
    public string? CapturedByName { get; set; }
    public string? CapturedByEmployeeName { get; set; }
    public string? CapturedByEmployeeId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<OvertimeDocumentDto> Documents { get; set; } = new();
    public List<WorkflowEventDto> WorkflowHistory { get; set; } = new();
}

public class OvertimeDocumentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string? UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class WorkflowEventDto
{
    public Guid Id { get; set; }
    public WorkflowStatus FromStatus { get; set; }
    public WorkflowStatus ToStatus { get; set; }
    public string? ActionedBy { get; set; }
    /// <summary>
    /// Resolved Payroll_Employee name for the user who actioned this step.
    /// Populated server-side so the UI can compare against the snapshotted
    /// primary approver/recommender name and detect acting situations.
    /// </summary>
    public string? ActionedByEmployeeName { get; set; }
    public string? Comments { get; set; }
    public DateTime ActionedAt { get; set; }
    /// <summary>
    /// Snapshotted label for the chain position role at the time of action.
    /// "Override Approver" when actioned by the master-approver override user;
    /// null for normal workflow participants (UI falls back to position lookup).
    /// </summary>
    public string? ChainPositionNote { get; set; }
}

public class MeDto
{
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string PositionId { get; set; } = string.Empty;
    public string PositionDescription { get; set; } = string.Empty;
    public bool IsCapturer { get; set; }
    public bool IsRecommender { get; set; }
    public bool IsApprover { get; set; }
    public bool IsExcessApprover { get; set; }
    public bool IsPayrollCapturer { get; set; }
    public bool IsPayrollApprover { get; set; }
    public bool CanAccessConfig { get; set; }
    public bool CanAccessCapture { get; set; }
    public bool CanAccessPayroll { get; set; }
    public bool CanAccessEnquiry { get; set; }
    /// <summary>
    /// True when the current user holds the position configured as the global
    /// master-approver override in OvertimeConfig.OverridePositionId.
    /// Resolved dynamically on each /api/auth/me call so config changes take
    /// effect without requiring a re-login.
    /// </summary>
    public bool IsOverrideUser { get; set; }
    public List<MeDto> AvailableUsers { get; set; } = new();
    /// <summary>
    /// UserIds of primary position holders that the current user is actively
    /// deputising for via a TemporaryActingAppointment today.
    /// The UI uses this to show action buttons on transactions assigned to those users.
    /// </summary>
    public List<string> ActingForUserIds { get; set; } = new();
}

public class AmountPreviewDto
{
    public decimal Amount { get; set; }
    public string Formula { get; set; } = string.Empty;
    public string SalaryHeadName { get; set; } = string.Empty;
    /// <summary>
    /// Salary-derived variable values used in the formula calculation.
    /// Null when the caller is a capture-only user (no recommender or approver role).
    /// The UI should gate display of this field on it being non-null.
    /// </summary>
    public Dictionary<string, decimal>? Inputs { get; set; }
}
