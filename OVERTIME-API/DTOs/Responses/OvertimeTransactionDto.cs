using PlatinumOvertime_API.Models.Common;

namespace PlatinumOvertime_API.DTOs.Responses;

public class OvertimeTransactionDto
{
    public Guid Id { get; set; }

    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
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
    public decimal Amount { get; set; }

    public string? Reason { get; set; }
    public WorkflowStatus Status { get; set; }
    public string StatusLabel { get; set; } = string.Empty;

    public string? RecommenderEmployeeName { get; set; }
    public string? RecommenderPositionDescription { get; set; }
    public string? ApproverEmployeeName { get; set; }
    public string? ApproverPositionDescription { get; set; }
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
    public string? Comments { get; set; }
    public DateTime ActionedAt { get; set; }
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
    public List<MeDto> AvailableUsers { get; set; } = new();
}

public class AmountPreviewDto
{
    public decimal Amount { get; set; }
    public string Formula { get; set; } = string.Empty;
    public string SalaryHeadName { get; set; } = string.Empty;
    public Dictionary<string, decimal> Inputs { get; set; } = new();
}
